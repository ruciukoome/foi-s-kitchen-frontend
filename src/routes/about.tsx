import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { PrimaryLink, OutlineLink } from "@/components/CtaButtons";
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

// [PLACEHOLDER] Replace with real numbers.
const numbers = [
  { value: "8", label: "Years cooking for Nairobi" },
  { value: "600+", label: "Events served" },
  { value: "120", label: "Weekly meal prep clients" },
  { value: "4.9", label: "Average review score" },
];

const values = [
  { title: "Cooked, not assembled", body: "Every sauce, stew and chapati is made from scratch on the day." },
  { title: "Clean kitchen, always", body: "Daily deep cleans, gloved handling, sealed containers, cold chain kept." },
  { title: "Say yes to people", body: "Dietary needs, late changes, tight budgets — we'll find a way." },
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="It started with Sunday lunch for the neighbours."
        intro="Foi's Kitchen grew out of a home kitchen in Nairobi where there was always one more plate. Today we cater events, prep weekly meals and deliver daily orders — with the same cooking."
      >
        <PrimaryLink to="/menu">See the menu</PrimaryLink>
        <OutlineLink to="/quote">Request a quotation</OutlineLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid items-center gap-10 md:grid-cols-2">
          <SectionReveal>
            <img
              src={founder}
              alt="[PLACEHOLDER] Foi in her kitchen"
              loading="lazy"
              width={1008}
              height={1264}
              className="w-full rounded-2xl object-cover shadow-card"
            />
          </SectionReveal>

          <SectionReveal delay={80} className="flex flex-col gap-4">
            <p className="label-caps text-primary">The founder</p>
            <h2 className="font-display text-[1.75rem] font-semibold md:text-[2rem]">
              "If I wouldn't serve it to my family, it doesn't leave the kitchen."
            </h2>
            <p className="text-muted-foreground">
              [PLACEHOLDER] Foi trained at home before she ever trained professionally.
              What began as catering for friends' weddings turned into a full kitchen
              serving offices, families and celebrations across Nairobi.
            </p>
            <p className="text-muted-foreground">
              [PLACEHOLDER] She still writes every menu herself and tastes every pot
              before it goes out the door.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-y bg-card">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">What we stand for</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">Three things we don't bend on</h2>
          </SectionReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
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
            <p className="label-caps text-primary">Inside the kitchen</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">Hygiene you can see</h2>
          </SectionReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[kitchen1, kitchen2].map((src, i) => (
              <SectionReveal key={src} delay={i * 80}>
                <img
                  src={src}
                  alt="[PLACEHOLDER] Inside the Foi's Kitchen prep area"
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
          {numbers.map((n) => (
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
