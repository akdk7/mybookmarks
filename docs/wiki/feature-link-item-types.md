# Feature: Link Item Types

## Purpose
Groups can contain more than plain URL links. The app supports multiple item types for structure, notes, and reuse.

## Supported item types
### 1. Standard links
- Normal bookmark entries with URL, title, favicon, keywords, copy/QR/share actions, and optional placeholders

### 2. Separators
- Visual section dividers inside a group
- Can be collapsed/expanded to hide or reveal the links below until the next separator
- Useful for sub-sections inside a single group column

### 3. Notes
- Non-URL content rows for explanatory text
- Support their own title/body presentation
- Useful for instructions, reminders, or context directly inside a link list

### 4. Reference links
- Reuse the URL and metadata of an original source link
- Can define a custom local display text
- Can inherit source keywords and optionally add local keywords
- Show a dedicated reference marker when enabled in options

## Creation flows
- Add separators and notes from the group add-link menu or group context menu
- Create a reference link from a normal link via the link context menu

## Reference-link editing
The reference-link editor supports:
- Custom alias text
- Expression Editor integration for the alias text
- Optional inheritance of original keywords
- Additional local keywords
- Placeholder handling for reference-specific text templates

## Important behavior
- Separators and notes are non-URL item types and do not behave like normal openable links
- Reference links stay connected to the original link data for URL/metadata
- Deleting a source link warns if reference links still depend on it

## Typical use cases
- Separators for thematic grouping inside a large group
- Notes for onboarding hints or process steps
- Reference links when one canonical URL should appear in multiple groups with different labels

## Technical
- Add actions: `openAddSeparatorDialog()`, `openAddNoteDialog()`
- Reference creation: `createReferenceLinkFromContext()`
- Reference editor container: `#referenceAliasModal`
