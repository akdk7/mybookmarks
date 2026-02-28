# Dialog: Local Encryption (Password)

## Purpose
This dialog appears when local encryption is enabled in options.

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

## Relationship to options
This is not an independent toolbar dialog. It is a sub-dialog in the options workflow:
- [Dialog: Options](dialog-optionen.md)

## Technical
- Triggered via `promptForLocalSecurityPassword()`
- Dialog container: `#localSecurityPasswordModal`
