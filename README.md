# MyBookmarks (Prototype)

A standalone bookmark manager built with HTML, CSS, and JavaScript. Vue.js powers the reactive UI layer, while Bootstrap provides layout components and utility styling. The main UI lives in [`src/index_dev.html`](src/index_dev.html) and runs entirely inside the browser, storing its data in `localStorage`. No build tooling is required—open the file in any modern browser to explore the full experience.

## Features

- **Rich bookmark workspace** – Organise links into draggable groups, expand/collapse sections, edit inline, tag with keywords, and surface link metadata with detailed popovers.
- **Advanced search & discovery** – Filter across groups and links, highlight duplicates, inspect JSON payloads, and capture snapshots for undo/redo workflows.
- **Flexible import/export** – Round-trip data through JSON, CSV, Netscape HTML, and clipboard pastes. Dedicated dialogs guide exporting selections or bulk importing.
- **Favicon management** – Auto-fetch icons, upload/remove per item, and maintain reusable favicon rules with presets, comments, testing, JSON export/import, and default restoration.
- **Collaboration & sharing (optional)** – Push updates via ntfy topics, invite collaborators, generate QR codes, broadcast snapshots, and reconcile conflicts through the integrated event-log system.
  - **Encrypted ntfy delivery** – Each client derives its own public/private key pair; messages are encrypted end-to-end when sharing entire groups, individual links, or broadcast snapshots.
- **Sync integrations (optional)** – Hook into Nextcloud Bookmarks REST endpoints or CardDAV servers, complete with hash caching, rate limits, conflict handling, and diagnostics.
- **Deep customization** – Toggle dark mode, apply per-element styling through the visual CSS editor, manage custom design tokens, and expose advanced developer routing with extensive logging utilities.

## Technology Stack

- **Vue.js** – Core view-model binding and reactivity for the application shell and dialogs.
- **Bootstrap 5 (JS/CSS)** – Modal/dialog behaviour, layout helpers, and component styling.
- **jQuery (trimmed build)** – Legacy DOM utilities leveraged by helper routines.
- **Dexie.js** – IndexedDB wrapper used for local persistence and migration flows.
- **Plain HTML/CSS/ES2015+ JavaScript** – Custom business logic, state management, and UI rendering.

## Getting Started

1. Clone or download this repository.
2. Open `src/index_dev.html` directly in your browser **or** serve the `src/` folder:
   ```bash
   cd src
   python3 -m http.server 8080
   ```
   Navigate to [http://localhost:8080](http://localhost:8080).

## Data Management

- All state is stored in `localStorage` under the `links` key. Use the built-in backup/restore dialogs for safer migrations.
- The favicon rules dialog supports JSON import/export, letting you version-control shared rule sets.
- Snapshots and duplicate reports are available from the toolbar for quick diagnostics.

## Sync & Sharing

- **Nextcloud Bookmarks** – Configure server URL, credentials, and folder scope; the app handles folder discovery, hashing, and conflict resolution.
- **CardDAV** – Optional address-book sync (requires the browser extension) with scheduling, token management, and logging.
- **ntfy / Invitations** – Share selections or entire groups via ntfy topics or contact invites, with QR-code and clipboard helpers built in.

## Customisation

- Use the visual CSS editor to tweak colours, typography, and layout on a per-element or per-group basis.
- Define global or scoped design tokens; export presets for reuse across workspaces.
- Toggle dark mode, adjust performance thresholds, and reshuffle layout defaults from the options dialog.

## Keyboard & Productivity Tips

- Double-click group titles to edit in place; drag via the handle to reorder groups.
- Use the snapshots dropdown for quick undo/redo checkpoints.
- Hover link badges for metadata popovers; detailed inspectors are available from the toolbar.

## Contributing

This prototype is intentionally self-contained. If you spot issues or want to propose enhancements, open a discussion or pull request describing the change and manual test steps.

## AI-Generated Code Caveats

Large portions of this project were produced with the help of AI tooling. While functional, the codebase may exhibit behaviours that experienced developers could perceive as unpolished:

- Redundant or duplicated logic blocks that were never consolidated.
- Mixed naming conventions and inconsistent formatting/comment styles.
- Defensive checks that overlap with upstream validations or are overly verbose.
- Legacy compatibility shims left in place even when feature flags have moved on.
- Sprawling utility helpers (e.g., logging, DOM tweaks) that could be simplified or modularised.

Treat the implementation as a prototype; refactoring and alignment with your team’s standards are encouraged before production use.

---

> **Note**
> Testing is manual: after changes, add/edit/remove links, verify persistence, exercise import/export workflows, and trigger the favicon-rule presets to confirm UI additions.
