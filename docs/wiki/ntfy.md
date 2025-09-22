# NTFY Service

## What is ntfy?
ntfy is a notification service that keeps your MyBookmarks devices connected. Messages are automatically encrypted so only the devices or contacts you invited can read them. You do not need to handle any technical steps – ntfy delivers the messages while MyBookmarks takes care of security and the actual content.

## Requirements
- By default MyBookmarks uses the server `https://ntfy.c5p.de`. This server works well for most users. You can enter your own ntfy server at any time in the settings.
- If your ntfy server requires authentication, add the matching token in the settings. MyBookmarks will attach it to every request automatically.

## Set up ntfy in MyBookmarks
1. Open the main menu and go to **Settings**.
2. Switch to the **Sharing & Sync** section.
3. If you want to use your own ntfy server, enter the address here. Make sure it starts with `https://` and does not end with an extra slash.
4. If your server needs a token, paste it into the **Auth Token** field. Leave the field empty if no token is required.
5. Save your changes. New connections will use the updated settings right away.

## Everyday use
### Connecting contacts
- Invite contacts by scanning or importing their MyBookmarks card. A secure ntfy channel is created for each confirmed contact automatically.
- As soon as the contact accepts, new or updated bookmarks appear on both sides without any manual refresh.
- If you block a contact, their messages are ignored from that point on.

### Sharing groups
- When you share a group, the app assigns its own ntfy channel to it. All members see new or changed bookmarks almost instantly.
- Large updates (for example many bookmarks at once) are sent in several small messages. This happens automatically; no action is needed.
- If someone has been offline for a while, MyBookmarks will fetch the missing changes once they come back.

### Quick Code for new devices
- Quick Codes are the fastest way to add another device. Start the quick code dialog, enter the six-digit code on the second device, and both devices exchange the required data over ntfy.
- The code is valid for a short time only. If the connection drops or takes too long, simply start again.
- After the pairing is complete, MyBookmarks closes the temporary channel automatically.

## Tips & good practices
- **Check the connection:** If updates stop arriving, first verify that the ntfy server is reachable (browser or terminal) and that the address in the settings is correct.
- **Keep the token current:** When you change the token on your ntfy server, remember to update it in MyBookmarks as well. Otherwise messages cannot be delivered.
- **Stay organized:** Remove shared groups or contacts you no longer need. MyBookmarks closes their ntfy channels and keeps the list tidy.
- **Protect your privacy:** Share your ntfy server and token only with people you trust. Anyone with access could otherwise read or send messages.

With these basics in place, ntfy runs quietly in the background. As long as the server is reachable, your bookmark updates will arrive automatically without any extra effort.
