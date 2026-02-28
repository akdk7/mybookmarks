# Sidebar: Visual CSS Editor

## Purpose
Lets you visually customize UI styling without an external build process.

## What happens when opening
The sidebar initialization:
- Loads existing rules and rule sets.
- Normalizes legacy state.
- Initializes available selectors.
- Activates body layout adjustment for sidebar mode.

## Main areas in the sidebar
- Template selection
- Design tokens
- Rule set save/load/delete
- Rule cards with selector, properties, enable/disable, ordering
- Property format editor in the lower split section

## Typical workflow
1. Open sidebar.
2. Add a new rule or select an existing one.
3. Set selector.
4. Edit properties.
5. Optionally apply tokens.
6. Save rule set.

## Closing behavior
Closing the sidebar:
- Stops element picker if active.
- Restores layout changes.

## Important relationships
- Changes affect toolbar, dialogs, groups, and links.
- Options and feature overview reference this sidebar as a key customization tool.

## Technical
- Handler: `openCssSidebar()`
- Container: `.mb-css-sidebar` (right sidebar, not a modal)
