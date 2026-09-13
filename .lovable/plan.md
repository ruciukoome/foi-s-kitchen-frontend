# Restore sign-in on the Netlify site

## Confirmed diagnosis

The live page at `https://foiskitchen.netlify.app/sign-in` reaches the intended Supabase project at `brfjqjypqsoafcwqceew.supabase.co`, but Supabase returns `401 Invalid API key` for both:

- the account settings request
- the email/password sign-in request

This confirms the deployed Project URL is usable, while the public key embedded in the Netlify build does not belong to that project or is no longer valid. Google sign-in uses the same client configuration, so its redirect cannot complete reliably until this is corrected.

## Fix and verify

1. In the matching Supabase project, copy the current **Publishable key** (or legacy `anon` public key) from **Project Settings → API**.
2. In Netlify, replace `VITE_EXT_SUPABASE_ANON_KEY` with that exact value and confirm `VITE_EXT_SUPABASE_URL` is `https://brfjqjypqsoafcwqceew.supabase.co`.
3. Trigger a fresh Netlify deploy. These values are embedded when the site is built, so changing them without redeploying will not update the live page.
4. Re-test the live account settings request and email/password sign-in. A wrong password should produce the normal credentials message, not an account-unavailable or invalid-key message.
5. Re-test Google sign-in through `/auth/callback`, confirming a customer lands on the home page and an admin lands on Admin Orders.
6. If Google alone still fails after the key is accepted, inspect the returned OAuth error and verify these entries:
   - Supabase Site URL: `https://foiskitchen.netlify.app`
   - Supabase allowed redirect URL: `https://foiskitchen.netlify.app/auth/callback`
   - Google OAuth authorized redirect URI: the Supabase callback URI shown under Authentication → Providers → Google

## Technical note

No source-code guess should replace the rejected deployment credential. The current frontend already sends requests to the correct project and exposes Supabase's real invalid-key response. Code changes are only warranted if testing after the Netlify key replacement reveals a separate callback or routing failure.
