import { useCallback, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { CategoryTabs } from "@/components/CategoryTabs";
import { MenuCard } from "@/components/MenuCard";
import { DishDetailSheet } from "@/components/DishDetailSheet";
import { SkeletonGrid } from "@/components/CmsState";
import { dietTags, menuCategories, menuItemsQuery, type DietTag, type MenuCategory, type MenuItemRow } from "@/lib/cms";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { breadcrumbSchema, jsonLd, menuSchema, pageSeo } from "@/lib/seo";

const searchSchema = z.object({
  category: z.enum(menuCategories).optional(),
  dish: z.string().max(64).optional(),
});

export const Route = createFileRoute("/menu")({
  validateSearch: searchSchema,
  // Menu rows come from the Supabase CMS, not a hardcoded list — loading them
  // here means the Menu/MenuItem markup is server-rendered for crawlers.
  loader: async ({ context }) => {
    try {
      const rows = await context.queryClient.ensureQueryData(menuItemsQuery);
      return {
        dishes: rows
          .filter((row) => row.is_available)
          .map((row) => ({ id: row.id, name: row.name, description: row.description, image: row.image?.url ?? "" })),
        items: rows
          .filter((row) => row.is_available)
          .map((row) => ({
            name: row.name,
            description: row.description,
            price: Number(row.price),
            category: row.category as string,
            ...(row.image?.url ? { image: row.image.url } : {}),
          })),
      };
    } catch {
      return { items: [], dishes: [] };
    }
  },
  head: ({ loaderData, match }) => {
    const dishId = (match.search as { dish?: string }).dish;
    const dish = dishId ? loaderData?.dishes?.find((d) => d.id === dishId) : undefined;
    if (dish) {
      const title = `${dish.name} | Foi's Kitchen Menu`;
      const description = (dish.description || `${dish.name}, cooked fresh in Nairobi by Foi's Kitchen.`).slice(0, 160);
      const dseo = pageSeo({ title, description, path: `/menu?dish=${encodeURIComponent(dish.id)}`, image: "menu" });
      const img = /^https:\/\//.test(dish.image) ? dish.image : null;
      return {
        ...dseo,
        meta: dseo.meta.map((m) =>
          img && "property" in m && (m["property"] === "og:image") ? { ...m, content: img }
          : img && "name" in m && m["name"] === "twitter:image" ? { ...m, content: img }
          : m,
        ).filter((m) => !(img && "property" in m && (m["property"] === "og:image:width" || m["property"] === "og:image:height"))),
      };
    }
    const seo = pageSeo({
      title: "Menu & Prices | Foi's Kitchen Nairobi",
      description:
        "Breakfast, mains, sides and desserts cooked fresh in Nairobi. Browse prices, add dishes to your order and check out on WhatsApp.",
      path: "/menu",
      image: "menu",
    });
    const items = loaderData?.items ?? [];
    return {
      ...seo,
      scripts: [
        ...(items.length > 0 ? [jsonLd(menuSchema(items, menuCategories))] : []),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
          ]),
        ),
      ],
    };
  },
  component: MenuPage,
});

function MenuPage() {
  const { category, dish } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu" });
  // Category is driven entirely by the ?category= search param, never local state.
  const active: MenuCategory = category ?? menuCategories[0];
  const setActive = (next: MenuCategory) =>
    navigate({ search: (previous) => ({ ...previous, category: next }) });
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<DietTag | null>(null);
  const { count } = useCart();
  const { data, isLoading } = useQuery(menuItemsQuery);
  // The open dish lives in ?dish=<id> so Back closes it and the URL is shareable.
  const openDish = useMemo(() => (dish ? (data ?? []).find((row) => row.id === dish) ?? null : null), [data, dish]);
  const pushedRef = useRef(false);
  const setOpenDish = useCallback(
    (row: MenuItemRow) => {
      pushedRef.current = true;
      navigate({ search: (previous) => ({ ...previous, dish: row.id }) });
    },
    [navigate],
  );
  const closeDish = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      navigate({ search: (previous) => ({ ...previous, dish: undefined }), replace: true });
    }
  }, [navigate]);

  const items = useMemo(
    () =>
      (data ?? []).filter(
        (item) =>
          item.is_available &&
          item.category === active &&
          (!diet || item.diet_tags.includes(diet)) &&
          (query.trim() === "" ||
            `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [data, active, query, diet],
  );

  return (
    <section className="container-page pb-12 md:pb-20">
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 px-0.5 pt-[26px] pb-[14px]">
        <h1 className="font-serif-eyebrow">Menu</h1>
        <span className="font-serif-eyebrow-sub text-primary" aria-hidden="true">〜</span>
        <p className="font-serif-eyebrow-sub">You're a click away from your delicious meal!</p>
      </div>

      <div className="animate-fade-up rounded-2xl border border-border bg-card p-3 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="xl:shrink-0">
            <CategoryTabs options={menuCategories} value={active} onChange={setActive} label="Menu categories" />
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1 xl:justify-end">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes" aria-label="Search dishes" className="min-h-[48px] w-full rounded-full border border-input bg-background pr-4 pl-11 text-base outline-none transition-colors duration-200 ease-out focus:border-primary" />
            </div>
            <ul className="flex min-w-0 gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-end">
              {dietTags.map((item) => (
                <li key={item} className="shrink-0">
                  <button type="button" onClick={() => setDiet(diet === item ? null : item)} aria-pressed={diet === item} className={cn("min-h-[44px] rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ease-out", diet === item ? "border-sage bg-sage text-sage-foreground" : "border-input text-muted-foreground hover:border-sage hover:text-sage")}>{item}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {isLoading && <SkeletonGrid count={8} className="mt-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />}

      {!isLoading && items.length > 0 && (
        <div key={`${active}-${diet}-${query}`} className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => <MenuCard key={item.id} item={item} index={index} onOpen={setOpenDish} />)}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className={cn("text-sm", items.length === 0 ? "text-foreground" : "text-muted-foreground")}>
          {isLoading
            ? "Loading the menu…"
            : items.length === 0
              ? "Nothing matches that yet — try another category or clear the filters."
              : `${items.length} ${items.length === 1 ? "dish" : "dishes"} showing`}
        </p>
        <Link to="/order" className="label-caps inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">
          <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Go to your order ({count})
        </Link>
      </div>
      <DishDetailSheet item={openDish} onClose={closeDish} />
    </section>
  );
}
