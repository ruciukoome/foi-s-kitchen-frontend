/**
 * Writes public/sitemap.xml from the list of public routes.
 * Run with: bun run scripts/generate-sitemap.ts
 * (also wired into the build via package.json "prebuild")
 *
 * Admin, account and auth routes are intentionally excluded — they are also
 * disallowed in public/robots.txt.
 */
import { writeFileSync } from "node:fs";

const SITE_URL = (process.env.VITE_SITE_URL ?? "https://foiskitchen.netlify.app").replace(/\/$/, "");

const routes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/menu", changefreq: "weekly", priority: "0.9" },
  { path: "/order", changefreq: "weekly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.8" },
  { path: "/services/corporate", changefreq: "monthly", priority: "0.8" },
  { path: "/services/weddings", changefreq: "monthly", priority: "0.8" },
  { path: "/services/meal-prep", changefreq: "monthly", priority: "0.8" },
  { path: "/quote", changefreq: "monthly", priority: "0.8" },
  { path: "/gallery", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
];

const lastmod = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path === "/" ? "/" : route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync("public/sitemap.xml", xml);
console.log(`Wrote public/sitemap.xml with ${routes.length} URLs for ${SITE_URL}`);
