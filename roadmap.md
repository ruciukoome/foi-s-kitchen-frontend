# Foi's Kitchen — CMS build roadmap

- [x] Part 1: media bucket + MediaPicker + /admin/media
- [x] Part 2: catalog tables code (menu, services, tiers, plans, testimonials, gallery)
- [x] Part 3: page_sections + global business info (+ SiteInfoProvider wired in __root)
- [x] Part 4: seed script (scripts/seed-cms.ts) — uploads src/assets, fills every table
- [x] Part 5: public pages read from the database
- [x] Part 6: admin editor pages + /admin nav
- [x] Validate and normalize deployed account settings, with a safe server fallback
- [x] Complete Google and email-link PKCE sessions before redirecting

- [x] Schema applied + seed run (38 photos, 12 menu items, 3 services, 9 tiers,
      3 plans, 4 reviews, 12 gallery items, 12 page sections)

## Sign-in routing hardening (2026-09-14)
- [x] Clear stale profile on account switch so customers are never routed to the admin dashboard
- [x] Post-profile-save "Go to home page" option on My Account
- [x] Column-level grants so customers cannot flip is_admin (needs re-run in Supabase SQL editor)
