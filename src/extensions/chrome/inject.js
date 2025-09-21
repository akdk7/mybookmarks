/**
 * MyBookmarks Companion Extension - Injected Script
 * This runs in the page context and provides the API
 */

(function() {
  'use strict';

  // Create global MyBookmarksExtension object
  window.MyBookmarksExtension = {
    version: '1.0.0',
    ready: false,
    features: [],

    // Check if extension is available
    async isAvailable() {
      return new Promise((resolve) => {
        window.postMessage({ type: 'MYBOOKMARKS_PING' }, '*');

        const timeout = setTimeout(() => resolve(false), 1000);

        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'MYBOOKMARKS_PONG') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(true);
          }
        });
      });
    },

    // Get all bookmarks
    async getBookmarks() {
      return new Promise((resolve, reject) => {
        window.postMessage({ type: 'GET_BOOKMARKS' }, '*');

        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for bookmarks'));
        }, 10000);

        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'BOOKMARKS_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.bookmarks);
          }
        });
      });
    },

    // Fetch metadata for a URL
    async fetchMetadata(url, options = {}) {
      console.log('inject.js: fetchMetadata called for:', url, 'Options:', options);
      return new Promise((resolve, reject) => {
        console.log('inject.js: Posting FETCH_URL_METADATA message');
        window.postMessage({
          type: 'FETCH_URL_METADATA',
          url: url,
          options: options
        }, '*');

        const timeout = setTimeout(() => {
          console.error('inject.js: Timeout fetching metadata for:', url);
          reject(new Error('Timeout fetching metadata'));
        }, 30000);

        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'URL_METADATA_RESPONSE' && event.data.url === url) {
            console.log('inject.js: Received metadata response:', event.data.metadata);
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.metadata);
          }
        });
      });
    },

    // Batch fetch metadata
    async batchFetchMetadata(urls) {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'BATCH_FETCH_METADATA',
          urls: urls
        }, '*');

        const timeout = setTimeout(() => {
          reject(new Error('Timeout fetching metadata'));
        }, 60000 * urls.length); // 1 minute per URL

        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'BATCH_METADATA_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.results);
          }
        });
      });
    },

    // Add a bookmark
    async addBookmark(title, url, parentId) {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'ADD_BOOKMARK',
          bookmark: { title, url, parentId }
        }, '*');

        const timeout = setTimeout(() => {
          reject(new Error('Timeout adding bookmark'));
        }, 5000);

        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'ADD_BOOKMARK_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            if (event.data.result.success) {
              resolve(event.data.result.bookmark);
            } else {
              reject(new Error(event.data.result.error));
            }
          }
        });
      });
    },

    // Generic DAV request (CardDAV/WebDAV) via background
    async davRequest(request) {
      return new Promise((resolve, reject) => {
        const requestId = 'dav-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        window.postMessage({ type: 'DAV_REQUEST', requestId, request }, '*');

        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for DAV response'));
        }, 30000);

        function handler(event) {
          if (event.data.type === 'DAV_RESPONSE' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.response);
          }
        }
        window.addEventListener('message', handler);
      });
    }
    ,
    // Set DAV auth (server + basic creds) for header injection
    async setDavAuth(auth) {
      return new Promise((resolve) => {
        window.postMessage({ type: 'SET_DAV_AUTH', auth }, '*');
        // Immediate resolve; background will store state
        resolve({ success: true });
      });
    }
  };

  // Listen for extension ready message
  window.addEventListener('message', (event) => {
    if (event.data.type === 'MYBOOKMARKS_EXTENSION_READY') {
      window.MyBookmarksExtension.ready = true;
      window.MyBookmarksExtension.features = event.data.features || [];

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('mybookmarks-extension-ready', {
        detail: window.MyBookmarksExtension
      }));
    }
  });

  console.log('MyBookmarks Extension API injected');
})();

// Handle messages from page for auth settings (runs in page context)
window.addEventListener('message', (event) => {
  if (event && event.data && event.data.type === 'SET_DAV_AUTH') {
    try {
      chrome.runtime.sendMessage({ action: 'setDavAuth', auth: event.data.auth }, () => {});
    } catch {}
  }
});
