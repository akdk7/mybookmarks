/**
 * MyBookmarks Companion Extension - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const bookmarkCountEl = document.getElementById('bookmarkCount');
  const folderCountEl = document.getElementById('folderCount');
  const messageEl = document.getElementById('message');

  // Check if MyBookmarks is open
  const tabs = await chrome.tabs.query({});
  const myBookmarksTabs = tabs.filter(tab =>
    tab.url && (
      tab.url.includes('localhost') ||
      tab.url.includes('127.0.0.1') ||
      tab.url.includes('MyBookmarks') ||
      tab.url.includes('mybookmarks')
    )
  );

  if (myBookmarksTabs.length > 0) {
    statusEl.className = 'status connected';
    statusEl.innerHTML = '✅ Connected to MyBookmarks';
  } else {
    statusEl.className = 'status disconnected';
    statusEl.innerHTML = '⚠️ MyBookmarks not detected';
  }

  // Load bookmark statistics
  try {
    const bookmarks = await chrome.bookmarks.getTree();
    const stats = countBookmarks(bookmarks[0]);
    bookmarkCountEl.textContent = stats.bookmarks;
    folderCountEl.textContent = stats.folders;
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    bookmarkCountEl.textContent = '?';
    folderCountEl.textContent = '?';
  }

  // Button handlers
  document.getElementById('openMyBookmarks').addEventListener('click', async () => {
    // Check if already open
    if (myBookmarksTabs.length > 0) {
      // Switch to existing tab
      chrome.tabs.update(myBookmarksTabs[0].id, { active: true });
      chrome.windows.update(myBookmarksTabs[0].windowId, { focused: true });
    } else {
      // Open new tab
      chrome.tabs.create({
        url: 'http://localhost:8080/local2/index2.html'
      });
    }
    window.close();
  });

  document.getElementById('importBookmarks').addEventListener('click', async () => {
    if (myBookmarksTabs.length === 0) {
      showMessage('Please open MyBookmarks first', 'error');
      return;
    }

    // Send message to import bookmarks
    chrome.tabs.sendMessage(myBookmarksTabs[0].id, {
      action: 'importBookmarks'
    });

    showMessage('Import started. Check MyBookmarks tab.', 'success');
    setTimeout(() => window.close(), 2000);
  });

  document.getElementById('fetchMetadata').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      showMessage('Fetching metadata...', 'success');

      chrome.runtime.sendMessage({
        action: 'fetchMetadata',
        url: tab.url
      }, (response) => {
        if (response.success) {
          showMessage(`Found: ${response.title}`, 'success');
          // Copy to clipboard
          navigator.clipboard.writeText(JSON.stringify(response, null, 2));
        } else {
          showMessage('Failed to fetch metadata', 'error');
        }
      });
    } catch (error) {
      showMessage('Error: ' + error.message, 'error');
    }
  });

  document.getElementById('addCurrentTab').addEventListener('click', async () => {
    if (myBookmarksTabs.length === 0) {
      showMessage('Please open MyBookmarks first', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Send to MyBookmarks
      chrome.tabs.sendMessage(myBookmarksTabs[0].id, {
        action: 'addLink',
        link: {
          url: tab.url,
          text: tab.title,
          favicon: tab.favIconUrl
        }
      });

      showMessage('Added to MyBookmarks!', 'success');
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      showMessage('Error: ' + error.message, 'error');
    }
  });

  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('help').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/username/mybookmarks-extension#readme'
    });
  });

  // Helper functions
  function countBookmarks(node) {
    let bookmarks = 0;
    let folders = 0;

    function traverse(node) {
      if (node.children) {
        folders++;
        for (const child of node.children) {
          if (child.url) {
            bookmarks++;
          } else if (child.children) {
            traverse(child);
          }
        }
      }
    }

    traverse(node);
    return { bookmarks, folders: folders - 1 }; // Subtract root folder
  }

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
      messageEl.className = 'message';
    }, 5000);
  }
});