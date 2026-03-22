# Dialog: Link Templates

## Purpose
Link templates make it possible to save prepared link configurations and reuse them later.

## Two related dialogs
1. Save link template
- Opens from the generic edit dialog footer
- Stores the current dialog state under a reusable name
- Warns when an existing template with the same name will be overwritten

2. Manage templates
- Lists all saved templates
- Lets the user rename a template
- Lets the user delete a template
- Reopens the selected template in the edit dialog via `Edit`

## What a template is for
A template can preserve prepared link dialog data such as:
- Basic text/URL values
- Placeholder definitions
- Visual settings carried by the generic edit dialog
- Other reusable link-level configuration that should be applied again later

## Where templates are used
- Add-link dropdown menus can start from a saved template
- The generic edit dialog can save the current state as a template
- The manager dialog keeps the list of stored templates consistent

## Typical use cases
- Repeated internal tool links with similar URL structures
- Standard entry skeletons for project groups
- Reusable placeholder-driven links

## Important relationships
- Templates work well together with global placeholders and the Expression Editor
- Editing a managed template reuses the same generic dialog used for normal link editing

## Technical
- Save actions: `openLinkTemplateSaveDialog()`, `submitLinkTemplateSaveDialog()`
- Manager actions: `openLinkTemplateManagerDialog()`, `editManagedLinkTemplate()`, `deleteManagedLinkTemplate()`
- Containers: `#linkTemplateSaveModal`, `#linkTemplateManagerModal`
