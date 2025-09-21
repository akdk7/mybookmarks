/**
 * MyBookmarks Companion Extension - Content Script
 * Injected into MyBookmarks web pages to enable communication
 */

console.log('MyBookmarks Companion: Content script loaded on', window.location.href);

// Check if we're on a MyBookmarks page
const isMyBookmarksPage = window.location.href.includes('index2.html') ||
                          window.location.href.includes('MyBookmarks') ||
                          window.location.href.includes('mybookmarks');

if (!isMyBookmarksPage) {
  console.log('MyBookmarks Companion: Not a MyBookmarks page, skipping injection');
} else {
  console.log('MyBookmarks Companion: Detected MyBookmarks page, injecting API');

  // Inject a script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    console.log('MyBookmarks Companion: inject.js loaded successfully');
    this.remove();
  };
  script.onerror = function(e) {
    console.error('MyBookmarks Companion: Failed to load inject.js', e);
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from the page
window.addEventListener('message', async (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return;

  const message = event.data;
  if (!message || !message.type) return;

  console.log('Content script received message:', message.type);

  // Handle different message types
  switch(message.type) {
    case 'MYBOOKMARKS_PING':
      // Respond to ping to confirm extension is present
      window.postMessage({
        type: 'MYBOOKMARKS_PONG',
        version: '1.0.0'
      }, '*');
      break;

    case 'GET_BOOKMARKS':
      // Request bookmarks from background script
      chrome.runtime.sendMessage({ action: 'getBookmarks' }, (response) => {
        // Check for errors (e.g., background script not responding)
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'BOOKMARKS_RESPONSE',
            bookmarks: { success: false, error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'BOOKMARKS_RESPONSE',
            bookmarks: response
          }, '*');
        }
      });
      break;

    case 'FETCH_URL_METADATA':
      // Fetch metadata for a URL
      console.log('Content script: Sending fetchMetadata to background for:', message.url, 'Options:', message.options);
      chrome.runtime.sendMessage({
        action: 'fetchMetadata',
        url: message.url,
        options: message.options || {}
      }, (response) => {
        console.log('Content script: Received response from background:', response);
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'URL_METADATA_RESPONSE',
            url: message.url,
            metadata: { success: false, error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'URL_METADATA_RESPONSE',
            url: message.url,
            metadata: response
          }, '*');
        }
      });
      break;

    case 'BATCH_FETCH_METADATA':
      // Fetch metadata for multiple URLs
      chrome.runtime.sendMessage({
        action: 'batchFetchMetadata',
        urls: message.urls
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'BATCH_METADATA_RESPONSE',
            results: { success: false, error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'BATCH_METADATA_RESPONSE',
            results: response
          }, '*');
        }
      });
      break;

    case 'DAV_REQUEST':
      // Proxy generic DAV requests to background
      chrome.runtime.sendMessage({
        action: 'davRequest',
        request: message.request
      }, (response) => {
        const requestId = message.requestId;
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'DAV_RESPONSE',
            requestId,
            response: { ok: false, status: 0, statusText: chrome.runtime.lastError.message, error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'DAV_RESPONSE',
            requestId,
            response
          }, '*');
        }
      });
      break;

    case 'ADD_BOOKMARK':
      // Add a bookmark to the browser
      chrome.runtime.sendMessage({
        action: 'addBookmark',
        bookmark: message.bookmark
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'ADD_BOOKMARK_RESPONSE',
            result: { success: false, error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'ADD_BOOKMARK_RESPONSE',
            result: response
          }, '*');
        }
      });
      break;

    case 'SET_DAV_AUTH':
      // Forward DAV auth to background (page context cannot call chrome APIs directly)
      try {
        chrome.runtime.sendMessage({ action: 'setDavAuth', auth: message.auth }, (response) => {
          // no-op; background stores state
        });
      } catch (e) {
        console.error('Failed to forward setDavAuth:', e);
      }
      break;

    case 'PROXY_FETCH':
      chrome.runtime.sendMessage({
        action: 'proxyFetch',
        request: message.request || {}
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Background script error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'PROXY_FETCH_RESPONSE',
            requestId: message.requestId,
            result: { error: chrome.runtime.lastError.message }
          }, '*');
        } else {
          window.postMessage({
            type: 'PROXY_FETCH_RESPONSE',
            requestId: message.requestId,
            result: response
          }, '*');
        }
      });
      break;

    case 'CLEAR_EXTENSION_CACHE':
      chrome.runtime.sendMessage({ action: 'clearCache' }, (response) => {
        const ok = response && response.success;
        window.postMessage({
          type: 'CLEAR_CACHE_RESPONSE',
          result: ok ? { success: true, cleared: response.cleared } : { success: false, error: (response && response.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Unknown error' }
        }, '*');
      });
      break;

    case 'SYNC_BOOKMARKS':
      // Sync bookmarks with browser (more complex, needs implementation)
      handleSyncBookmarks(message.bookmarks);
      break;
  }
});

/**
 * Handle bookmark synchronization
 */
async function handleSyncBookmarks(mybookmarksData) {
  try {
    // This would need more sophisticated logic to:
    // 1. Compare existing browser bookmarks with MyBookmarks data
    // 2. Determine what needs to be added/updated/removed
    // 3. Apply changes carefully to avoid data loss

    window.postMessage({
      type: 'SYNC_BOOKMARKS_RESPONSE',
      success: true,
      message: 'Sync functionality not yet implemented'
    }, '*');
  } catch (error) {
    window.postMessage({
      type: 'SYNC_BOOKMARKS_RESPONSE',
      success: false,
      error: error.message
    }, '*');
  }
}

// Notify page that extension is ready
setTimeout(() => {
  window.postMessage({
    type: 'MYBOOKMARKS_EXTENSION_READY',
    features: [
      'getBookmarks',
      'fetchMetadata',
      'batchFetchMetadata',
      'addBookmark',
      'davRequest',
      'proxyFetch'
    ]
  }, '*');
}, 100);
