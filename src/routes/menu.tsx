import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { CategoryTabs } from "@/components/CategoryTabs";
import { MenuCard } from "@/components/MenuCard";
import { SkeletonGrid } from "@/components/CmsState";
import { dietTags, menuCategories, menuItemsQuery, type DietTag, type MenuCategory } from "@/lib/cms";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.enum(menuCategories).optional(),
});

export const Route = createFileRoute("/menu")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Menu — Foi's Kitchen Nairobi" },
      { name: "description", content: "Breakfast, mains, sides and desserts from Foi's Kitchen. Browse prices, add to your order and check out on WhatsApp." },
      { property: "og:title", content: "Menu — Foi's Kitchen Nairobi" },
      { property: "og:description", content: "Browse the full Foi's Kitchen menu and add dishes to your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu" });
  // Category is driven entirely by the ?category= search param, never local state.
  const active: MenuCategory = category ?? menuCategories[0];
  const setActive = (next: MenuCategory) =>
    navigate({ search: (previous) => ({ ...previous, category: next }) });
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<DietTag | null>(null);
  const { count } = useCart();
  const { data, isLoading } = useQuery(menuItemsQuery);

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
          {items.map((item, index) => <MenuCard key={item.id} item={item} index={index} />)}
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
    </section>
  );
}
