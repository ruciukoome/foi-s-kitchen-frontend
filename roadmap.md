# Foi's Kitchen — CMS build roadmap

- [x] Part 1: media bucket + MediaPicker + /admin/media
- [x] Part 2: catalog tables code (menu, services, tiers, plans, testimonials, gallery)
- [x] Part 3: page_sections + global business info (+ SiteInfoProvider wired in __root)
- [x] Part 4: seed script (scripts/seed-cms.ts) — uploads src/assets, fills every table
- [x] Part 5: public pages read from the database
- [x] Part 6: admin editor pages + /admin nav
- [x] Validate and normalize deployed account settings, with a safe server fallback
- [x] Complete Google and email-link PKCE sessions before redirecting
- [x] Add Google One Tap account chooser on sign-in/sign-up, with the existing Google button as fallback

- [x] Schema applied + seed run (38 photos, 12 menu items, 3 services, 9 tiers,
      3 plans, 4 reviews, 12 gallery items, 12 page sections)

## Sign-in routing hardening (2026-09-14)
- [x] Clear stale profile on account switch so customers are never routed to the admin dashboard
- [x] Post-profile-save "Go to home page" option on My Account
- [x] Column-level grants so customers cannot flip is_admin (needs re-run in Supabase SQL editor)

## Marketing & abandoned carts (2026-09-19)
- [x] docs/marketing-schema.sql — profiles.email + marketing_opt_in, admin read policy,
      newsletter_subscribers, abandoned_carts (RLS + grants)
- [x] Footer newsletter sign-up box
- [x] Order page saves a cart snapshot at the Details step, marks it converted on WhatsApp
- [x] /admin/marketing (contacts + CSV export) and /admin/carts (reminders)
- [ ] Run docs/marketing-schema.sql in the Supabase SQL editor (blocked: needs Foi)

## SEO (Sep 2026)
- [x] Per-route title/description/OG/Twitter/canonical via `src/lib/seo.ts`
- [x] JSON-LD: LocalBusiness/Restaurant, WebSite, Menu+MenuItem, Review+AggregateRating, Service, BreadcrumbList
- [x] Dedicated service URLs: /services/corporate, /services/weddings, /services/meal-prep (legacy ?category= redirects)
- [x] sitemap.xml generated at build (`npm run sitemap`), robots.txt disallows admin/account/auth
- [x] noindex on admin, account and auth routes
- [x] Service-area block on About + Contact; NAP consistent with CMS business details
- [ ] Register sitemap in Google Search Console + create Google Business Profile
- [ ] Add a precise street address in Admin → Page Text (improves local ranking)
