# Foi's Kitchen Frontend

Reference @project:53771100-876b-4d9e-9af8-e1443688739a:"Foi's Kitchen Website"  and rebuild this project's entire
frontend based on it — same design system, same pages, same components.
Specifically bring over:

- The full colour palette and design tokens from src/styles.css: cream
  background, charcoal-brown text, wine-red primary, blush pink (used
  only as the Meal of the Day section background), gold (used only as
  thin dividers/borders), sage (dietary tags only), WhatsApp green.
- Typography: Poppins for headings/nav, Lato for body, Lora italic for
  the compact page-heading rows ("Services 〜 Pick a category...").
- The logo, asset images, and all copy/content as-is.
- Every page as currently built: Home (with hero carousel, "What we
  offer" services section, featured menu categories, Meal of the Day,
  How it works, testimonials), About, the tabbed Services page
  (/services?category=corporate/weddings/meal-prep, search-param driven,
  no page reload on tab switch), Menu (category tabs, search, dietary
  filters, cart), Order, Request a Quotation, Gallery & Reviews, Contact.
- The cart system (localStorage-based) and WhatsApp checkout flow exactly
  as it currently works.

Do NOT bring over anything related to Supabase, authentication, sign-in/
sign-up, user accounts, or order tracking — none of that exists in this
new project yet. This is a frontend-only rebuild for now.

While rebuilding, fix two known issues from the old project:
1. On the Menu page, the selected category must be driven entirely by
   the ?category= URL search param (the way the Services page already
   does it) — not local component state — so that clicking a different
   category link while already on the Menu page updates correctly.
2. Any dropdown menu in the header (Order Now, and any future account
   menu) should open only on click/tap, close on clicking outside or
   pressing Escape, and must NOT rely on mouse-hover to open — this
   needs to work correctly on touch devices.

After this, tell me exactly what was recreated and flag anything from
the old project you weren't able to bring over cleanly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6484223c-e661-4e12-a4ca-33797a4a828c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
