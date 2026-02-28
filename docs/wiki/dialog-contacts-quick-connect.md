# Dialog: Contacts and Quick-Connect

## Purpose
Manages contacts and fast pairing of new contacts using a 6-digit code.

## Tabs in the dialog
1. `Contacts`
- Shows contacts with online status.
- Send test message.
- Remove contact.

2. `Quick-Connect`
- `Receive` mode: generate and share your code.
- `Send` mode: enter peer code and connect.
- Status log shows handshake progress.

## Removing a contact: additional effects
Contact removal is intentionally strict and performs cleanup:
- Removes the contact from your shared groups.
- Removes groups owned by that contact.
- Unsubscribes the pairwise channel.
- Adds the UUID to the blocked list.

## Closing the dialog
Closing resets Quick-Connect state and stops active pairing.

## Important relationships
- Contacts are foundational for sharing workflows.
- Online status influences whether certain sharing actions are immediately possible.

## Technical
- Handler: `openContactsDialog()`
- Dialog container: `#contactsModal`
