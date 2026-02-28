# Dialog: Export

## Purpose
Exports groups and links in different formats.

## Available formats
- `JSON (Full)`: complete dataset
- `JSON Array`: links only
- `CSV`
- `HTML Bookmarks` (Netscape format)

## Selection model
- For all formats except `JSON (Full)`, groups and links are selected individually.
- The dialog continuously shows how many links are selected.

## Export flow
1. Validates that something is selected for selective formats.
2. Builds export content for the chosen format.
3. Creates the export file in memory.
4. Triggers a download with a date-based filename.

## Important relationships
- Export is a backup and migration tool.
- Full JSON can later be restored via the import dialog.

## Technical
- Handler: `exportAndDownload()`
- Dialog container: `#exportModal`
