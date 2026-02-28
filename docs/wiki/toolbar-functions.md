# Toolbar Functions

This page explains all top toolbar functions (left to right) for beginners.

## Core idea of the toolbar
The toolbar is the control center of the app. Some buttons run actions directly, while others open a dialog or sidebar with additional settings.

## 1) Add group
What it does:
- Creates a new group immediately.
- Automatically selects a target column (column with the fewest groups).
- Applies default formatting from options.

Important relationship:
- Default values come from the options dialog.

## 2) Options
What it does:
- Opens the central options dialog.
- Manages global settings for behavior, appearance, sharing, and sync.

Read more:
- [Dialog: Options](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Options)
- [Dialog: Local Encryption (Password)](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Local-Encryption-%28Password%29)

## 3) Favicon Rules
What it does:
- Opens the favicon rules dialog.
- Lets you define domain/prefix/regex icon rules.

Read more:
- [Dialog: Favicon Rules](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Favicon-Rules)

## 4) Visual CSS Editor
What it does:
- Opens a right sidebar (not a classic modal dialog).
- Lets you customize UI styling via rules, tokens, and selectors.

Read more:
- [Sidebar: Visual CSS Editor](https://github.com/akdk7/mybookmarks/wiki/Sidebar:-Visual-CSS-Editor)

## 5) Find duplicates
What it does:
- Searches for identical URLs across all groups.
- Opens a dialog for selective removal.

Read more:
- [Dialog: Duplicates](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Duplicates)

## 6) Shortcut Manager
What it does:
- Shows existing link shortcuts.
- Supports global shortcuts for multiple groups/links.

Read more:
- [Dialog: Shortcut Manager](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Shortcut-Manager)

## 7) Global placeholders
What it does:
- Opens the global URL placeholder dialog.
- Values can be reused inside URL templates.

Read more:
- [Dialog: Global Placeholders](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Global-Placeholders)

## 8) Clear extension cache
What it does:
- Only visible if the browser extension is available.
- Clears companion cache and can trigger favicon refetch.

Important relationship:
- Directly affects favicon display.

## 9) Sync now
What it does:
- Only visible when a sync backend is configured.
- Starts manual sync via the active adapter.

Important relationship:
- The backend is defined in options.

## 10) Contacts and Quick-Connect
What it does:
- Opens the contacts dialog with two tabs: Contacts and Quick-Connect.

Read more:
- [Dialog: Contacts and Quick-Connect](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Contacts-and-Quick-Connect)

## 11) Expand all groups
What it does:
- Expands all groups and saves state.

## 12) Collapse all groups
What it does:
- Collapses all groups and saves state.

## 13) Equalize column widths
What it does:
- Only visible when manual column width is enabled.
- Distributes available width equally across columns.

## 14) Export
What it does:
- Opens the export dialog.
- Lets you select groups/links and output format.

Read more:
- [Dialog: Export](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Export)

## 15) Import
What it does:
- Opens the import dialog for file, URL, and clipboard.

Read more:
- [Dialog: Import](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Import)

## 16) Bookmarklet
What it does:
- Opens bookmarklet help dialog.
- The bookmarklet copies URL + title of the current page.

Read more:
- [Dialog: Bookmarklet](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Bookmarklet)

## 17) Undo
What it does:
- Moves one step back in edit history.

## 18) Redo
What it does:
- Restores the next step from redo history.

## 19) Snapshots (dropdown)
What it does:
- Saves manual restore points.
- Restores snapshots.
- Deletes snapshots.

Important relationship:
- Undo/redo is short-term history.
- Snapshots are explicit named restore points.

## 20) Clear search
What it does:
- Clears search text and active keyword filters.
- Optionally collapses all groups based on options.

## 21) Help / Feature Overview
What it does:
- Opens a right help sidebar with German/English tabs.

Read more:
- [Sidebar: Feature Overview](https://github.com/akdk7/mybookmarks/wiki/Sidebar:-Feature-Overview)

## Key relationships at a glance
- Options affect almost all toolbar functions.
- Global placeholders affect link URLs, import/export, and shortcut targets.
- Favicon rules affect link rendering in lists and edit dialogs.
- Contacts/Quick-Connect is the basis for sharing workflows.

## Technical
- Add group button: `addGroup`
- Options button: `showOptionsDialog`
- Favicon rules button: `openFaviconRulesModal`
- Visual CSS Editor button: `openCssSidebar`
- Duplicates button: `findAndResolveDuplicates`
- Shortcut Manager button: `openShortcutManagerDialog`
- Global placeholders button: `openGlobalPlaceholderDialog`
- Clear extension cache button: `clearExtensionCache`
- Sync now button: `syncNowGeneric`
- Contacts button: `openContactsDialog`
- Expand all groups button: `expandAllGroups`
- Collapse all groups button: `collapseAllGroups`
- Equalize column widths button: `equalizeGroupColumnWidths`
- Export button: `exportAndDownload`
- Import button: `openPasteModal`
- Bookmarklet button: `showBookmarkletHelp`
- Undo button: `undo`
- Redo button: `redo`
- Snapshot actions: `saveSnapshot`, `restoreSnapshot`, `deleteSnapshot`
- Clear search action: `onClearClick`
- Feature Overview button: `openFeatureSidebar`
