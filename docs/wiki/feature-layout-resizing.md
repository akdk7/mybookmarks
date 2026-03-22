# Feature: Layout Resizing

## Purpose
MyBookmarks supports direct layout adjustments so dense collections can be tuned without leaving the main view.

## Supported resize actions
### 1. Group height
- Drag the bottom resize handle of an expanded group
- Double-click the handle to auto-fit the group height to its content

### 2. Group column width
- Drag the vertical separator between group columns
- Width changes are persistent when manual group column widths are enabled

### 3. Equalize widths
- The toolbar can redistribute all visible group columns evenly
- This is useful after many manual width changes

## Related automatic behavior
- An option can auto-adjust group height after links are added or removed
- Individual groups can inherit or override that global auto-adjust behavior

## Important relationships
- Manual column resizing depends on the `Allow manual group column widths` option
- Auto height behavior depends on the group-height options in the options dialog
- Equalizing widths complements manual column resizing rather than replacing it

## Technical
- Height resize: `startGroupHeightResize()`, `autoFitGroupHeight()`
- Width resize: `startGroupColumnResize()`
- Toolbar rebalance: `equalizeGroupColumnWidths()`
