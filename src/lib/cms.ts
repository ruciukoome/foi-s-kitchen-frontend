import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/integrations/supabase-external/client";

/* --------------------------------------------------------------- constants */

export const menuCategories = ["Breakfast", "Mains", "Sides", "Desserts"] as const;
export type MenuCategory = (typeof menuCategories)[number];

export const dietTags = ["Vegetarian", "Vegan", "High protein", "Gluten free"] as const;
export type DietTag = (typeof dietTags)[number];

export const serviceCategories = ["corporate", "weddings", "meal-prep"] as const;
export type ServiceCategory = (typeof serviceCategories)[number];

export const galleryCategories = ["Weddings", "Corporate", "Food", "Kitchen"] as const;
export type GalleryCategory = (typeof galleryCategories)[number];

export const galleryFilters = ["All", ...galleryCategories] as const;
export type GalleryFilter = (typeof galleryFilters)[number];

/* ------------------------------------------------------------------- types */

export type MediaAsset = {
  id: string;
  storage_path: string;
  url: string;
  alt_text: string | null;
  label: string | null;
  uploaded_at?: string;
};

type ImageJoin = { url: string; alt_text: string | null } | null;

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: MenuCategory;
  image_id: string | null;
  diet_tags: string[];
  is_available: boolean;
  sort_order: number;
  image?: ImageJoin;
};

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  image_id: string | null;
  category: ServiceCategory;
  sort_order: number;
  image?: ImageJoin;
};

export type ServiceTierRow = {
  id: string;
  service_category: ServiceCategory;
  name: string;
  price: number;
  unit: string | null;
  note: string | null;
  features: string[];
  image_id: string | null;
  cta_type: "quote" | "cart";
  sort_order: number;
  image?: ImageJoin;
};

export type MealPlanRow = {
  id: string;
  name: string;
  price: number;
  cadence: string | null;
  image_id: string | null;
  includes: string[];
  tags: string[];
  sort_order: number;
  image?: ImageJoin;
};

export type TestimonialRow = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  photo_id: string | null;
  sort_order: number;
  photo?: ImageJoin;
};

export type GalleryItemRow = {
  id: string;
  image_id: string | null;
  caption: string | null;
  category: GalleryCategory;
  sort_order: number;
  image?: ImageJoin;
};

export type PageSectionRow = {
  id: string;
  page_slug: string;
  section_key: string;
  content: Record<string, unknown>;
  sort_order: number;
};

export type BusinessInfo = {
  phoneDisplay: string;
  phoneTel: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: { day: string; time: string }[];
  mapEmbed: string;
};

/* --------------------------------------------------------------- utilities */

export async function requireClient(): Promise<SupabaseClient> {
  const client = await getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

async function select<T>(table: string, columns: string, order = "sort_order"): Promise<T[]> {
  const client = await requireClient();
  const { data, error } = await client.from(table).select(columns).order(order);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const imageOf = (row: { image?: ImageJoin }) => row.image?.url ?? "";
export const altOf = (row: { image?: ImageJoin }, fallback: string) =>
  row.image?.alt_text || fallback;

/* --------------------------------------------------------------- fetchers */

const MENU_COLUMNS = "*, image:media_assets!menu_items_image_id_fkey(url, alt_text)";
const SERVICE_COLUMNS = "*, image:media_assets!services_image_id_fkey(url, alt_text)";
const TIER_COLUMNS = "*, image:media_assets!service_tiers_image_id_fkey(url, alt_text)";
const PLAN_COLUMNS = "*, image:media_assets!meal_plans_image_id_fkey(url, alt_text)";
const TESTIMONIAL_COLUMNS = "*, photo:media_assets!testimonials_photo_id_fkey(url, alt_text)";
const GALLERY_COLUMNS = "*, image:media_assets!gallery_items_image_id_fkey(url, alt_text)";

export const menuItemsQuery = queryOptions({
  queryKey: ["cms", "menu_items"],
  queryFn: () => select<MenuItemRow>("menu_items", MENU_COLUMNS),
});

export const servicesQuery = queryOptions({
  queryKey: ["cms", "services"],
  queryFn: () => select<ServiceRow>("services", SERVICE_COLUMNS),
});

export const serviceTiersQuery = queryOptions({
  queryKey: ["cms", "service_tiers"],
  queryFn: () => select<ServiceTierRow>("service_tiers", TIER_COLUMNS),
});

export const mealPlansQuery = queryOptions({
  queryKey: ["cms", "meal_plans"],
  queryFn: () => select<MealPlanRow>("meal_plans", PLAN_COLUMNS),
});

export const testimonialsQuery = queryOptions({
  queryKey: ["cms", "testimonials"],
  queryFn: () => select<TestimonialRow>("testimonials", TESTIMONIAL_COLUMNS),
});

export const galleryItemsQuery = queryOptions({
  queryKey: ["cms", "gallery_items"],
  queryFn: () => select<GalleryItemRow>("gallery_items", GALLERY_COLUMNS),
});

export const mediaAssetsQuery = queryOptions({
  queryKey: ["cms", "media_assets"],
  queryFn: () => select<MediaAsset>("media_assets", "*", "uploaded_at"),
});

export function pageSectionsQuery(pageSlug: string) {
  return queryOptions({
    queryKey: ["cms", "page_sections", pageSlug],
    queryFn: async () => {
      const client = await requireClient();
      const { data, error } = await client
        .from("page_sections")
        .select("*")
        .eq("page_slug", pageSlug)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as PageSectionRow[];
    },
  });
}

export const allPageSectionsQuery = queryOptions({
  queryKey: ["cms", "page_sections", "all"],
  queryFn: () => select<PageSectionRow>("page_sections", "*"),
});

/** Pull one section's content out of a page_sections list. */
export function sectionContent<T>(
  sections: PageSectionRow[] | undefined,
  key: string,
  fallback: T,
): T {
  const found = sections?.find((s) => s.section_key === key);
  return (found?.content as T | undefined) ?? fallback;
}
