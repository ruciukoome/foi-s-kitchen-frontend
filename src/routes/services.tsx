import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { currency, site, waLink } from "@/lib/site";
import { useCart } from "@/lib/cart";
import corporateImage from "@/assets/corporate.jpg";
import wedding1 from "@/assets/wedding-1.jpg";
import wedding2 from "@/assets/wedding-2.jpg";
import hero2 from "@/assets/hero-2.jpg";
import plan5 from "@/assets/plan-5-meals.jpg";
import plan10 from "@/assets/plan-10-meals.jpg";
import plan14 from "@/assets/plan-14-meals.jpg";

const categoryIds = ["corporate", "weddings", "meal-prep"] as const;
type ServiceCategory = (typeof categoryIds)[number];

type Tier = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  includes: string[];
  note?: string;
  cartItem?: boolean;
};

type ServiceSection = {
  label: string;
  eyebrow: string;
  image: string;
  bullets: string[];
  tiers: Tier[];
  tags: string[];
  whatsapp: string;
};

const services: Record<ServiceCategory, ServiceSection> = {
  corporate: {
    label: "Corporate Catering",
    eyebrow: "Office food that arrives on time and tastes like home.",
    image: corporateImage,
    bullets: [
      "Clear per-head pricing",
      "Minimum order: 20 people",
      "Orders confirmed at least 24 hours ahead",
    ],
    tags: ["Kenyan classic", "Light & lean", "Plant forward"],
    whatsapp: `Hi ${site.name}! I'd like corporate catering for my team.`,
    tiers: [
      {
        id: "desk-lunch",
        name: "Desk Lunch",
        price: 650,
        unit: "per head",
        image: corporateImage,
        includes: ["One main + one side", "Fresh juice or water", "Boxed and labelled", "Delivered by 12:30pm"],
      },
      {
        id: "meeting-spread",
        name: "Meeting Spread",
        price: 1200,
        unit: "per head",
        image: corporateImage,
        includes: ["Two mains + two sides", "Salad and dessert", "Chafing dishes and serving staff", "Setup 30 min before"],
      },
      {
        id: "company-event",
        name: "Company Event",
        price: 1900,
        unit: "per head",
        image: corporateImage,
        includes: ["Full buffet, four mains", "Live nyama choma station", "Drinks station and desserts", "Full service team"],
      },
    ],
  },
  weddings: {
    label: "Weddings & Private Events",
    eyebrow: "The food people remember, long after the speeches.",
    image: wedding1,
    bullets: [
      "Generous, home-style menus",
      "Weddings need at least 6 weeks’ notice",
      "Private parties need 2 weeks’ notice",
    ],
    tags: ["Weddings", "Ruracios", "Birthdays", "Private parties"],
    whatsapp: `Hi ${site.name}! I'm planning a wedding and would like to talk about catering.`,
    tiers: [
      {
        id: "intimate",
        name: "Intimate",
        price: 1800,
        unit: "per guest",
        image: wedding1,
        note: "Up to 60 guests",
        includes: ["Three-course plated or buffet", "Service team of four", "Crockery and chafing dishes", "Cake cutting service"],
      },
      {
        id: "celebration",
        name: "Celebration",
        price: 2400,
        unit: "per guest",
        image: hero2,
        note: "60 – 200 guests",
        includes: ["Five-dish buffet + dessert table", "Canapés on arrival", "Full service and clearing team", "Drinks station"],
      },
      {
        id: "grand",
        name: "Grand",
        price: 3200,
        unit: "per guest",
        image: wedding2,
        note: "200+ guests",
        includes: ["Full buffet with live stations", "Dedicated event lead", "Bridal table service", "Late-night bites"],
      },
    ],
  },
  "meal-prep": {
    label: "Meal Prep Plans",
    eyebrow: "Your week, cooked and portioned.",
    image: plan10,
    bullets: [
      "Cooked fresh and delivered weekly",
      "Sealed, labelled containers",
      "Adjusted for allergies and portion size",
    ],
    tags: ["Weekly", "Balanced", "Most popular", "Best value"],
    whatsapp: `Hi ${site.name}! I'd like help choosing a meal prep plan.`,
    tiers: [
      {
        id: "5-meals",
        name: "5 Meals",
        price: 4500,
        unit: "per week",
        image: plan5,
        cartItem: true,
        includes: ["5 portioned meals, delivered fresh weekly", "Protein, carb and veg in every box", "Delivered to your door step", "Swap dishes each week"],
      },
      {
        id: "10-meals",
        name: "10 Meals",
        price: 6800,
        unit: "per week",
        image: plan10,
        cartItem: true,
        includes: ["10 portioned meals, delivered fresh weekly", "Lunch and dinner covered", "Delivered to your door step", "Adjust for allergies and portion size"],
      },
      {
        id: "14-meals",
        name: "14 Meals",
        price: 9500,
        unit: "per week",
        image: plan14,
        cartItem: true,
        includes: ["14 portioned meals, delivered fresh weekly", "Two meals a day, all week", "Delivered to your door step", "Best value per meal"],
      },
    ],
  },
};

