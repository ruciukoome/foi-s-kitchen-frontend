import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { currency, site, waLink } from "@/lib/site";
import { useCart } from "@/lib/cart";
import { Skeleton } from "@/components/CmsState";
import {
  imageOf,
  pageSectionsQuery,
  sectionContent,
  serviceCategories,
  serviceTiersQuery,
  servicesQuery,
  type ServiceCategory,
  type ServiceTierRow,
} from "@/lib/cms";

export type ServiceIntro = {
  eyebrow: string;
  bullets: string[];
  tags: string[];
  whatsapp: string;
};

export const serviceIntroDefaults: Record<ServiceCategory, ServiceIntro> = {
  corporate: {
    eyebrow: "Office food that arrives on time and tastes like home.",
    bullets: [
      "Clear per-head pricing",
      "Minimum order: 20 people",
      "Orders confirmed at least 24 hours ahead",
    ],
    tags: ["Kenyan classic", "Light & lean", "Plant forward"],
    whatsapp: `Hi ${site.name}! I'd like corporate catering for my team.`,
  },
  weddings: {
    eyebrow: "The food people remember, long after the speeches.",
    bullets: [
      "Generous, home-style menus",
      "Weddings need at least 6 weeks’ notice",
      "Private parties need 2 weeks’ notice",
    ],
    tags: ["Weddings", "Ruracios", "Birthdays", "Private parties"],
    whatsapp: `Hi ${site.name}! I'm planning a wedding and would like to talk about catering.`,
  },
  "meal-prep": {
    eyebrow: "Your week, cooked and portioned.",
    bullets: [
      "Cooked fresh and delivered weekly",
      "Sealed, labelled containers",
      "Adjusted for allergies and portion size",
    ],
    tags: ["Weekly", "Balanced", "Most popular", "Best value"],
    whatsapp: `Hi ${site.name}! I'd like help choosing a meal prep plan.`,
  },
};

const defaultLabels: Record<ServiceCategory, string> = {
  corporate: "Corporate Catering",
  weddings: "Weddings & Private Events",
  "meal-prep": "Meal Prep Plans",
};

function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === "string" && serviceCategories.some((category) => category === value);
}

export const Route = createFileRoute("/services")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: isServiceCategory(search["category"]) ? search["category"] : "corporate",
  }),
  head: () => ({
    meta: [
      { title: "Catering & Meal Prep Services — Foi's Kitchen" },
      { name: "description", content: "Compare corporate catering, wedding catering and weekly meal prep plans from Foi's Kitchen in Nairobi." },
      { property: "og:title", content: "Catering & Meal Prep Services — Foi's Kitchen" },
      { property: "og:description", content: "Menus and pricing for corporate catering, weddings and weekly meal prep in Nairobi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/services" });

  const services = useQuery(servicesQuery);
  const tiers = useQuery(serviceTiersQuery);
  const sections = useQuery(pageSectionsQuery("services"));

  const intro = sectionContent<ServiceIntro>(
    sections.data,
    category,
    serviceIntroDefaults[category],
  );
  const activeService = services.data?.find((s) => s.category === category);
  const activeTiers = (tiers.data ?? []).filter((t) => t.service_category === category);
  const label = activeService?.name ?? defaultLabels[category];

  return (
    <section className="container-page pb-12 md:pb-20">
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 px-0.5 pt-[26px] pb-[14px]">
        <h1 className="font-serif-eyebrow">Services</h1>
        <span className="font-serif-eyebrow-sub text-primary" aria-hidden="true">〜</span>
        <p className="font-serif-eyebrow-sub">Pick a category to see the menus and pricing.</p>
      </div>

      <div className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div role="tablist" aria-label="Service categories" className="grid grid-cols-3 border-b border-border">
          {serviceCategories.map((id) => {
            const service = services.data?.find((s) => s.category === id);
            const selected = id === category;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`service-tab-${id}`}
                aria-selected={selected}
                aria-controls="service-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => navigate({ search: (previous) => ({ ...previous, category: id }) })}
                className={cn(
                  "group relative isolate min-h-[112px] overflow-hidden border-r border-border p-3 text-left transition-all duration-300 ease-out last:border-r-0 sm:min-h-[148px] sm:p-5",
                  selected ? "text-primary-foreground" : "text-primary-foreground/80",
                )}
              >
                {service && (
                  <img src={imageOf(service)} alt="" aria-hidden="true" loading="lazy" decoding="async" width={1024} height={640} className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
                )}
                <span className={cn("absolute inset-0 -z-10 bg-foreground transition-opacity duration-300 ease-out", selected ? "opacity-70" : "opacity-55")} />
                <span className="flex h-full flex-col justify-between gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full border border-primary-foreground", selected && "bg-primary")} aria-hidden="true" />
                  <span className="font-display text-[13px] leading-tight font-semibold sm:text-base">
                    {service?.name ?? defaultLabels[id]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={category}
          id="service-panel"
          role="tabpanel"
          aria-labelledby={`service-tab-${category}`}
          tabIndex={0}
          className="animate-swap-in p-4 outline-none sm:p-6 lg:p-8"
        >
          <p className="label-caps text-primary">{label}</p>
          <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{intro.eyebrow}</h2>
          <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-7">
            {intro.bullets.map((bullet) => (
              <li key={bullet} className="font-serif-eyebrow-sub flex items-start gap-2 text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tiers.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)
              : activeTiers.map((tier, index) => (
                  <ServiceTier key={tier.id} tier={tier} delay={index * 60} />
                ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <ul className="flex flex-wrap gap-2">
            {intro.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">{tag}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={waLink(intro.whatsapp)} target="_blank" rel="noopener noreferrer" className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-whatsapp px-5 text-whatsapp-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]">Ask a question</a>
            <Link to="/order" className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Order online</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceTier({ tier, delay }: { tier: ServiceTierRow; delay: number }) {
  const { add } = useCart();
  const price = Number(tier.price);

  return (
    <article className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-background" style={{ animationDelay: `${delay}ms` }}>
      <div className="aspect-[16/10] overflow-hidden bg-secondary/60">
        <img src={imageOf(tier)} alt={tier.name} loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" width={1024} height={640} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
        <p className="mt-1 text-sm"><span className="font-display font-semibold text-primary">{currency(price)}</span> <span className="text-muted-foreground">{tier.unit}</span></p>
        {tier.note && <p className="mt-1 text-xs text-muted-foreground">{tier.note}</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {tier.features.map((line) => (
            <li key={line} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" /><span>{line}</span></li>
          ))}
        </ul>
        {tier.cta_type === "cart" ? (
          <button type="button" onClick={() => { add({ id: `plan-${tier.id}`, name: `${tier.name} plan`, price }); toast.success(`${tier.name} added to your order`); }} className="label-caps mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Order plan</button>
        ) : (
          <Link to="/quote" className="label-caps mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Request a quote</Link>
        )}
      </div>
    </article>
  );
}
