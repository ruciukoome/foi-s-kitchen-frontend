# Add Google One Tap sign-in

## What will change

1. Show Google’s familiar account chooser prompt on the sign-in and sign-up pages when Google allows it.
2. Use the Google Web Client ID already configured in the connected account service, without exposing private credentials.
3. Sign the selected Google account into the existing customer account system, then route customers home and admins to Admin Orders.
4. Keep the current “Continue with Google” button as a fallback when the prompt is dismissed, blocked, or unsupported.

## Technical details

- Load Google Identity Services only on the account pages.
- Read the public Google client ID from the existing provider configuration through a small server function.
- Exchange Google’s returned ID token through the existing account client.
- Avoid showing the prompt to users who are already signed in.

## Verification

- Verify the prompt initializes without page errors.
- Verify the fallback button remains usable.
- Verify successful Google sign-in follows the existing role-based destination.
- Confirm the preview builds successfully.
