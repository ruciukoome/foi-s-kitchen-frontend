import { site } from "@/lib/site";

/**
 * Public base URL of the live site. Override per environment with
 * VITE_SITE_URL (Netlify → Site settings → Environment variables) when the
 * business moves to a custom domain.
 */
export const SITE_URL = (
  ((import.meta.env["VITE_SITE_URL"] as string | undefined) ?? "https://foiskitchen.netlify.app")
).replace(/\/$/, "");

/** Absolute URL for a site-relative path (crawlers need absolute og/canonical). */
export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Share images live in /public/og as 1200x630 crops so WhatsApp, Facebook and
 * X all render a rich preview. They are cropped copies of the same photos the
 * pages show.
 */
export const ogImage = (name: string) => absoluteUrl(`/og/${name}.jpg`);

type MetaEntry = Record<string, string>;

export type PageSeo = {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/menu". */
  path: string;
  /** File name inside /public/og, without the extension. */
  image?: string;
  type?: "website" | "article" | "profile";
};

/**
 * Title + description + Open Graph + Twitter card + canonical for one route.
 * Canonical is emitted here (leaf routes only — never in __root).
 */
export function pageSeo({ title, description, path, image = "default", type = "website" }: PageSeo): {
  meta: MetaEntry[];
  links: MetaEntry[];
} {
  const url = absoluteUrl(path);
  const img = ogImage(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: "en_KE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Wrap a schema.org object as a head() script entry. */
export const jsonLd = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data),
});

/* --------------------------------------------------------- schema builders */

/**
 * NAP (name, address, phone) for structured data. Sourced from `src/lib/site.ts`,
 * which SiteInfoProvider keeps in sync with the CMS "business-info" section, so
 * the address/phone/hours stay consistent with what the pages display.
 *
 * NOTE: street address and geo coordinates are not in the CMS yet — only the
 * area ("Kilimani, Nairobi, Kenya"). Add a precise street address in the admin
 * business details when available; it improves local pack ranking.
 */
const OPENING_HOURS = [
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "20:00" },
  { days: ["Saturday"], opens: "08:00", closes: "20:00" },
  { days: ["Sunday"], opens: "09:00", closes: "17:00" },
];

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "FoodEstablishment", "LocalBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: site.name,
    description: site.tagline,
    url: SITE_URL,
    telephone: site.phoneTel,
    email: site.email,
    image: ogImage("default"),
    logo: absoluteUrl("/favicon.png"),
    priceRange: "KSh",
    servesCuisine: ["Kenyan", "Home-style", "African"],
    currenciesAccepted: "KES",
    paymentAccepted: "M-Pesa, Cash",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: "Nairobi",
      addressRegion: "Nairobi County",
      addressCountry: "KE",
    },
    areaServed: [
      { "@type": "City", name: "Nairobi" },
      { "@type": "AdministrativeArea", name: "Nairobi Metropolitan Area" },
    ],
    openingHoursSpecification: OPENING_HOURS.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    hasMenu: absoluteUrl("/menu"),
    potentialAction: {
      "@type": "OrderAction",
      target: absoluteUrl("/order"),
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: site.name,
    url: SITE_URL,
    inLanguage: "en-KE",
    publisher: { "@id": `${SITE_URL}/#business` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.name,
    url: absoluteUrl(input.path),
    image: input.image,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: { "@type": "City", name: "Nairobi" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/quote"),
      servicePhone: site.phoneTel,
    },
  };
}

export type MenuSchemaItem = {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image?: string;
};

/** Menu / MenuSection / MenuItem built from the live CMS menu rows. */
export function menuSchema(items: MenuSchemaItem[], categories: readonly string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${site.name} menu`,
    url: absoluteUrl("/menu"),
    inLanguage: "en-KE",
    hasMenuSection: categories
      .map((category) => ({
        category,
        rows: items.filter((item) => item.category === category),
      }))
      .filter((section) => section.rows.length > 0)
      .map((section) => ({
        "@type": "MenuSection",
        name: section.category,
        hasMenuItem: section.rows.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.image ? { image: item.image } : {}),
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
          },
        })),
      })),
  };
}

export type ReviewInput = { name: string; quote: string; rating: number; role?: string | null };

/** AggregateRating + individual reviews, built from approved CMS testimonials. */
export function reviewSchema(reviews: ReviewInput[]) {
  if (reviews.length === 0) return null;
  const average = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#business`,
    name: site.name,
    url: SITE_URL,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: average.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewBody: r.quote,
      ...(r.role ? { about: r.role } : {}),
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating || 5),
        bestRating: "5",
        worstRating: "1",
      },
    })),
  };
}
