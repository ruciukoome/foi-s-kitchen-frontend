import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { SectionReveal } from "@/components/SectionReveal";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";

const groups = [
  {
    key: "proteins",
    title: "Proteins",
    options: ["Slow-stewed goat (mbuzi)", "Herb-roasted chicken", "Beef stew", "Grilled tilapia", "Bean & lentil stew (veg)"],
  },
  {
    key: "starches",
    title: "Starches",
    options: ["Steamed arrow roots (ndūma)", "Roasted sweet potatoes", "Spiced pilau", "Soft chapati", "Steamed rice"],
  },
  {
    key: "sides",
    title: "Veggies & sides",
    options: ["French beans & broccoli", "Roasted cauliflower", "Garden salad", "Kachumbari", "Sautéed greens"],
  },
  {
    key: "dietary",
    title: "Dietary needs",
    options: ["Vegetarian guests", "Gluten-free", "Salt-conscious", "Diabetic-friendly", "Halal"],
  },
] as const;

type Picks = Record<string, string[]>;

export function CorporateSpreadBuilder() {
  const [picks, setPicks] = useState<Picks>({});
  const [guests, setGuests] = useState("");
  const [time, setTime] = useState("");

  const toggle = (group: string, option: string) =>
    setPicks((p) => {
      const current = p[group] ?? [];
      return {
        ...p,
        [group]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option],
      };
    });

  const lines = groups
    .filter((g) => (picks[g.key] ?? []).length > 0)
    .map((g) => `${g.title}: ${(picks[g.key] ?? []).join(", ")}`);
  if (time) lines.push(`Serving time: ${time}`);
  const spread = lines.join("\n");
  const hasPicks = groups.slice(0, 3).some((g) => (picks[g.key] ?? []).length > 0);

  return (
    <section className="section-y" aria-labelledby="spread-title">
      <div className="container-page max-w-5xl">
        <SectionReveal>
          <p className="label-caps text-primary">Build your spread</p>
          <h2 id="spread-title" className="mt-2 font-display text-3xl font-bold md:text-4xl">
            Pick what your team loves.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tick your favourites, tell us how many, and we'll send back a menu and price.
          </p>
        </SectionReveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {groups.map((g) => (
            <SectionReveal key={g.key} className="rounded-2xl bg-card p-5 shadow-card md:p-6">
              <fieldset>
                <legend className="font-display text-lg font-semibold">{g.title}</legend>
                <div className="mt-3 h-px bg-gold/40" aria-hidden="true" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.options.map((o) => {
                    const on = (picks[g.key] ?? []).includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(g.key, o)}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-[15px] transition-all duration-200 ease-out ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-foreground/15 bg-background hover:border-primary hover:text-primary"
                        }`}
                      >
                        {on && <Check className="h-4 w-4" aria-hidden="true" />}
                        {o}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal className="mt-6 grid gap-4 rounded-2xl bg-card p-5 shadow-card sm:grid-cols-2 md:p-6">
          <label className="block">
            <span className="label-caps text-xs">How many people?</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={guests}
              onChange={(e) => setGuests(e.target.value.slice(0, 5))}
              placeholder="e.g. 40"
              className="mt-2 min-h-[48px] w-full rounded-xl border border-input bg-background px-4 text-base outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="label-caps text-xs">Serving time</span>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value.slice(0, 60))}
              placeholder="e.g. 1pm, Thursdays"
              className="mt-2 min-h-[48px] w-full rounded-xl border border-input bg-background px-4 text-base outline-none focus:border-primary"
            />
          </label>
        </SectionReveal>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {hasPicks ? (
            <Link
              to="/quote"
              search={{ plan: "Custom corporate spread", spread, guests: guests || undefined }}
              className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep"
            >
              Request a quote for this spread
            </Link>
          ) : (
            <p className="text-muted-foreground">Pick at least one protein, starch or side to continue.</p>
          )}
          {hasPicks && (
            <WhatsAppLink
              message={`Hi ${site.name}! I'd like a corporate quote${guests ? ` for ${guests} people` : ""}:\n${spread}`}
            >
              Send on WhatsApp
            </WhatsAppLink>
          )}
        </div>
      </div>
    </section>
  );
}
