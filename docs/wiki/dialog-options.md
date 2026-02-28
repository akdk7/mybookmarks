# Dialog: Options

## Purpose
The options dialog is the central configuration interface of the application. It is opened via the gear button in the toolbar.

## How to open the dialog
1. Click the gear button in the toolbar.
2. The app prepares missing default values.
3. The options form is opened.

## Dialog structure
The dialog includes:
- A search field for filtering options.
- Collapsible sections.
- Field types like text, number, checkbox, select, and action buttons.

Main section groups:
- Common settings (language, page title, confirmations, debug)
- Security
- Groups
- Links
- Buttons
- Sharing
- Sync and sync backend
- Backend-specific connection settings
- Event log settings

## Save behavior: what happens in the background
Saving does more than writing form values:
1. New values are merged into the app settings.
2. Settings are normalized and validated.
3. Security mode changes are checked.
4. UI behavior and visual settings are applied immediately where needed.
5. Follow-up actions run for dependent settings (for example layout-related behavior).
6. Data is saved.

## Special actions inside the dialog
- Delete database (red button)
- Test backend connection
- Reset sync bindings
- Open favicon rules dialog

## Security sub-dialog
When local encryption is enabled, a second dialog is shown for password input:
- [Dialog: Local Encryption (Password)](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Local-Encryption-%28Password%29)

## Important relationships
- Toolbar behavior like clear-search, column widths, sync, and favicon handling depends on options.
- The options dialog uses the shared generic modal system used by other edit dialogs.

## Technical
- Handler: `showOptionsDialog()`
- Dialog container: `#genericEditModal` (mode `type = options`)
