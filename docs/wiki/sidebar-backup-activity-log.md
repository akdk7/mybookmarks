# Sidebar: Backup Activity Log

## Purpose
The Backup Activity Log gives users a quick overview of backup-relevant changes since the last export or snapshot.

## How it is opened
- Via the optional backup urgency indicator next to storage usage in the toolbar/search area

## What the sidebar shows
- A summary hint describing current backup urgency
- Chronological backup-related log entries
- Timestamps for each entry
- Linked snapshot information when available
- Direct restore links for snapshots that still exist

## Typical entry types
- Change registered since the last backup
- Backup created
- Snapshot restored
- Snapshot deleted

## Change detail categories
Detailed change summaries can mention:
- groups added/removed/renamed
- links added/removed/updated/moved
- placeholders added/removed/renamed/updated
- placeholder rules added/removed/updated/disabled/enabled
- placeholder-prompt configuration changes
- API binding changes on links
- settings changed

## How change summaries are built now

Current behavior:

- the log prefers concrete change details over a generic `settings updated` summary when structured detail items are available
- setting-path entries are resolved to human-readable option labels when the setting is known to the app
- the list view uses a compact summary built from the first concrete detail items and appends an overflow marker such as `+N more changes`

Practical consequence:

- newer entries should usually tell you what actually changed
- very old legacy entries can still stay generic if they were stored without detail items

## Why it matters
- Helps decide when a manual export is due
- Makes backup activity visible without opening raw data
- Connects recent changes with recoverable snapshots when available
- Makes configuration-heavy work, such as placeholder, rule, prompt-flow, or API-binding changes, much easier to audit before the next backup

## Important relationships
- Complements the Export dialog and the Snapshots dropdown
- Visibility and detail level are tied to backup reminder settings

## Technical
- Open/close: `openBackupActivitySidebar()`, `closeBackupActivitySidebar()`
- Data source: `getBackupActivityLogEntries()`
- Container: `.mb-backup-activity-sidebar`
