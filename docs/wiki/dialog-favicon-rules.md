# Dialog: Favicon Rules

## Purpose
This dialog manages custom favicon rules.

## What you can do in this dialog
- Add a rule.
- Choose rule type: `domain`, `prefix`, `regex`.
- Maintain pattern and comment.
- Set icon via upload.
- Auto-fetch icon via extension.
- Export and import rules.
- Restore default rules.
- Test URL matching and preview matched icon.

## Rule matching (simplified)
1. Only enabled rules with an icon are considered.
2. Domain rules match against hostname.
3. Prefix rules match URL start.
4. Regex rules use regular expressions.
5. If multiple rules match, the more specific (longer) one wins.

## Save logic
- On save, the working list of rules is written to the app settings.
- Visible links are refreshed so icon changes appear immediately.

## Safety and size limits
- Upload/import blocks non-image files.
- Very large data URLs are limited (typically max. 256 KB).

## Important relationships
- Rules affect link rendering and edit dialogs.
- The dialog is reachable directly from toolbar and indirectly from options.

Related pages:
- [Toolbar Functions](https://github.com/akdk7/mybookmarks/wiki/Toolbar-Functions)
- [Dialog: Options](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Options)

## Technical
- Handler: `openFaviconRulesModal()`
- Dialog container: `#faviconRulesModal`
