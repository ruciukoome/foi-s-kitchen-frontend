# Nicer sign-in / sign-up, with password tools

## What you'll get

- A more polished look for both the sign-in and create-account pages: a softer card with a small logo lockup, clearer heading and helper text, tidier spacing, and the same wine-red buttons and cream/gold styling used elsewhere on the site.
- An eye icon inside every password box so you can reveal or hide what you typed before submitting.
- On create-account: a **Confirm password** box. If the two don't match, the form won't submit and shows a clear message under the field. A short live hint also shows whether the password meets the 6-character minimum.
- A **Forgot password?** link on the sign-in page.
- A new **Forgot password** page: enter your email, we send a reset link, and you see a confirmation message.
- A new **Reset password** page the emailed link opens: type the new password twice (both with eye icons), save, and you're signed in and sent to your account.

## Pages

- `/sign-in` — restyled, adds Forgot password link
- `/sign-up` — restyled, adds Confirm password
- `/forgot-password` — new
- `/reset-password` — new, opened from the reset email

## Technical notes

- `src/components/AuthPanel.tsx`: add a small reusable `PasswordField` (label + input + eye toggle button using `Eye`/`EyeOff` from lucide-react, `aria-label` and `aria-pressed` set). Add confirm-password state and client-side validation for sign-up only. Restyle the card container and add a heading block; keep `fieldClass` / `primaryButtonClass` from `src/lib/ui.ts` and semantic tokens only (no hardcoded colours). Existing sign-up/sign-in/Google logic and role-based routing stay unchanged.
- New `src/routes/forgot-password.tsx` (`ssr: false`): calls `client.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })`, shows a neutral "if an account exists, check your email" state.
- New `src/routes/reset-password.tsx` (`ssr: false`): relies on the recovery session Supabase establishes from the link; calls `client.auth.updateUser({ password })` after confirming the two entries match, then navigates to `/account`. Handles the "link expired or invalid" case with a link back to `/forgot-password`.
- Both new routes get their own `head()` with unique title/description/og tags; reset page marked `noindex`.
- Reuse `PageHeadingRow` for the compact Lora-italic heading rows to match other pages.

## On your side

The reset email link must be allowed: in Supabase → Authentication → URL Configuration, add your site and preview URLs plus `/reset-password` to the redirect allow-list.
