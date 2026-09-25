# Send orders and quotation requests by email (Resend)

## What the customer sees
- On **Request a Quotation** and the **Order** checkout step, customers pick how to send: **Send by email** (they stay on the site) or **Continue on WhatsApp** (works as it does now).
- Choosing email asks for their email address (it's filled in for signed-in customers), then sends with one tap and shows a warm "Got it — we'll be in touch" confirmation on the page.
- The customer gets a **confirmation email** in the Foi's Kitchen style (logo, cream background, wine-red accents, Poppins/Lato look) with a copy of their order or quote details and a reference number, so it feels official.
- Foi's Kitchen gets a **notification email** at the business address with the same details and a reply-to set to the customer, so staff can just hit Reply.
- If sending fails, the customer sees a clear message and the WhatsApp button stays available as a backup, so no order is lost.

## Setup needed from you
1. A Resend account with your domain (e.g. foiskitchen.co.ke) verified in Resend. Until it's verified, Resend only delivers to your own account email, so customer confirmations won't arrive.
2. A Resend API key saved as `RESEND_API_KEY` in Netlify's environment settings (and in the project here for the preview).
3. Confirm the "from" address (default: `Foi's Kitchen <orders@foiskitchen.co.ke>`) and the inbox that should receive new orders/quotes (default: the business email in the CMS).

## Scope notes
- Only one-to-one emails triggered by the customer's own order or quote. Newsletter/bulk sending stays out of this change.
- Email orders are also recorded like today (cart snapshot marked as converted), so they don't show up as abandoned carts.

## Technical details
- New `src/lib/email.functions.ts`: two server functions, `sendQuoteEmail` and `sendOrderEmail`, each with a fixed template and a zod-validated payload (no arbitrary recipient/template from the browser; length limits; honeypot field for spam). They call `https://api.resend.com/emails` directly with `process.env.RESEND_API_KEY` read inside the handler — direct API (not the connector gateway) because the live site runs on Netlify, where gateway credentials aren't available. Two sends per submission: customer confirmation + business notification (`reply_to` = customer). Provider errors are logged and returned as a friendly message.
- New `src/lib/email-templates/` (`layout.ts`, `quote.ts`, `order.ts`): inline-styled HTML built with escaped strings, brand hex values inlined (email clients can't read CSS variables), white body background, logo via absolute URL from `SITE_URL`. Order template lists items, quantities, prices in KSh, total, delivery method/address.
- Reference number: short generated ID (e.g. `FK-Q-240926-3F2A`) shown on page and in both emails.
- `QuoteForm.tsx`: add email field + "Send by email" primary button; WhatsApp becomes the secondary button; remove the old mailto link.
- `order.tsx`: add "Send order by email" alongside WhatsApp checkout; reuse existing optional email field (made required only for the email path); call `markCartConverted` on success.
- `ContactForm.tsx` left unchanged unless you want it included.
- Add `RESEND_API_KEY` to the project secrets; document the Netlify env var in `roadmap.md`.
