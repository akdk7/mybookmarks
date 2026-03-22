# Dialog: Local Encryption (Password)

## Purpose
This dialog appears when local encryption is enabled in options and a password must be set for the encrypted local database.

## Inputs
- Password
- Confirm password

## Validation
The dialog checks:
- Password must not be empty.
- Minimum length is 8 characters.
- Password and confirmation must match.

If validation fails:
- An error is shown in the dialog.
- The dialog remains open.

## Completion behavior
- On success, the password is returned to the caller.
- On cancel, the result is `null`.
- On close, input fields are cleared.

## What happens after setup
- Locally stored app data is encrypted before being written back
- The encrypted store can later be locked again automatically
- When the encrypted store is locked, an unlock overlay blocks normal app usage until the correct password is entered

## Unlock flow
- The unlock UI asks for the current password
- Failed unlock attempts keep the data locked and show an error
- A session timeout can re-lock the local data automatically

## Relationship to options
This is not an independent toolbar dialog. It is part of the options workflow:
- [Dialog: Options](https://github.com/akdk7/mybookmarks/wiki/Dialog:-Options)

## Important note
- This protects local browser-stored data, so exports are still important for backup and migration.

## Technical
- Triggered via `promptForLocalSecurityPassword()`
- Dialog container: `#localSecurityPasswordModal`
- Unlock action: `submitLocalSecurityUnlock()`
- Lock overlay: `.mb-local-lock-overlay`
