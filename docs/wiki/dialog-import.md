# Dialog: Import

## Purpose
Imports links from file, URL, or clipboard.

## Three input paths
1. File import (`.json`, `.csv`, `.html`, `.htm`)
2. URL import
3. Clipboard/paste

## Data format detection
The import logic tries formats in this order:
1. HTML (including bookmark parser)
2. JSON (array, object, group export, full export)
3. CSV (auto delimiter or manual delimiter)
4. Tab-separated format
5. Plain URLs

## Preview and selection
- Detected links appear in a selectable preview.
- Entire groups can be selected/deselected together.
- Optionally, a new group title can be set.

## Special case: full export import
If a full database export is detected:
- Import runs as a restore operation.
- UUIDs are preserved.
- A backup snapshot is created first.

## Cleanup and memory behavior
- On dialog close, import state is reset.
- This avoids stale state and saves memory for large imports.

## Important relationships
- The result directly affects group/link structure.
- Export and import are designed as counterpart workflows.

## Technical
- Handler: `openPasteModal()`
- Dialog container: `#pasteClipboardModal`
