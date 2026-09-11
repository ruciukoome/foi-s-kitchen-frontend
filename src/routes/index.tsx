import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, Leaf, MessageCircle, ClipboardCheck, CookingPot, Bike } from "lucide-react";
import { SectionReveal } from "@/components/SectionReveal";
import { TestimonialCard } from "@/components/TestimonialCard";
import { MealOfTheDay } from "@/components/MealOfTheDay";
import { HeroCarousel } from "@/components/HeroCarousel";
import { PrimaryLink, OutlineLink } from "@/components/CtaButtons";
import { ServiceCard } from "@/components/ServiceCard";
import { testimonials } from "@/data/testimonials";
import { services } from "@/data/services";
import { categories, menuItems } from "@/data/menu";
import { site } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foi's Kitchen — Home-Style Catering & Meal Prep in Nairobi" },
      {
        name: "description",
        content:
          "Fresh home-style food for events, offices and your week. Order online or on WhatsApp — catering, meal prep plans and daily menus in Nairobi.",
      },
      { property: "og:title", content: "Foi's Kitchen — Home-Style Catering & Meal Prep in Nairobi" },
      {
        property: "og:description",
        content: "Catering, meal prep plans and online food orders in Nairobi. Order in minutes.",
      },
    ],
  }),
  component: HomePage,
});


const features = [
  { icon: Leaf, title: "Fresh daily", body: "Cooked the morning it's delivered. Never reheated stock." },
  { icon: ChefHat, title: "Custom catering", body: "From 20-person office lunches to 300-guest weddings." },
  { icon: MessageCircle, title: "WhatsApp support", body: "A real person replies. Usually within a few minutes." },
];

const steps = [
  { icon: ClipboardCheck, title: "Order", body: "Pick your dishes or tell us about the event." },
  { icon: MessageCircle, title: "Confirm", body: "We agree the menu, timing and price on WhatsApp." },
  { icon: CookingPot, title: "Prepare", body: "Everything is cooked fresh in our Nairobi kitchen." },
  { icon: Bike, title: "Deliver", body: "Hot, on time, wherever you are in the city." },
];

const featuredCategories = categories.map((c) => ({
  name: c,
  image: menuItems.find((m) => m.category === c)!.image,
}));

function HomePage() {

  return (
    <>
      <HeroCarousel />


      {/* Features */}
      <section className="section-y bg-card">
        <div className="container-page grid gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <SectionReveal key={f.title} delay={i * 80} className="flex flex-col gap-3">
              <f.icon className="h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold">{f.title}</h2>
              <p className="text-muted-foreground">{f.body}</p>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="section-y">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">Services</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              What we offer
            </h2>
          </SectionReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {services.map((service, i) => (
              <SectionReveal key={service.id} delay={i * 80}>
                <ServiceCard service={service} />
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured categories */}
      <section className="section-y">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">The menu</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              Start with what you're craving
            </h2>
          </SectionReveal>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredCategories.map((c, i) => (
              <SectionReveal key={c.name} delay={i * 60}>
                <Link
                  to="/menu"
                  search={{ category: c.name }}
                  className="group block overflow-hidden rounded-2xl bg-card shadow-card"
                >
                  <span className="block aspect-square overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="label-caps block px-4 py-4 text-center">{c.name}</span>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <MealOfTheDay />

      {/* Gold divider between the featured meal and the process strip */}
      <div className="container-page">
        <div className="h-px w-full bg-gold" aria-hidden="true" />
      </div>

      {/* How it works */}
      <section className="section-y bg-card">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">How it works</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              Four steps, no back and forth
            </h2>
          </SectionReveal>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <SectionReveal as="li" key={s.title} delay={i * 80} className="flex flex-col gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
                  <s.icon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </SectionReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-y">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">Kind words</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              People keep coming back
            </h2>
          </SectionReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <SectionReveal key={t.id} delay={i * 60}>
                <TestimonialCard testimonial={t} />
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-foreground text-background">
        <div className="container-page py-16 text-center md:py-20">
          <SectionReveal>
            <h2 className="mx-auto max-w-2xl font-display text-[1.75rem] font-semibold md:text-[2rem]">
              Feeding two people or two hundred? {site.name} can handle it.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink to="/order">Order online</PrimaryLink>
              <Link
                to="/quote"
                className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full border border-background/40 px-6 transition-all duration-200 ease-out hover:scale-[1.02] hover:border-background active:scale-[0.97]"
              >
                Request a quotation
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Keeps the outline link component referenced for shared styling */}
      <div className="sr-only">
        <OutlineLink to="/about">About Foi's Kitchen</OutlineLink>
      </div>
    </>
  );
}
