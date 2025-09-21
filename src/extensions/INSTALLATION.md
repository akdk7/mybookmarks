# MyBookmarks Companion Extension - Installation Guide

## 📦 Package Files Created

- `mybookmarks-firefox.xpi` - Firefox extension package
- `mybookmarks-chrome.zip` - Chrome extension package (for Chrome Web Store)

## 🦊 Firefox Installation

### Option 1: Temporary Installation (Recommended for Testing)
1. Open Firefox and navigate to `about:debugging`
2. Click on "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..." button
4. Navigate to `local2/extensions/firefox/`
5. Select the `manifest.json` file
6. The extension will be loaded until Firefox restarts

### Option 2: Permanent Installation (Firefox Developer Edition/Nightly only)
1. Open `about:config` in Firefox
2. Search for `xpinstall.signatures.required`
3. Set it to `false` (only works in Developer/Nightly editions)
4. Open `about:addons`
5. Click the gear icon ⚙️ → "Install Add-on From File..."
6. Select the `mybookmarks-firefox.xpi` file
7. Click "Add" to confirm installation

## 🔷 Chrome/Chromium Installation

### Developer Mode Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top right corner
3. Click "Load unpacked" button
4. Navigate to `local2/extensions/firefox/` folder
5. Select the folder and click "Select"
6. The extension will be permanently installed

### Alternative Browsers
The same Chrome installation method works for:
- Microsoft Edge: `edge://extensions/`
- Brave: `brave://extensions/`
- Opera: `opera://extensions/`
- Vivaldi: `vivaldi://extensions/`

## ✅ Verify Installation

After installation, you should see:
1. The extension icon in your browser toolbar
2. When visiting your MyBookmarks page (`file:///path/to/index2.html`):
   - Open the browser console (F12)
   - You should see: `MyBookmarks Extension API injected`
   - The import dialog should show the "Import Browser Bookmarks" option

## 🔧 Permissions Required

The extension needs these permissions:
- **bookmarks** - To read browser bookmarks
- **tabs** - To access page metadata
- **activeTab** - To interact with MyBookmarks pages
- **storage** - To save settings
- **<all_urls>** - To fetch favicons and metadata from any website

## 📝 Notes

### Firefox
- Temporary installations are removed when Firefox restarts
- For permanent unsigned extensions, use Firefox Developer Edition or Nightly
- The extension ID is: `mybookmarks-companion@example.com`

### Chrome
- Developer mode extensions show a warning banner on startup
- The extension works with Manifest V2 (will need update for V3 in 2024)
- The same extension folder works for both Chrome and Firefox

## 🐛 Troubleshooting

### Extension not detected by MyBookmarks
1. Check that the extension is enabled in your browser
2. Reload the MyBookmarks page (Ctrl+F5)
3. Check browser console for errors
4. Ensure the page URL matches the patterns in manifest.json:
   - `http://localhost/*`
   - `http://127.0.0.1/*`
   - `file:///*/*`

### "No bookmarks found" error
1. Ensure the extension has bookmark permissions
2. Check that you have bookmarks in your browser
3. Look for errors in the extension's background script:
   - Firefox: `about:debugging` → Inspect
   - Chrome: `chrome://extensions/` → Details → Inspect views

### Favicon loading issues
1. Some sites block cross-origin favicon requests
2. The extension tries multiple fallback methods
3. Check the browser console for specific error messages

## 📄 Files Structure

```
local2/extensions/
├── firefox/
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Background service worker
│   ├── content-script.js  # Injected into MyBookmarks pages
│   ├── inject.js         # Page context API
│   ├── popup.html        # Extension popup (not used yet)
│   └── popup.js          # Popup logic (not used yet)
├── mybookmarks-firefox.xpi  # Firefox package
├── mybookmarks-chrome.zip   # Chrome package
└── INSTALLATION.md         # This file
```

## 🔄 Updating the Extension

After making changes to the extension code:

### Firefox (Temporary)
1. Go to `about:debugging`
2. Click "Reload" button next to the extension

### Chrome
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card

## 📞 Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Check the extension's background page console
3. Verify all permissions are granted
4. Ensure you're using a supported browser version