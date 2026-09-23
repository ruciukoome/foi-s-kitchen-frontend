# Privacy policy, cookie banner and honest marketing consent

Adds a proper privacy page, a lightweight cookie notice, and makes marketing opt-in a deliberate choice instead of the default.

## 1. Privacy Policy page (`/privacy`)

New page written in plain, warm language, matching the existing page layout (hero + sections, same cards and spacing), covering:

- What we collect: name, phone, email, delivery address, order history, payment confirmation details, marketing preferences.
- Where it comes from: account sign-up, quote form, contact form, newsletter box, and saved (unfinished) carts.
- Why, and on what basis: orders and quotes because we need it to cook and deliver; marketing only with consent.
- Who sees it: our hosting/database provider, M-Pesa/Safaricom for payment confirmation, WhatsApp when we message you about an order.
- How long we keep it, and a clear statement that we never sell data.
- Cookies and tracking: which are essential and which are optional.
- Your rights: see your data, correct it, delete it, or stop marketing — with the kitchen's email address and WhatsApp as the way to ask.

A "Request your data" block on the page reuses the existing contact form pattern, pre-filled with a data request message so a customer can send it in one tap.

Linked from the footer next to the existing links.

## 2. Cookie consent banner

Small dismissible bar at the bottom on first visit: one line of copy, Accept and Reject buttons, link to the privacy page. Choice saved in the browser and remembered.

Checked what actually runs today: there are no analytics or marketing pixels in the project. The only third-party script is Google sign-in, which loads on demand and is essential to signing in. So the banner honestly states that only essential cookies are in use, and the stored choice becomes the gate any future analytics must pass — a small helper exposes "has the visitor accepted optional cookies?" so nothing can be added later without respecting it.

## 3. Marketing consent no longer defaults to yes

- `docs/marketing-schema.sql`: `marketing_opt_in` default changes to `false`, with a commented migration note.
- Sign-up form: a new unchecked box — "Email me Foi's Kitchen specials and menu updates. You can unsubscribe any time." The choice is carried through sign-up so the new profile records it.
- Footer newsletter box: same unchecked box; the form will not submit without it, since signing up for the newsletter is itself the consent.
- Account page keeps working as-is; nothing in ordering or checkout changes.

## Needs your decision (not applied automatically)

Existing customers currently sitting at opt-in = true were never asked. I will **not** flip them. Your options, once the rest is live:

1. Leave them as they are (they were auto-opted-in — legally weak).
2. Set everyone to false and send one re-permission email asking people to opt back in (cleanest, shrinks the list).
3. Set false only for accounts that never actually ordered.

Tell me which and I will write the one-line SQL. The schema file will carry this note so it is not forgotten.

## Technical notes

- New: `src/routes/privacy.tsx` (with `head()`/`pageSeo` like other routes), `src/components/CookieConsentBanner.tsx`, `src/lib/consent.ts` (localStorage read/write + `hasAnalyticsConsent()`), `src/components/DataRequestForm.tsx` (thin wrapper over the existing ContactForm/WhatsApp pattern).
- Changed: `src/routes/__root.tsx` (mount banner), `src/components/SiteFooter.tsx` (privacy link), `src/components/AuthPanel.tsx` (consent checkbox on sign-up, passed in `raw_user_meta_data`), `src/components/NewsletterSignup.tsx` (consent checkbox), `docs/marketing-schema.sql` (default false, `handle_new_user` reads the signup flag, migration note), `scripts/generate-sitemap.mjs` + `public/sitemap.xml` (add `/privacy`).
- No new dependencies. Banner uses existing tokens and button classes; renders after hydration to avoid SSR mismatch.
- The schema change only takes effect after you run `docs/marketing-schema.sql` in the database SQL editor.
