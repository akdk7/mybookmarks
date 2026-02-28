# Dialog: Bookmarklet

## Purpose
Explains how to create a bookmarklet in the browser bookmarks bar to quickly bring current pages into MyBookmarks.

## What the dialog shows
- Short instructions
- Drag-and-drop bookmarklet link
- JavaScript snippet in a readable, copyable field

## How the bookmarklet works
The generated bookmarklet:
1. Reads URL and page title from the current browser page.
2. Writes the data as JSON to the clipboard.
3. Shows a confirmation (or a prompt fallback if clipboard access is blocked).

## Typical user flow
1. Open the dialog from the toolbar.
2. Drag the bookmarklet to the browser bookmarks bar.
3. Run it on a target page.
4. Open import in MyBookmarks and apply the data.

## Important relationships
- Works well together with the import dialog (clipboard path).
- No direct database access; transfer is clipboard-based.

## Technical
- Handler: `showBookmarkletHelp()`
- Dialog container: `#bookmarkletModal`
