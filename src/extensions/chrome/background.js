/**
 * MyBookmarks Companion Extension - Background Service Worker
 * Handles bookmark operations and metadata fetching
 */


// Cache for metadata to avoid repeated fetches
const metadataCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('===== BACKGROUND SCRIPT MESSAGE =====');
  console.log('Action:', request.action);
  console.log('From:', sender.url || sender.tab?.url || 'unknown');
  console.log('Request data:', request);

  switch(request.action) {
    case 'setDavAuth':
      try {
        davAuth = request.auth || null;
        try { console.log('[DAV][BG] setDavAuth stored for host', (new URL(davAuth?.serverUrl||'')).hostname); } catch {}
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    case 'getBookmarks':
      console.log('Getting bookmarks...');
      handleGetBookmarks().then(result => {
        console.log('Bookmarks result:', result);
        sendResponse(result);
      }).catch(err => {
        console.log('Error getting bookmarks:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true; // Keep channel open for async response

    case 'fetchMetadata':
      console.log('Fetching metadata for URL:', request.url, 'Options:', request.options);
      handleFetchMetadata(request.url, request.options || {}).then(result => {
        console.log('Metadata result:', result);
        sendResponse(result);
      }).catch(err => {
        console.log('Error fetching metadata:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'clearCache':
      try {
        const cleared = metadataCache.size;
        metadataCache.clear();
        console.log('[EXT] Cleared metadata cache entries:', cleared);
        sendResponse({ success: true, cleared });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;

    case 'batchFetchMetadata':
      console.log('Batch fetching metadata for URLs:', request.urls);
      handleBatchFetchMetadata(request.urls).then(sendResponse);
      return true;

    case 'addBookmark':
      console.log('Adding bookmark:', request.bookmark);
      handleAddBookmark(request.bookmark).then(sendResponse);
      return true;

    case 'davRequest':
      console.log('DAV request:', request.request);
      handleDavRequest(request.request).then(sendResponse).catch(err => {
        console.log('Error in davRequest:', err);
        sendResponse({ ok: false, status: 0, statusText: err.message || 'Error', error: err.message });
      });
      return true;

    case 'proxyFetch':
      console.log('[PROXY] Fetch request received:', request.request?.url);
      handleProxyFetch(request.request || {}).then(result => {
        sendResponse(result);
      }).catch(err => {
        console.warn('[PROXY] Failed:', err);
        sendResponse({ error: err.message || 'Proxy fetch failed' });
      });
      return true;

    case 'ping':
      console.log('Ping received');
      sendResponse({ success: true, message: 'Extension is active' });
      break;

    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * Get all bookmarks from browser
 */
async function handleGetBookmarks() {
  try {
    console.log('Getting browser bookmarks...');

    // Debug what APIs are available
    console.log('typeof browser:', typeof browser);
    console.log('typeof chrome:', typeof chrome);

    if (typeof browser !== 'undefined') {
      console.log('browser.bookmarks available?', !!browser.bookmarks);
      if (browser.bookmarks) {
        console.log('browser.bookmarks.getTree available?', !!browser.bookmarks.getTree);
      }
    }

    if (typeof chrome !== 'undefined') {
      console.log('chrome.bookmarks available?', !!chrome.bookmarks);
      if (chrome.bookmarks) {
        console.log('chrome.bookmarks.getTree available?', !!chrome.bookmarks.getTree);
      }
    }

    // In Firefox, we need to use chrome API even though browser is available
    // because browser.bookmarks might not be properly polyfilled
    const bookmarksAPI = chrome.bookmarks;

    if (!bookmarksAPI) {
      console.error('Bookmarks API not available');
      return {
        success: false,
        error: 'Bookmarks API not available - check extension permissions'
      };
    }

    console.log('Using chrome.bookmarks API');

    // Get the bookmark tree - use callback pattern for better compatibility
    let bookmarkTree;
    try {
      bookmarkTree = await new Promise((resolve, reject) => {
        console.log('Calling chrome.bookmarks.getTree...');
        chrome.bookmarks.getTree((tree) => {
          console.log('getTree callback received');
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            console.log('Tree received:', tree);
            resolve(tree);
          }
        });
      });
      console.log('Successfully retrieved bookmark tree');
    } catch (apiError) {
      console.error('Error calling getTree:', apiError.message);
      return {
        success: false,
        error: `Failed to get bookmarks: ${apiError.message}`
      };
    }

    console.log('Raw bookmark tree:', JSON.stringify(bookmarkTree, null, 2));

    // Check if we got a valid tree
    if (!bookmarkTree || bookmarkTree.length === 0) {
      console.log('Empty bookmark tree returned');
      return {
        success: false,
        error: 'No bookmark tree returned from browser'
      };
    }

    // Debug the root node structure
    console.log('Root node:', bookmarkTree[0]);
    console.log('Root node children:', bookmarkTree[0].children);

    const processed = processBookmarkTree(bookmarkTree[0]);

    // The processed structure is already flat, so counting is simpler
    let totalLinks = 0;
    let totalGroups = processed.children.length;

    processed.children.forEach(group => {
      totalLinks += group.links.length;
    });

    console.log(`Final count: ${totalLinks} bookmarks in ${totalGroups} groups`);

    return {
      success: true,
      bookmarks: processed,
      stats: {
        links: totalLinks,
        folders: totalGroups
      }
    };
  } catch (error) {
    console.log('Error getting bookmarks:', error);
    console.log('Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process bookmark tree into MyBookmarks format
 * Flattens the structure to max 2 levels: groups and links
 */
function processBookmarkTree(node) {
  console.log('Starting to process bookmark tree...');

  // Collect all bookmarks into flat groups
  const groups = new Map();
  const rootGroup = {
    id: 'root',
    title: 'Unsorted Bookmarks',
    path: '',
    links: []
  };

  // Recursive function to traverse the tree
  function traverseNode(node, pathParts = []) {
    if (!node.children) return;

    for (const child of node.children) {
      if (child.url) {
        // It's a bookmark - add to appropriate group
        const groupPath = pathParts.join(' / ');
        const groupTitle = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Unsorted Bookmarks';

        if (!groups.has(groupPath)) {
          groups.set(groupPath, {
            id: groupPath || 'root',
            title: groupTitle,
            path: groupPath,
            links: []
          });
        }

        groups.get(groupPath).links.push({
          id: child.id,
          text: child.title || child.url,
          url: child.url,
          dateAdded: child.dateAdded
        });

      } else if (child.children) {
        // It's a folder - traverse deeper
        const newPath = [...pathParts];

        // Skip root level folders like "Bookmarks Menu", "Bookmarks Toolbar" etc.
        if (pathParts.length > 0 || !['menu________', 'toolbar_____', 'unfiled_____', 'mobile______'].includes(child.id)) {
          if (child.title && child.title !== '') {
            newPath.push(child.title);
          }
        }

        traverseNode(child, newPath);
      }
    }
  }

  // Start traversal
  traverseNode(node);

  // Convert map to array and filter out empty groups
  const groupArray = Array.from(groups.values()).filter(g => g.links.length > 0);

  // Sort groups by path for better organization
  groupArray.sort((a, b) => a.path.localeCompare(b.path));

  console.log(`Processed ${groupArray.length} groups with bookmarks`);

  // Build the result in MyBookmarks format
  const result = {
    id: 'browser-bookmarks',
    title: 'Browser Bookmarks',
    path: '',
    children: groupArray.map(group => ({
      id: group.id,
      title: group.title || 'Unsorted',
      path: group.path,
      children: [],
      links: group.links
    })),
    links: []
  };

  // Log summary
  let totalLinks = 0;
  result.children.forEach(group => {
    totalLinks += group.links.length;
    console.log(`Group "${group.title}": ${group.links.length} bookmarks`);
  });
  console.log(`Total: ${totalLinks} bookmarks in ${result.children.length} groups`);

  return result;
}

/**
 * Handle generic WebDAV/CardDAV HTTP requests (supports PROPFIND/REPORT/etc.)
 */
async function handleDavRequest(req) {
  const { method = 'GET', url, headers = {}, body } = req || {};
  if (!url) throw new Error('URL is required');
  // Use fetch for Nextcloud Bookmarks REST; XHR for DAV methods
  const isBookmarks = /\/index\.php\/apps\/bookmarks\//.test(url);
  if (isBookmarks && /^(GET|POST|PATCH|DELETE)$/i.test(method)) {
    try {
      const h = Object.assign({}, headers||{});
      if (!('Accept' in h)) h['Accept'] = 'application/json';
      if (!('OCS-APIREQUEST' in h)) h['OCS-APIREQUEST'] = 'true';
      if (!('X-Requested-With' in h)) h['X-Requested-With'] = 'XMLHttpRequest';
      // Ensure Authorization present from stored davAuth if missing
      if ((!h['Authorization'] && !h['authorization']) && davAuth && davAuth.username!==undefined) {
        const up = `${davAuth.username||''}:${davAuth.password||''}`;
        h['Authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(up)));
      }
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), 20000);
      const res = await fetch(url, { method, headers:h, body, signal: ctrl.signal });
      clearTimeout(t);
      const text = await res.text();
      const outHeaders = {};
      try { res.headers.forEach((v,k)=>{ outHeaders[k]=v; }); } catch {}
      return { ok: res.ok, status: res.status, statusText: res.statusText, headers: outHeaders, bodyText: text };
    } catch (e) {
      return { ok:false, status:0, statusText: e.message||'Error', headers:{}, bodyText:'' };
    }
  }
  // Use XHR to ensure Authorization headers are preserved across proxies/servers
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      try {
        if (req.username !== undefined && req.password !== undefined) {
          xhr.open(method, url, true, req.username, req.password);
        } else {
          xhr.open(method, url, true);
        }
      } catch (e) {
        xhr.open(method, url, true);
      }
      // Set headers
      if (headers && typeof headers === 'object') {
        Object.keys(headers).forEach((k) => {
          try { xhr.setRequestHeader(k, String(headers[k])); } catch (e) { /* ignore invalid header */ }
        });
      }
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          // Parse response headers
          const raw = xhr.getAllResponseHeaders() || '';
          const outHeaders = {};
          raw.trim().split(/\r?\n/).forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
              const k = line.slice(0, idx).trim().toLowerCase();
              const v = line.slice(idx + 1).trim();
              outHeaders[k] = v;
            }
          });
          resolve({ ok: (xhr.status >= 200 && xhr.status < 300), status: xhr.status, statusText: xhr.statusText, headers: outHeaders, bodyText: xhr.responseText });
        }
      };
      xhr.onerror = function() {
        resolve({ ok: false, status: 0, statusText: 'Network Error', headers: {}, bodyText: '' });
      };
      if (body !== undefined && body !== null) xhr.send(body); else xhr.send();
    } catch (e) {
      resolve({ ok: false, status: 0, statusText: e.message || 'Error', headers: {}, bodyText: '' });
    }
  });
}

/**
 * Fetch metadata for a single URL
 */
async function handleFetchMetadata(url, options = {}) {
  try {
    // Check cache first (unless we need full content)
    if (!options.includeHtml) {
      const cached = getCachedMetadata(url);
      if (cached) {
        return cached;
      }
    }

    console.log('Fetching metadata for:', url, 'Options:', options);

    // Fetch the page
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const metadata = parseMetadata(text, url);

    // Include full HTML if requested (for import functionality)
    if (options.includeHtml) {
      metadata.html = text;

      // Also extract all links from the page
      metadata.links = extractLinksFromHtml(text, url);
    }

    // Try to fetch favicon
    if (metadata.faviconUrl) {
      console.log('Attempting to fetch favicon from:', metadata.faviconUrl);
      try {
        const faviconData = await fetchFaviconAsBase64(metadata.faviconUrl);
        if (faviconData) {
          console.log('Favicon fetched successfully, size:', faviconData.length);
          metadata.favicon = faviconData;
        } else {
          console.log('Favicon fetch returned empty data');
        }
      } catch (e) {
        console.log('Failed to fetch favicon:', e);
        // Still return metadata even if favicon fetch fails
      }
    } else {
      console.log('No favicon URL found in metadata');
    }

    // Cache the result (but not if we included HTML, as that would be too large)
    if (!options.includeHtml) {
      setCachedMetadata(url, metadata);
    }

    return metadata;
  } catch (error) {
    console.log('Error fetching metadata:', error);
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

/**
 * Extract all links from HTML content
 */
function extractLinksFromHtml(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const base = new URL(baseUrl);
  const links = [];
  const seen = new Set();

  console.log('Starting link extraction from HTML...');

  // Find all <a> tags with href
  const anchors = doc.querySelectorAll('a[href]');
  console.log(`Found ${anchors.length} anchor tags with href`);

  for (const anchor of anchors) {
    try {
      // Get href attribute
      const href = anchor.getAttribute('href');

      // Skip anchors and javascript links
      if (!href || href === '' || href === '#' || href.startsWith('javascript:') || href.startsWith('void(')) {
        continue;
      }

      // Skip mailto and tel links for now
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      // Create absolute URL
      let absoluteUrl;
      try {
        absoluteUrl = new URL(href, baseUrl).href;
      } catch (e) {
        console.log('Invalid URL:', href, e.message);
        continue;
      }

      // Skip duplicates
      if (seen.has(absoluteUrl)) {
        continue;
      }
      seen.add(absoluteUrl);

      // Extract link text - try multiple sources
      let text = '';

      // 1. Try direct text content
      text = anchor.textContent?.trim() || '';

      // 2. If no text, try title attribute
      if (!text) {
        text = anchor.getAttribute('title') || '';
      }

      // 3. If still no text, try aria-label
      if (!text) {
        text = anchor.getAttribute('aria-label') || '';
      }

      // 4. If still no text, check for images inside the link
      if (!text) {
        const img = anchor.querySelector('img');
        if (img) {
          text = img.getAttribute('alt') || img.getAttribute('title') || 'Image Link';
        }
      }

      // 5. If still no text, check for any other content
      if (!text) {
        // Check if there's any visible content (icons, etc.)
        if (anchor.children.length > 0) {
          text = 'Link'; // Generic text for links with only icons/images
        }
      }

      // 6. Last resort - use URL hostname or path
      if (!text) {
        try {
          const linkUrl = new URL(absoluteUrl);
          // Use last path segment or hostname
          const pathSegments = linkUrl.pathname.split('/').filter(s => s);
          if (pathSegments.length > 0) {
            text = decodeURIComponent(pathSegments[pathSegments.length - 1]);
          } else {
            text = linkUrl.hostname;
          }
        } catch {
          text = absoluteUrl; // Fallback to full URL
        }
      }

      // Add the link
      links.push({
        url: absoluteUrl,
        text: text || absoluteUrl,
        title: anchor.getAttribute('title') || '',
      });
    } catch (e) {
      console.log('Error processing link:', e);
    }
  }

  console.log(`Extracted ${links.length} unique links from ${anchors.length} total anchors`);
  return links;
}

/**
 * Parse HTML to extract metadata
 */
function parseMetadata(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const base = new URL(baseUrl);

  // Extract title
  const title = doc.querySelector('title')?.textContent?.trim() ||
                doc.querySelector('meta[property="og:title"]')?.content ||
                doc.querySelector('meta[name="twitter:title"]')?.content ||
                doc.querySelector('h1')?.textContent?.trim() ||
                base.hostname;

  // Extract description
  const description = doc.querySelector('meta[name="description"]')?.content ||
                      doc.querySelector('meta[property="og:description"]')?.content ||
                      doc.querySelector('meta[name="twitter:description"]')?.content;

  // Find favicon
  let faviconUrl = null;
  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];

  for (const selector of iconSelectors) {
    const element = doc.querySelector(selector);
    const rawHref = element ? element.getAttribute('href') : null;
    if (rawHref && rawHref.trim()) {
      faviconUrl = rawHref.trim();
      break;
    }
  }

  // Convert relative favicon URL to absolute
  if (faviconUrl) {
    try {
      faviconUrl = new URL(faviconUrl, baseUrl).href;
    } catch (e) {
      console.log('Invalid favicon URL:', faviconUrl);
    }
  } else {
    // Try default favicon.ico
    faviconUrl = new URL('/favicon.ico', baseUrl).href;
  }

  // Extract Open Graph image
  const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
  let ogImageUrl = null;
  if (ogImage) {
    try {
      ogImageUrl = new URL(ogImage, baseUrl).href;
    } catch (e) {
      console.log('Invalid og:image URL:', ogImage);
    }
  }

  // Extract keywords
  const keywords = doc.querySelector('meta[name="keywords"]')?.content?.split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  return {
    success: true,
    url: baseUrl,
    title: title,
    description: description,
    faviconUrl: faviconUrl,
    ogImage: ogImageUrl,
    keywords: keywords || [],
    author: doc.querySelector('meta[name="author"]')?.content,
    siteName: doc.querySelector('meta[property="og:site_name"]')?.content
  };
}

/**
 * Fetch favicon and convert to base64
 */
async function fetchFaviconAsBase64(faviconUrl) {
  try {
    console.log('fetchFaviconAsBase64: Fetching from', faviconUrl);

    // Try different approaches based on URL
    let response;

    // For cross-origin requests, try without CORS mode first (background script has special permissions)
    try {
      response = await fetch(faviconUrl, {
        method: 'GET',
        credentials: 'omit',
        // Don't specify mode for background script - let browser handle it
        headers: {
          'Accept': 'image/*'
        }
      });
    } catch (e) {
      console.log('First fetch attempt failed, trying with no-cors mode:', e.message);
      // Fallback: try with no-cors mode (won't get response body in content script, but works in background)
      response = await fetch(faviconUrl, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'omit'
      });
    }

    if (!response.ok && response.status !== 0) { // status 0 is OK for no-cors mode
      console.log(`Favicon fetch failed with status ${response.status}`);

      // Try alternative favicon URL patterns
      const url = new URL(faviconUrl);
      const alternativeUrls = [
        `${url.origin}/favicon.ico`,
        `${url.origin}/favicon.png`,
        `${url.origin}/apple-touch-icon.png`,
        `${url.origin}/apple-touch-icon-precomposed.png`
      ];

      for (const altUrl of alternativeUrls) {
        if (altUrl === faviconUrl) continue; // Skip if it's the same URL we already tried

        console.log('Trying alternative favicon URL:', altUrl);
        try {
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            credentials: 'omit',
            headers: {
              'Accept': 'image/*'
            }
          });

          if (altResponse.ok || altResponse.status === 0) {
            response = altResponse;
            console.log('Alternative favicon URL worked:', altUrl);
            break;
          }
        } catch (e) {
          console.log('Alternative URL failed:', altUrl, e.message);
        }
      }

      if (!response.ok && response.status !== 0) {
        throw new Error(`Failed to fetch favicon: ${response.status}`);
      }
    }

    const contentType = response.headers.get('content-type');
    console.log('Favicon content-type:', contentType);

    const blob = await response.blob();
    console.log('Favicon blob size:', blob.size);

    if (blob.size === 0) {
      throw new Error('Favicon is empty');
    }

    // Check if blob is actually an image
    if (contentType && !contentType.startsWith('image/')) {
      console.log('Favicon is not an image, got content-type:', contentType);
      // Still try to process it - might be misreported content-type
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        console.log('Favicon converted to base64, length:', result?.length);

        // Validate that we got a valid data URL
        if (result && result.startsWith('data:')) {
          resolve(result);
        } else {
          console.log('Invalid base64 result');
          reject(new Error('Invalid base64 conversion'));
        }
      };
      reader.onerror = (e) => {
        console.log('FileReader error:', e);
        reject(e);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.log('Error fetching favicon:', error);

    // Last resort: Try to use Google's favicon service as fallback
    try {
      const domain = new URL(faviconUrl).hostname;
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      console.log('Trying Google favicon service as last resort:', googleFaviconUrl);

      const googleResponse = await fetch(googleFaviconUrl);
      if (googleResponse.ok) {
        const blob = await googleResponse.blob();
        console.log('Google favicon service successful, blob size:', blob.size);

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            console.log('Google favicon converted to base64');
            resolve(result);
          };
          reader.onerror = (e) => {
            console.log('FileReader error for Google favicon:', e);
            reject(e);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.log('Google favicon service also failed:', e);
    }

    return null;
  }
}

/**
 * Batch fetch metadata for multiple URLs
 */
async function handleBatchFetchMetadata(urls) {
  const results = [];

  for (const url of urls) {
    const metadata = await handleFetchMetadata(url);
    results.push(metadata);

    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    success: true,
    results: results
  };
}

/**
 * Add a bookmark to the browser
 */
async function handleAddBookmark(bookmark) {
  try {
    const newBookmark = await chrome.bookmarks.create({
      parentId: bookmark.parentId || '1', // Default to bookmarks bar
      title: bookmark.title,
      url: bookmark.url
    });

    return {
      success: true,
      bookmark: newBookmark
    };
  } catch (error) {
    console.log('Error adding bookmark:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cache management functions
 */
function getCachedMetadata(url) {
  const cached = metadataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedMetadata(url, metadata) {
  metadataCache.set(url, {
    data: metadata,
    timestamp: Date.now()
  });

  // Limit cache size
  if (metadataCache.size > 1000) {
    const firstKey = metadataCache.keys().next().value;
    metadataCache.delete(firstKey);
  }
}

async function handleProxyFetch(request) {
  const { url, method = 'GET', headers = {}, body, timeoutMs = 20000, credentials = 'omit', redirect = 'follow', mode, cache } = request || {};
  if (!url) {
    throw new Error('Missing URL');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions = {
      method,
      headers,
      credentials,
      redirect,
      signal: controller.signal
    };

    if (mode) fetchOptions.mode = mode;
    if (cache) fetchOptions.cache = cache;

    const upperMethod = String(method || 'GET').toUpperCase();
    if (body !== undefined && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const headersObj = {};
    response.headers.forEach((value, key) => { headersObj[key] = value; });
    const bodyText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: headersObj,
      bodyText,
      success: response.ok
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Proxy fetch timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('MyBookmarks Companion installed/updated:', details);

  // Set default settings
  chrome.storage.local.set({
    enabled: true,
    autoFetchMetadata: true,
    cacheEnabled: true
  });
});

// Handle browser action click (MV2/MV3 compatibility)
try {
  if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(() => {
      try { chrome.tabs.create({ url: 'http://localhost:8080/index2.html' }); } catch {}
    });
  } else if (chrome.browserAction && chrome.browserAction.onClicked) {
    chrome.browserAction.onClicked.addListener(() => {
      try { chrome.tabs.create({ url: 'http://localhost:8080/index2.html' }); } catch {}
    });
  }
} catch {}
// Persisted DAV auth (set from page)
let davAuth = null; // { serverUrl, username, password }

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'setDavAuth') {
    try {
      davAuth = request.auth || null;
      try { console.log('[DAV][BG] setDavAuth stored for host', (new URL(davAuth.serverUrl||'')).hostname); } catch {}
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return; // no async
  }
});

// Force Authorization header for DAV endpoints (robust like native clients)
try {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      try {
        if (!davAuth || !davAuth.serverUrl) return {};
        const target = new URL(details.url);
        const conf = new URL(davAuth.serverUrl);
        if (target.hostname !== conf.hostname) return {};
        // Only for DAV or Bookmarks endpoints
        const isDav = /\/remote\.php\/dav\//.test(target.pathname) || /\/addressbooks\//.test(target.pathname);
        const isNcBookmarks = /\/index\.php\/apps\/bookmarks\//.test(target.pathname);
        if (!isDav && !isNcBookmarks) return {};
        const up = `${davAuth.username || ''}:${davAuth.password || ''}`;
        const basic = 'Basic ' + btoa(unescape(encodeURIComponent(up)));
        const headers = details.requestHeaders || [];
        let found = false;
        for (const h of headers) {
          if (h.name.toLowerCase() === 'authorization') { h.value = basic; found = true; break; }
        }
        if (!found) headers.push({ name: 'Authorization', value: basic });
        // Ensure Nextcloud API headers for Bookmarks REST
        if (isNcBookmarks) {
          let hasAccept=false, hasOcs=false, hasXrw=false;
          for (const h of headers) {
            const n = h.name.toLowerCase();
            if (n==='accept') { hasAccept=true; if (!h.value) h.value='application/json'; }
            if (n==='ocs-apirequest') { hasOcs=true; if (!h.value) h.value='true'; }
            if (n==='x-requested-with') { hasXrw=true; if (!h.value) h.value='XMLHttpRequest'; }
          }
          if (!hasAccept) headers.push({ name:'Accept', value:'application/json' });
          if (!hasOcs) headers.push({ name:'OCS-APIREQUEST', value:'true' });
          if (!hasXrw) headers.push({ name:'X-Requested-With', value:'XMLHttpRequest' });
        }
        try { console.log('[DAV][BG] Inject Authorization for', target.href, 'added=', !found); } catch {}
        return { requestHeaders: headers };
      } catch { return {}; }
    },
    { urls: ["https://gevatter.cloud/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
  );
} catch {}
