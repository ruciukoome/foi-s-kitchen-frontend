import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";

import { SectionReveal } from "@/components/SectionReveal";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";
import { pageSectionsQuery, sectionContent } from "@/lib/cms";
import { defaultSpread, type SpreadConfig } from "@/lib/spread";

type Picks = Record<string, string[]>;

const pill =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-[15px] transition-all duration-200 ease-out";
const pillOn = "border-primary bg-primary text-primary-foreground";
const pillOff = "border-foreground/15 bg-background hover:border-primary hover:text-primary";

export function CorporateSpreadBuilder() {
  const sections = useQuery({ ...pageSectionsQuery("corporate"), retry: false });
  const config = sectionContent<SpreadConfig>(sections.data, "spread-builder", defaultSpread);
  const groups = (config.groups?.length ? config.groups : defaultSpread.groups).filter(
    (g) => g.title?.trim(),
  );

  const [picks, setPicks] = useState<Picks>({});
  const [others, setOthers] = useState<Picks>({});
  const [drafts, setDrafts] = useState<Record<string, string | undefined>>({});
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

  const addOther = (group: string) => {
    const text = (drafts[group] ?? "").trim().slice(0, 80);
    if (text && !(others[group] ?? []).includes(text)) {
      setOthers((o) => ({ ...o, [group]: [...(o[group] ?? []), text] }));
    }
    setDrafts((d) => ({ ...d, [group]: undefined }));
  };
  const removeOther = (group: string, text: string) =>
    setOthers((o) => ({ ...o, [group]: (o[group] ?? []).filter((t) => t !== text) }));

  const chosen = (key: string) => [...(picks[key] ?? []), ...(others[key] ?? [])];
  const lines = groups
    .filter((g) => chosen(g.key).length > 0)
    .map((g) => {
      const std = picks[g.key] ?? [];
      const own = others[g.key] ?? [];
      const parts = [...std, ...own.map((t) => `Other: ${t}`)];
      return `${g.title}: ${parts.join(", ")}`;
    });
  if (time) lines.push(`Serving time: ${time}`);
  const spread = lines.join("\n");
  const hasPicks = groups.some((g) => !/diet/i.test(g.key + g.title) && chosen(g.key).length > 0);

  return (
    <section className="section-y" aria-labelledby="spread-title">
      <div className="container-page max-w-5xl">
        <SectionReveal>
          <p className="label-caps text-primary">Build your spread</p>
          <h2 id="spread-title" className="mt-2 font-display text-3xl font-bold md:text-4xl">
            Pick what your team loves.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tick your favourites, add anything else you'd like, and we'll send back a menu and price.
          </p>
        </SectionReveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {groups.map((g) => {
            const own = others[g.key] ?? [];
            const draft = drafts[g.key];
            return (
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
                          className={`${pill} ${on ? pillOn : pillOff}`}
                        >
                          {on && <Check className="h-4 w-4" aria-hidden="true" />}
                          {o}
                        </button>
                      );
                    })}
                    {own.map((t) => (
                      <span key={t} className={`${pill} ${pillOn} pr-1`}>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {t}
                        <button
                          type="button"
                          onClick={() => removeOther(g.key, t)}
                          aria-label={`Remove ${t}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary-deep"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                    {draft === undefined && (
                      <button
                        type="button"
                        onClick={() => setDrafts((d) => ({ ...d, [g.key]: "" }))}
                        className={`${pill} border-dashed ${pillOff}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {own.length ? "Add another" : "Other"}
                      </button>
                    )}
                  </div>
                  {draft !== undefined && (
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={draft}
                        maxLength={80}
                        aria-label={`Other ${g.title.toLowerCase()}`}
                        placeholder="Tell us what you'd like"
                        onChange={(e) => setDrafts((d) => ({ ...d, [g.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOther(g.key);
                          }
                          if (e.key === "Escape") setDrafts((d) => ({ ...d, [g.key]: undefined }));
                        }}
                        className="min-h-[44px] flex-1 rounded-xl border border-input bg-background px-4 text-base outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => addOther(g.key)}
                        className="label-caps min-h-[44px] rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary-deep"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </fieldset>
              </SectionReveal>
            );
          })}
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
            <p className="text-muted-foreground">Pick at least one dish to continue.</p>
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
