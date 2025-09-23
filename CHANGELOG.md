## Version 2025-09-23

### Improvement

- Shortcut menu on settings dialog for quick access
- Moved settings from the Synchronization section to the NTFY-sharing section
- Export dialog got the options to define the export-to filename
- Fiexed an issue that some link favicons being cleared when closing the Favicon rules dialog
- New css property to select the font-family
- Fixed a bug when a css property was added, clicked into the value field and then clicked into an empty area of the virtual css editor the property was removed
- Improved many css properties with more human friendly controls (still in progress)


## Version 2025-09-22

### Improvements

- Visual CSS Editor: enforced non-empty token names with inline validation, removed auto-reset defaults, and added clearer drop-zone interactions for drag & drop workflows.
- Link Popover: refined positioning and hover behaviour, auto-hides during drags, and now displays a live click counter fed by new link click tracking.
- Drag & Drop: matched horizontal and vertical placeholders to actual cards, widened catch areas only on hover, and ensured popovers collapse whenever dragging starts or ends.
- Favicons: introduced fallback-aware rule processing, a dedicated fallback flag in the rules UI, and kept the HTTP preset as an SVG-based safety net without overwriting existing icons.
- UI Polish: increased drop-zone visibility, tuned link/token editors, and tightened popover/drag visuals for a smoother, more predictable editing experience.


## Version 2025-09-21

### New Features

- Favicon rules with Url Prefix, Domain and Regex and upload for default icons
- Added built-in link shortener workflow across Chrome/Firefox extensions (Bitly, Rebrandly, TinyURL, Blink, Dub, Ow.ly, Replug, T2M) for sharing links directly from the app.
- Introduced a proxy-aware network layer with link security heuristics and UI feedback for risky URLs.

### Improvements

- Inlined the i18n and network services to simplify the single-file build and refreshed dark-mode styling for link shortener and favicon-rule dialogs.
- Refactored link-shortener handling into the reusable MB.LinkShorteners service.
- Extracted link security helpers into the new MB.Security utility, enabling consistent analyse/format helpers throughout the UI.
- Updated proxy translation strings and their placement.

### Documentation & Assets

- Extended the README (multiple tweaks plus new screenshot).
- Updated the LICENSE and footer information.
- Logged refactor follow-up ideas in docs/tasks/refactor_ideas.md.

### Maintenance

- Version bump to V2025-09-21.
- Adjusted .gitignore to drop DB_STORE artifacts.


## Version 2025-09-19

- Neu: Gruppen und Links Sync mit CardDAV und Nextcloud Bookmarks (beides aktuell noch experimentell und alpha)
- Visual CSS Editor: Auswahl der Elemente per Mausklick
- Visual CSS Editor: Design Tokens für wiederverwendbaren CSS Code
- Visual CSS Editor: CSS property presets
- Visual CSS Editor: Sortieren von Regeln
- Extensions: Chrome und Firefox Verison für Sync
- Bugfix: Default-Theme mit unpassenden Border-Styles für Gruppen
- Bugfix: Visual CSS Editor hat Designs an den Gruppen nicht angewendet
- Bugfix: Default-Templates für Duplicate Dialog angepasst


## Version 2025-09-15

- Drag and Drop: Ziehen von Gruppen und Link in neue Spalten möglich
- Progressives Laden von Links: Gruppen mit vielen Links (hunderte) kann im Browser Performance-Probleme verursachen. Durch das progressive Laden wird aber einer konfigurierbaren Anzahl ein Button angezeigt, mehr Links zu laden. Die Option ist in den globalen Einstellungen zu finden.
- Firefox und Chrome Extensions: Mit diesen Extension kann die lokale Linkliste Webseiten-Daten und Favicons laden. Zudem kann der Import nun Webseiten herunterladen und die Links extrahieren.
- Quick-Buttons: Die Quick-Buttons in der Gruppen-Titelzeile und Links können nun über Einstellungen angezeigt oder ausgeblendet werden
- Sync-Buttons: Die Buttons "Send link", "Send group", "Invite members", "Transfer ownership" und "Members..." werden nur angezeigt, wenn die NTFY-Url gesetzt wurde
- Diverse Bugfixes