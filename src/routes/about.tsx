import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { PrimaryLink, OutlineLink } from "@/components/CtaButtons";
import { pageSectionsQuery, sectionContent } from "@/lib/cms";
import founder from "@/assets/founder.jpg";
import kitchen1 from "@/assets/kitchen-1.jpg";
import kitchen2 from "@/assets/kitchen-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Foi's Kitchen — Our Story & Kitchen" },
      {
        name: "description",
        content:
          "Meet the cook behind Foi's Kitchen. Home-style Nairobi cooking, strict hygiene, and food made the way you'd make it at home.",
      },
      { property: "og:title", content: "About Foi's Kitchen — Our Story & Kitchen" },
      {
        property: "og:description",
        content: "The story, the values and the kitchen behind Foi's Kitchen in Nairobi.",
      },
    ],
  }),
  component: AboutPage,
});

export type AboutHero = { eyebrow: string; title: string; intro: string };
export type FounderStory = {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  imageUrl: string;
  imageAlt: string;
};
export type BrandValues = {
  eyebrow: string;
  heading: string;
  items: { title: string; body: string }[];
};
export type Hygiene = { eyebrow: string; heading: string; images: string[] };
export type AboutNumbers = { items: { value: string; label: string }[] };

export const aboutDefaults = {
  hero: {
    eyebrow: "About us",
    title: "It started with Sunday lunch for the neighbours.",
    intro:
      "Foi's Kitchen grew out of a home kitchen in Nairobi where there was always one more plate. Today we cater events, prep weekly meals and deliver daily orders — with the same cooking.",
  } satisfies AboutHero,
  founderStory: {
    eyebrow: "The founder",
    heading: '"If I wouldn\'t serve it to my family, it doesn\'t leave the kitchen."',
    paragraphs: [
      "[PLACEHOLDER] Foi trained at home before she ever trained professionally. What began as catering for friends' weddings turned into a full kitchen serving offices, families and celebrations across Nairobi.",
      "[PLACEHOLDER] She still writes every menu herself and tastes every pot before it goes out the door.",
    ],
    imageUrl: founder,
    imageAlt: "[PLACEHOLDER] Foi in her kitchen",
  } satisfies FounderStory,
  brandValues: {
    eyebrow: "What we stand for",
    heading: "Three things we don't bend on",
    items: [
      { title: "Cooked, not assembled", body: "Every sauce, stew and chapati is made from scratch on the day." },
      { title: "Clean kitchen, always", body: "Daily deep cleans, gloved handling, sealed containers, cold chain kept." },
      { title: "Say yes to people", body: "Dietary needs, late changes, tight budgets — we'll find a way." },
    ],
  } satisfies BrandValues,
  hygiene: {
    eyebrow: "Inside the kitchen",
    heading: "Hygiene you can see",
    images: [kitchen1, kitchen2],
  } satisfies Hygiene,
  numbers: {
    items: [
      { value: "8", label: "Years cooking for Nairobi" },
      { value: "600+", label: "Events served" },
      { value: "120", label: "Weekly meal prep clients" },
      { value: "4.9", label: "Average review score" },
    ],
  } satisfies AboutNumbers,
};

function AboutPage() {
  const { data } = useQuery(pageSectionsQuery("about"));

  const hero = sectionContent<AboutHero>(data, "hero", aboutDefaults.hero);
  const story = sectionContent<FounderStory>(data, "founder-story", aboutDefaults.founderStory);
  const values = sectionContent<BrandValues>(data, "brand-values", aboutDefaults.brandValues);
  const hygiene = sectionContent<Hygiene>(data, "hygiene", aboutDefaults.hygiene);
  const numbers = sectionContent<AboutNumbers>(data, "numbers", aboutDefaults.numbers);

  return (
    <>
      <PageHero eyebrow={hero.eyebrow} title={hero.title} intro={hero.intro}>
        <PrimaryLink to="/menu">See the menu</PrimaryLink>
        <OutlineLink to="/quote">Request a quotation</OutlineLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid items-center gap-10 md:grid-cols-2">
          <SectionReveal>
            <img
              src={story.imageUrl}
              alt={story.imageAlt}
              loading="lazy"
              width={1008}
              height={1264}
              className="w-full rounded-2xl object-cover shadow-card"
            />
          </SectionReveal>

          <SectionReveal delay={80} className="flex flex-col gap-4">
            <p className="label-caps text-primary">{story.eyebrow}</p>
            <h2 className="font-display text-[1.75rem] font-semibold md:text-[2rem]">{story.heading}</h2>
            {story.paragraphs.map((p) => (
              <p key={p} className="text-muted-foreground">
                {p}
              </p>
            ))}
          </SectionReveal>
        </div>
      </section>

      <section className="section-y bg-card">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">{values.eyebrow}</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              {values.heading}
            </h2>
          </SectionReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.items.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 80} className="rounded-2xl bg-background p-6">
                <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">{hygiene.eyebrow}</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">
              {hygiene.heading}
            </h2>
          </SectionReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {hygiene.images.map((src, i) => (
              <SectionReveal key={src} delay={i * 80}>
                <img
                  src={src}
                  alt="Inside the Foi's Kitchen prep area"
                  loading="lazy"
                  width={1200}
                  height={1200}
                  className="aspect-square w-full rounded-2xl object-cover shadow-card"
                />
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {numbers.items.map((n) => (
            <div key={n.label}>
              <p className="font-display text-4xl font-bold text-primary">{n.value}</p>
              <p className="mt-1 text-sm opacity-85">{n.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
