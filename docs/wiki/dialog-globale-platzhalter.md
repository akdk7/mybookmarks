# Dialog: Global Placeholders

## Purpose
This dialog manages global placeholders used in URL templates.

## What is a placeholder?
A placeholder is a name inside double curly braces, for example `{{PROJECT}}`.
When opening a link, it is replaced with its stored value.

## Fields in the dialog
- `Name`
- `Value`
- `Encode` (URL encoding on/off)

## Save flow
- The dialog edits a working list of placeholder rows.
- On save, rows are normalized and stored in the app settings.

## Value priority (important)
For URL template resolution, priority is:
1. Global placeholder (base)
2. Group placeholder (overrides global)
3. Link placeholder (overrides group)

Empty values intentionally do not override existing non-empty values.

## Typical use cases
- Environment-specific API endpoints
- Customer key, region, project name
- Reusable parameters for many links

## Important relationships
- Directly affects URL resolution, and therefore navigation, sharing, and shortcut targets.
- Placeholders can also be reviewed in group/link edit dialogs.

## Technical
- Handler: `openGlobalPlaceholderDialog()`
- Dialog container: `#globalPlaceholdersModal`
