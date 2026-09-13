# Fix "Accounts aren't available" on the Netlify domain

## Root cause

Sign-in on the Lovable preview works, but on your Netlify domain it fails. Here is why:

- The app gets its Supabase URL and anon key from a **server function** (`getSupabasePublicConfig`) that reads Lovable's stored secrets (`EXT_SUPABASE_URL`, `EXT_SUPABASE_ANON_KEY`).
- Those secrets only exist inside Lovable's runtime. When the site runs on Netlify, the server function either doesn't run at all or runs without those variables, so it reports "not configured" — and the app shows "Accounts aren't available right now."

Netlify builds need the public config baked in at build time instead.

## What will change

1. **Build-time public config** — in `src/integrations/supabase-external/client.ts`, read `VITE_EXT_SUPABASE_URL` and `VITE_EXT_SUPABASE_ANON_KEY` from `import.meta.env` first (these are safe to expose — the anon key is public by design). Fall back to the existing server function when they're absent, so the Lovable preview keeps working unchanged.
2. **Netlify environment variables** — you add two variables in Netlify → Site configuration → Environment variables, then redeploy:
   - `VITE_EXT_SUPABASE_URL` = your Supabase project URL
   - `VITE_EXT_SUPABASE_ANON_KEY` = your anon/public key
3. **Server-side features on Netlify** (order saving, CMS admin writes) use the service-role key via server functions. If you use Netlify Functions for those, `EXT_SUPABASE_SERVICE_ROLE_KEY` must also be added as a Netlify env var (same name, no `VITE_` prefix). The plan notes this; exact steps depend on how your Netlify deploy serves the server routes.
4. **Supabase redirect allow-list** — for Google sign-in and password-reset emails on Netlify, the Netlify domain (and `/auth/callback`, `/reset-password` paths) must be added under Supabase → Authentication → URL Configuration. Will list exactly what to add.

## Verification

- Typecheck + build pass.
- Browser check on the Lovable preview: sign-in page still loads and authenticates (fallback path intact).
- After you add the two Netlify env vars and redeploy, sign-in/sign-up on the Netlify domain works. I can verify via the live Netlify URL if you share it.

## What you need to do (I'll give exact click-paths)

- Add the two `VITE_` variables in Netlify and trigger a redeploy.
- Add the Netlify URL to Supabase's allowed redirect URLs.
