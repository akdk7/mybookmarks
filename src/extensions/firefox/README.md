# MyBookmarks Companion - Firefox Extension

Firefox version of the MyBookmarks Companion extension.

## Installation

### Temporary Installation (for testing)
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in this folder
5. The extension will be loaded until Firefox restarts

### Important: File Access Permission
After loading the extension, you need to grant file access:
1. Go to `about:addons`
2. Find "MyBookmarks Companion"
3. Click on the extension
4. Under "Permissions", enable "Access your data for all websites" or specifically for file:// URLs

### Permanent Installation (Developer)
1. Open `about:config`
2. Set `xpinstall.signatures.required` to `false` (Firefox Developer Edition only)
3. Package as .xpi and install

### Production (Firefox Add-ons)
Coming soon...

## Differences from Chrome Version

- Uses Manifest V2 (Firefox still supports it better)
- `browser_action` instead of `action`
- `browser.*` API namespace also works (in addition to `chrome.*`)
- Added `browser_specific_settings` for Firefox
- `persistent: true` for background script (prevents suspension)

## Usage

Same as Chrome version - the extension API is identical.

## Testing

1. Load extension via `about:debugging`
2. Open MyBookmarks in a new tab
3. Check if extension icon appears in toolbar
4. Test features via popup or console

## Firefox-Specific Notes

- Firefox has stricter CSP policies
- File URLs need special permission grant
- Some metadata fetching might be blocked by tracking protection

See Chrome README for full documentation.