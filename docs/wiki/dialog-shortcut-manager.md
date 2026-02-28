# Dialog: Shortcut Manager

## Purpose
Manages keyboard shortcuts for quickly opening links.

## Two main areas
1. Defined link shortcuts:
- Shows existing shortcut groupings.
- `Open now` opens assigned URLs immediately.

2. Global shortcuts:
- Multiple draft rows with shortcut, name, and target selection.
- Targets are selected in a group/link tree.

## Validation on save
When saving, the dialog validates:
- Shortcut must be valid.
- Reserved system/browser combinations are rejected.
- At least one target (group/link/URL) is required.

On validation errors:
- A warning toast is shown.
- Save is aborted.

## Many-tab opening and popup blockers
The app uses a staged open strategy:
- Opens in batches.
- Maintains a remaining queue.
- Shows hints if browser policies block tabs.

## Important relationships
- Targets reference current groups/links.
- Link changes can indirectly change shortcut behavior.

## Technical
- Handler: `openShortcutManagerDialog()`
- Dialog container: `#shortcutManagerModal`