function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === "string" && categoryIds.some((category) => category === value);
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
  const active = services[category];

  return (
    <section className="container-page pb-12 md:pb-20">
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 px-0.5 pt-[26px] pb-[14px]">
        <h1 className="font-serif-eyebrow">Services</h1>
        <span className="font-serif-eyebrow-sub text-primary" aria-hidden="true">〜</span>
        <p className="font-serif-eyebrow-sub">Pick a category to see the menus and pricing.</p>
      </div>

      <div className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div role="tablist" aria-label="Service categories" className="grid grid-cols-3 border-b border-border">
          {categoryIds.map((id) => {
            const service = services[id];
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
                <img src={service.image} alt="" aria-hidden="true" loading="lazy" decoding="async" width={1024} height={640} className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
                <span className={cn("absolute inset-0 -z-10 bg-foreground transition-opacity duration-300 ease-out", selected ? "opacity-70" : "opacity-55")} />
                <span className="flex h-full flex-col justify-between gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full border border-primary-foreground", selected && "bg-primary")} aria-hidden="true" />
                  <span className="font-display text-[13px] leading-tight font-semibold sm:text-base">{service.label}</span>
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
          <p className="label-caps text-primary">{active.label}</p>
          <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{active.eyebrow}</h2>
          <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-7">
            {active.bullets.map((bullet) => (
              <li key={bullet} className="font-serif-eyebrow-sub flex items-start gap-2 text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {active.tiers.map((tier, index) => (
              <ServiceTier key={tier.id} tier={tier} delay={index * 60} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <ul className="flex flex-wrap gap-2">
            {active.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">{tag}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={waLink(active.whatsapp)} target="_blank" rel="noopener noreferrer" className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-whatsapp px-5 text-whatsapp-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]">Ask a question</a>
            <Link to="/order" className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Order online</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceTier({ tier, delay }: { tier: Tier; delay: number }) {
  const { add } = useCart();

  return (
    <article className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-background" style={{ animationDelay: `${delay}ms` }}>
      <div className="aspect-[16/10] overflow-hidden bg-secondary/60">
        <img src={tier.image} alt={tier.name} loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" width={1024} height={640} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
        <p className="mt-1 text-sm"><span className="font-display font-semibold text-primary">{currency(tier.price)}</span> <span className="text-muted-foreground">{tier.unit}</span></p>
        {tier.note && <p className="mt-1 text-xs text-muted-foreground">{tier.note}</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {tier.includes.map((line) => (
            <li key={line} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" /><span>{line}</span></li>
          ))}
        </ul>
        {tier.cartItem ? (
          <button type="button" onClick={() => { add({ id: `plan-${tier.id}`, name: `${tier.name} plan`, price: tier.price }); toast.success(`${tier.name} added to your order`); }} className="label-caps mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Order plan</button>
        ) : (
          <Link to="/quote" className="label-caps mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]">Request a quote</Link>
        )}
      </div>
    </article>
  );
}