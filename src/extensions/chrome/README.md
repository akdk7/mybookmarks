# MyBookmarks Companion - Chrome Extension

This is the Chrome/Chromium version of the MyBookmarks Companion extension.

## Features
- Import browser bookmarks into MyBookmarks
- Fetch website metadata (title, description, favicon)
- Batch processing for multiple links
- Full favicon support with multiple fallback methods

## Installation

### Developer Mode (Recommended)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top right
3. Click "Load unpacked"
4. Select this `chrome` folder
5. The extension will be installed and active

### Compatible Browsers
This extension works with all Chromium-based browsers:
- Google Chrome
- Microsoft Edge (`edge://extensions/`)
- Brave Browser (`brave://extensions/`)
- Opera (`opera://extensions/`)
- Vivaldi (`vivaldi://extensions/`)

## Differences from Firefox Version
- No `browser_specific_settings` in manifest
- Uses Chrome's extension APIs (though both versions are compatible)
- Works with Manifest V2 (V3 migration planned)

## Development
All the core functionality is shared with the Firefox version. The files are:
- `manifest.json` - Chrome-specific manifest without Firefox settings
- `background.js` - Background service worker (same as Firefox)
- `content-script.js` - Content script (same as Firefox)
- `inject.js` - Page context script (same as Firefox)
- `popup.html/js` - Extension popup (not currently used)

## Permissions
- `bookmarks` - Read browser bookmarks
- `tabs` - Access tab information
- `activeTab` - Interact with active tab
- `storage` - Store extension settings
- `<all_urls>` - Fetch metadata from any website

## Version History
- 1.0.0 - Initial release with full bookmark import and metadata fetching