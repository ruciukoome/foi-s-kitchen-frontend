import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { defaultHeroSlides, type HeroSlide } from "@/components/HeroCarousel";
import { pageSectionsQuery, sectionContent, type BusinessInfo } from "@/lib/cms";
import { arrayToLines, linesToArray, usePageSection } from "@/lib/cms-admin";
import { iconNames } from "@/lib/icons";
import { site } from "@/lib/site";
import { primaryButtonClass, outlineButtonClass } from "@/lib/ui";
import {
  aboutDefaults,
  type AboutHero,
  type AboutNumbers,
  type BrandValues,
  type FounderStory,
  type Hygiene,
} from "@/routes/about";

export const Route = createFileRoute("/admin/content")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Page Text — Foi's Kitchen Admin" },
      { name: "description", content: "Edit the words and photos on the Home and About pages, plus contact details." },
      { property: "og:title", content: "Page Text — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal page content editor." },
    ],
  }),
  component: AdminContentPage,
});

type IconItem = { icon: string; title: string; body: string };

const homeDefaults = {
  features: [
    { icon: "Leaf", title: "Fresh daily", body: "Cooked the morning it's delivered. Never reheated stock." },
    { icon: "ChefHat", title: "Custom catering", body: "From 20-person office lunches to 300-guest weddings." },
    { icon: "MessageCircle", title: "WhatsApp support", body: "A real person replies. Usually within a few minutes." },
  ] as IconItem[],
  steps: [
    { icon: "ClipboardCheck", title: "Order", body: "Pick your dishes or tell us about the event." },
    { icon: "MessageCircle", title: "Confirm", body: "We agree the menu, timing and price on WhatsApp." },
    { icon: "CookingPot", title: "Prepare", body: "Everything is cooked fresh in our Nairobi kitchen." },
    { icon: "Bike", title: "Deliver", body: "Hot, on time, wherever you are in the city." },
  ] as IconItem[],
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function AdminContentPage() {
  const home = useQuery(pageSectionsQuery("home"));
  const about = useQuery(pageSectionsQuery("about"));
  const global = useQuery(pageSectionsQuery("global"));
  const saveSection = usePageSection();

  const slides = sectionContent<{ slides?: HeroSlide[] }>(home.data, "hero", {}).slides ?? defaultHeroSlides;
  const features = sectionContent<{ items?: IconItem[] }>(home.data, "feature-icons", {}).items ?? homeDefaults.features;
  const steps = sectionContent<{ items?: IconItem[] }>(home.data, "how-it-works", {}).items ?? homeDefaults.steps;

  const aboutHero = sectionContent<AboutHero>(about.data, "hero", aboutDefaults.hero);
  const story = sectionContent<FounderStory>(about.data, "founder-story", aboutDefaults.founderStory);
  const values = sectionContent<BrandValues>(about.data, "brand-values", aboutDefaults.brandValues);
  const hygiene = sectionContent<Hygiene>(about.data, "hygiene", aboutDefaults.hygiene);
  const numbers = sectionContent<AboutNumbers>(about.data, "numbers", aboutDefaults.numbers);

  const business = {
    phoneDisplay: site.phoneDisplay,
    phoneTel: site.phoneTel,
    whatsapp: site.whatsapp,
    email: site.email,
    address: site.address,
    hours: site.hours,
    mapEmbed: site.mapEmbed,
    ...sectionContent<Partial<BusinessInfo>>(global.data, "business-info", {}),
  } as BusinessInfo;

  return (
    <AdminShell title="Page text" note="The words and photos on Home, About, and your contact details.">
      <div className="flex flex-col gap-6">
        <Panel title="Home — hero slides">
          <HeroSlidesForm slides={slides} onSave={(next) => saveSection("home", "hero", { slides: next })} />
        </Panel>

        <Panel title="Home — the three highlights">
          <IconItemsForm items={features} onSave={(items) => saveSection("home", "feature-icons", { items })} />
        </Panel>

        <Panel title="Home — how it works">
          <IconItemsForm items={steps} onSave={(items) => saveSection("home", "how-it-works", { items })} />
        </Panel>

        <Panel title="About — top of the page">
          <AboutHeroForm hero={aboutHero} onSave={(next) => saveSection("about", "hero", next)} />
        </Panel>

        <Panel title="About — the founder story">
          <FounderForm story={story} onSave={(next) => saveSection("about", "founder-story", next)} />
        </Panel>

        <Panel title="About — what we stand for">
          <ValuesForm values={values} onSave={(next) => saveSection("about", "brand-values", next)} />
        </Panel>

        <Panel title="About — inside the kitchen">
          <HygieneForm hygiene={hygiene} onSave={(next) => saveSection("about", "hygiene", next)} />
        </Panel>

        <Panel title="About — the numbers strip">
          <NumbersForm numbers={numbers} onSave={(next) => saveSection("about", "numbers", next)} />
        </Panel>

        <Panel title="Contact details (used all over the site)">
          <BusinessForm info={business} onSave={(next) => saveSection("global", "business-info", next)} />
        </Panel>
      </div>
    </AdminShell>
  );
}

function SaveButton({ saving, label = "Save" }: { saving: boolean; label?: string }) {
  return (
    <button type="submit" className={primaryButtonClass} disabled={saving}>
      {saving ? "Saving…" : label}
    </button>
  );
}

function useSaver<T>(onSave: (value: T) => Promise<boolean | void>) {
  const [saving, setSaving] = useState(false);
  return {
    saving,
    submit: async (e: React.FormEvent, value: T) => {
      e.preventDefault();
      setSaving(true);
      await onSave(value);
      setSaving(false);
    },
  };
}

/* --------------------------------------------------------------- home hero */

function HeroSlidesForm({
  slides,
  onSave,
}: {
  slides: HeroSlide[];
  onSave: (slides: HeroSlide[]) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState<HeroSlide[]>(slides);
  const { saving, submit } = useSaver(onSave);

  const update = (i: number, patch: Partial<HeroSlide>) =>
    setValue((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => void submit(e, value)}>
      {value.map((slide, i) => (
        <div key={slide.id} className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
          <Field label="Small label above the title">
            <TextInput value={slide.eyebrow} onChange={(e) => update(i, { eyebrow: e.target.value })} />
          </Field>
          <Field label="Button text">
            <TextInput value={slide.cta} onChange={(e) => update(i, { cta: e.target.value })} />
          </Field>
          <Field label="Big title" className="md:col-span-2">
            <TextInput value={slide.title} onChange={(e) => update(i, { title: e.target.value })} />
          </Field>
          <Field label="Sentence underneath" className="md:col-span-2">
            <TextArea value={slide.copy} onChange={(e) => update(i, { copy: e.target.value })} />
          </Field>
          <Field label="Small card title">
            <TextInput value={slide.cardLabel} onChange={(e) => update(i, { cardLabel: e.target.value })} />
          </Field>
          <Field label="Small card note">
            <TextInput value={slide.cardNote} onChange={(e) => update(i, { cardNote: e.target.value })} />
          </Field>
          <MediaPicker
            label="Background photo"
            defaultLabel="hero"
            value={{ id: null, url: slide.image }}
            onSelect={(asset) => update(i, { image: asset.url })}
          />
        </div>
      ))}
      <div>
        <SaveButton saving={saving} label="Save hero slides" />
      </div>
    </form>
  );
}

/* ------------------------------------------------------- icon item sections */

function IconItemsForm({
  items,
  onSave,
}: {
  items: IconItem[];
  onSave: (items: IconItem[]) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(items);
  const { saving, submit } = useSaver(onSave);

  const update = (i: number, patch: Partial<IconItem>) =>
    setValue((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => void submit(e, value)}>
      {value.map((item, i) => (
        <div key={i} className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-3">
          <Field label="Icon">
            <SelectInput value={item.icon} onChange={(e) => update(i, { icon: e.target.value })}>
              {iconNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Title">
            <TextInput value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
          </Field>
          <Field label="Text">
            <TextInput value={item.body} onChange={(e) => update(i, { body: e.target.value })} />
          </Field>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <SaveButton saving={saving} />
        <button
          type="button"
          className={outlineButtonClass}
          onClick={() => setValue((prev) => [...prev, { icon: iconNames[0]!, title: "", body: "" }])}
        >
          Add another
        </button>
        {value.length > 1 && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => setValue((prev) => prev.slice(0, -1))}
          >
            Remove last
          </button>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- about page */

function AboutHeroForm({
  hero,
  onSave,
}: {
  hero: AboutHero;
  onSave: (hero: AboutHero) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(hero);
  const { saving, submit } = useSaver(onSave);
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void submit(e, value)}>
      <Field label="Small label">
        <TextInput value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
      </Field>
      <Field label="Title">
        <TextInput value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} />
      </Field>
      <Field label="Intro paragraph" className="md:col-span-2">
        <TextArea value={value.intro} onChange={(e) => setValue({ ...value, intro: e.target.value })} />
      </Field>
      <div className="md:col-span-2">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function FounderForm({
  story,
  onSave,
}: {
  story: FounderStory;
  onSave: (story: FounderStory) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(story);
  const [paragraphs, setParagraphs] = useState(story.paragraphs.join("\n\n"));
  const { saving, submit } = useSaver(onSave);

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) =>
        void submit(e, {
          ...value,
          paragraphs: paragraphs.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
        })
      }
    >
      <Field label="Small label">
        <TextInput value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
      </Field>
      <Field label="Photo description">
        <TextInput value={value.imageAlt} onChange={(e) => setValue({ ...value, imageAlt: e.target.value })} />
      </Field>
      <Field label="Heading / quote" className="md:col-span-2">
        <TextInput value={value.heading} onChange={(e) => setValue({ ...value, heading: e.target.value })} />
      </Field>
      <Field label="Story (leave a blank line between paragraphs)" className="md:col-span-2">
        <TextArea rows={6} value={paragraphs} onChange={(e) => setParagraphs(e.target.value)} />
      </Field>
      <MediaPicker
        label="Photo"
        defaultLabel="founder"
        value={{ id: null, url: value.imageUrl }}
        onSelect={(asset) => setValue({ ...value, imageUrl: asset.url })}
      />
      <div className="md:col-span-2">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function ValuesForm({
  values,
  onSave,
}: {
  values: BrandValues;
  onSave: (values: BrandValues) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(values);
  const { saving, submit } = useSaver(onSave);
  const update = (i: number, patch: Partial<{ title: string; body: string }>) =>
    setValue((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => void submit(e, value)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Small label">
          <TextInput value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
        </Field>
        <Field label="Heading">
          <TextInput value={value.heading} onChange={(e) => setValue({ ...value, heading: e.target.value })} />
        </Field>
      </div>
      {value.items.map((item, i) => (
        <div key={i} className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
          <Field label="Title">
            <TextInput value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
          </Field>
          <Field label="Text">
            <TextInput value={item.body} onChange={(e) => update(i, { body: e.target.value })} />
          </Field>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <SaveButton saving={saving} />
        <button
          type="button"
          className={outlineButtonClass}
          onClick={() => setValue((p) => ({ ...p, items: [...p.items, { title: "", body: "" }] }))}
        >
          Add another
        </button>
      </div>
    </form>
  );
}

function HygieneForm({
  hygiene,
  onSave,
}: {
  hygiene: Hygiene;
  onSave: (hygiene: Hygiene) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(hygiene);
  const { saving, submit } = useSaver(onSave);
  const setImage = (i: number, url: string) =>
    setValue((prev) => ({ ...prev, images: prev.images.map((u, idx) => (idx === i ? url : u)) }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void submit(e, value)}>
      <Field label="Small label">
        <TextInput value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
      </Field>
      <Field label="Heading">
        <TextInput value={value.heading} onChange={(e) => setValue({ ...value, heading: e.target.value })} />
      </Field>
      {value.images.map((url, i) => (
        <MediaPicker
          key={i}
          label={`Photo ${i + 1}`}
          defaultLabel="kitchen"
          value={{ id: null, url }}
          onSelect={(asset) => setImage(i, asset.url)}
        />
      ))}
      <div className="md:col-span-2">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

function NumbersForm({
  numbers,
  onSave,
}: {
  numbers: AboutNumbers;
  onSave: (numbers: AboutNumbers) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(numbers);
  const { saving, submit } = useSaver(onSave);
  const update = (i: number, patch: Partial<{ value: string; label: string }>) =>
    setValue((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => void submit(e, value)}>
      {value.items.map((item, i) => (
        <div key={i} className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
          <Field label="Number">
            <TextInput value={item.value} onChange={(e) => update(i, { value: e.target.value })} />
          </Field>
          <Field label="What it means">
            <TextInput value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
          </Field>
        </div>
      ))}
      <div>
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

/* ---------------------------------------------------------- business info */

function BusinessForm({
  info,
  onSave,
}: {
  info: BusinessInfo;
  onSave: (info: BusinessInfo) => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(info);
  const [hours, setHours] = useState(arrayToLines(info.hours.map((h) => `${h.day} | ${h.time}`)));
  const { saving, submit } = useSaver(onSave);

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) =>
        void submit(e, {
          ...value,
          hours: linesToArray(hours).map((line) => {
            const [day = "", time = ""] = line.split("|").map((s) => s.trim());
            return { day, time };
          }),
        })
      }
    >
      <Field label="Phone (as shown)">
        <TextInput value={value.phoneDisplay} onChange={(e) => setValue({ ...value, phoneDisplay: e.target.value })} />
      </Field>
      <Field label="Phone (for the call button, e.g. +254…)">
        <TextInput value={value.phoneTel} onChange={(e) => setValue({ ...value, phoneTel: e.target.value })} />
      </Field>
      <Field label="WhatsApp number (digits only, e.g. 254758996440)">
        <TextInput value={value.whatsapp} onChange={(e) => setValue({ ...value, whatsapp: e.target.value })} />
      </Field>
      <Field label="Email">
        <TextInput value={value.email} onChange={(e) => setValue({ ...value, email: e.target.value })} />
      </Field>
      <Field label="Address" className="md:col-span-2">
        <TextInput value={value.address} onChange={(e) => setValue({ ...value, address: e.target.value })} />
      </Field>
      <Field label="Opening hours — one per line, as: Mon – Fri | 7:00am – 8:00pm" className="md:col-span-2">
        <TextArea rows={4} value={hours} onChange={(e) => setHours(e.target.value)} />
      </Field>
      <Field label="Google map embed link" className="md:col-span-2">
        <TextInput value={value.mapEmbed} onChange={(e) => setValue({ ...value, mapEmbed: e.target.value })} />
      </Field>
      <div className="md:col-span-2">
        <SaveButton saving={saving} label="Save contact details" />
      </div>
    </form>
  );
}
