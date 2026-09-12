# Foi's Kitchen — CMS build roadmap

- [x] Part 1: media bucket + MediaPicker + /admin/media
- [x] Part 2: catalog tables code (menu, services, tiers, plans, testimonials, gallery)
- [x] Part 3: page_sections + global business info (+ SiteInfoProvider wired in __root)
- [x] Part 4: seed script (scripts/seed-cms.ts) — uploads src/assets, fills every table
- [x] Part 5: public pages read from the database
- [x] Part 6: admin editor pages + /admin nav

BLOCKED: docs/cms-schema.sql must be run in the Supabase SQL editor (DDL cannot
be applied from here on an external project). After that, run:
  bun run scripts/seed-cms.ts
