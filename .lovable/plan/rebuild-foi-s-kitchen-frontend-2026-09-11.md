# Rebuild Foi's Kitchen frontend

Recreate the Foi's Kitchen site in this project as a frontend-only build: same look, same pages, same words and pictures — with no sign-in, accounts or order history.

## What gets rebuilt

**Look and feel**
- The full colour set: cream background, charcoal-brown text, wine red, blush pink (only behind Meal of the Day), gold (only as thin dividers), sage (only on dietary tags), WhatsApp green — light and dark values, plus the shared rounded corners, shadows and animations.
- Fonts: Poppins for headings and navigation, Lato for body text, Lora italic for the small page-heading rows ("Services 〜 Pick a category…"). Loaded through the page head, not the stylesheet.
- All 40+ photos and the logo are copied across unchanged.

**Pages**
- Home — hero carousel, "What we offer", featured menu categories, Meal of the Day, How it works, testimonials
- About
- Services — tabbed by web address (`?category=corporate/weddings/meal-prep`), switches without reloading
- Menu — category tabs, search, dietary filters, add to order
- Order — three-step basket and checkout that hands off to WhatsApp
- Request a Quotation
- Gallery & Reviews
- Contact

**Shared pieces**
- Header with navigation, basket counter and "Order Now" dropdown; footer; floating WhatsApp button; sticky order bar on mobile.
- The basket saved in the browser, and the WhatsApp checkout message, working exactly as before.

**The two fixes**
1. Menu category comes only from the web address, so tapping a different category from anywhere always lands on the right tab.
2. Header dropdowns open on click or tap only, close on outside click or Escape, and never depend on hovering — so they work on phones.

## Deliberately left out

Sign-in, sign-up, account pages, saved profiles, admin order list, and saving orders to a database. Orders go to WhatsApp only. The Order page will no longer prefill details from a saved profile, and the header loses the account avatar/menu.

## Technical notes

- Copy `src/assets/*` (real image files only — the stray `foi-logo.jpeg.asset.json` pointer is unused and skipped), `src/data/{menu,plans,services,gallery,testimonials}.ts`, `src/lib/{site,cart,utils}.ts(x)`, all `src/components/*` except `AuthForm.tsx`, and `src/styles.css`.
- Routes recreated: `index`, `about`, `services`, `menu`, `order`, `quote`, `gallery`, `contact`. `account.*`, `admin.orders`, `sign-in`, `sign-up` are dropped. `__root.tsx` gets the header/footer/Sonner shell and the Google Fonts `<link>`; no Supabase provider or auth wrapper.
- Strip `@/integrations/supabase/*` and `@/lib/auth` imports from `SiteHeader.tsx` and `order.tsx`; `saveOrder` becomes a local confirm + WhatsApp handoff.
- Menu page: replace `useState<Category>` with `Route.useSearch()` plus `navigate({ search })` on tab change, mirroring `services.tsx`; keep search text and diet filter as local state.
- Header dropdown: rewrite as a click-toggled component with `pointerdown`-outside and Escape listeners, `aria-expanded`/`aria-controls`, and focus return to the trigger. No hover handlers.
- Copy shadcn `ui/*` components the pages actually use; install any missing packages (embla, radix bits, sonner, zod, react-hook-form are already present — verify and add the rest).
- Each route keeps its own `head()` title/description/og tags from the old project.
