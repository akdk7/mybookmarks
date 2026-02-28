# Dialog: Duplicates

## Purpose
Helps find and remove duplicate links (same URL in multiple groups).

## Beginner workflow
1. Click the duplicate finder button.
2. The app builds a duplicate map based on normalized URLs.
3. The dialog shows all occurrences per URL.
4. By default, the first occurrence is `Keep`; additional ones are preselected for `Remove`.
5. Adjust checkboxes and run `Remove Selected Duplicates`.

## Safety logic during deletion
- The app prevents deleting all copies of the same URL.
- If all are selected, at least one is automatically kept.

## After deletion
- Links are removed from groups.
- Indices are recalculated.
- Data is saved.
- The dialog closes.

## Important relationships
- Results indirectly affect export, search, and shortcuts because the link dataset is cleaned up.

## Technical
- Entry function: `findAndResolveDuplicates()`
- Dialog container: `#duplicatesModal`
