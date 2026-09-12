import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  pageSectionsQuery,
  sectionContent,
  serviceCategories,
  serviceTiersQuery,
  servicesQuery,
  type ServiceCategory,
  type ServiceRow,
  type ServiceTierRow,
} from "@/lib/cms";
import { arrayToLines, linesToArray, useCmsTable, usePageSection } from "@/lib/cms-admin";
import { serviceIntroDefaults, type ServiceIntro } from "@/routes/services";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/services")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Services Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Edit the three service tabs, their intro text and pricing cards." },
      { property: "og:title", content: "Services Editor — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal services editor." },
    ],
  }),
  component: AdminServicesPage,
});

const labels: Record<ServiceCategory, string> = {
  corporate: "Corporate catering",
  weddings: "Weddings & private events",
  "meal-prep": "Meal prep plans",
};

function AdminServicesPage() {
  const services = useQuery(servicesQuery);
  const tiers = useQuery(serviceTiersQuery);
  const sections = useQuery(pageSectionsQuery("services"));
  const tierTable = useCmsTable("service_tiers", serviceTiersQuery.queryKey);
  const serviceTable = useCmsTable("services", servicesQuery.queryKey);
  const saveSection = usePageSection();
  const [addingFor, setAddingFor] = useState<ServiceCategory | null>(null);

  return (
    <AdminShell title="Services" note="The three tabs on the Services page, their text and pricing cards.">
      <div className="flex flex-col gap-8">
        {serviceCategories.map((category) => {
          const service = services.data?.find((s) => s.category === category);
          const intro = sectionContent<ServiceIntro>(
            sections.data,
            category,
            serviceIntroDefaults[category],
          );
          const rows = (tiers.data ?? []).filter((t) => t.service_category === category);

          return (
            <section key={category} className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-semibold">{labels[category]}</h2>

              {service && <ServiceForm service={service} onSave={(p) => serviceTable.save(p)} />}

              <IntroForm
                intro={intro}
                onSave={(next) => saveSection("services", category, next)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <p className="label-caps text-xs">Pricing cards</p>
                <button
                  type="button"
                  className={outlineButtonClass}
                  onClick={() => setAddingFor(addingFor === category ? null : category)}
                >
                  {addingFor === category ? "Cancel" : "Add a card"}
                </button>
              </div>

              {addingFor === category && (
                <TierForm
                  draft={{ ...emptyTier, service_category: category }}
                  onSave={async (d) => {
                    const ok = await tierTable.save(tierPayload(d));
                    if (ok) setAddingFor(null);
                  }}
                />
              )}

              <ul className="flex flex-col gap-4">
                {rows.map((row) => (
                  <li key={row.id}>
                    <TierForm
                      draft={toTierDraft(row)}
                      onSave={(d) => tierTable.save(tierPayload(d))}
                      onDelete={() => tierTable.remove(row.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}

/* ------------------------------------------------------------- service card */

function ServiceForm({
  service,
  onSave,
}: {
  service: ServiceRow;
  onSave: (payload: Record<string, unknown>) => Promise<boolean | void>;
}) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [imageId, setImageId] = useState(service.image_id);
  const [imageUrl, setImageUrl] = useState(service.image?.url ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ id: service.id, name, description, image_id: imageId });
        setSaving(false);
      }}
    >
      <Field label="Card title (home page)">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <MediaPicker
        label="Card photo"
        defaultLabel="service"
        value={{ id: imageId, url: imageUrl }}
        onSelect={(a) => {
          setImageId(a.id);
          setImageUrl(a.url);
        }}
      />
      <Field label="Card description" className="md:col-span-2">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save service"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------- intro text */

function IntroForm({
  intro,
  onSave,
}: {
  intro: ServiceIntro;
  onSave: (next: ServiceIntro) => Promise<boolean | void>;
}) {
  const [eyebrow, setEyebrow] = useState(intro.eyebrow);
  const [bullets, setBullets] = useState(arrayToLines(intro.bullets));
  const [tags, setTags] = useState(arrayToLines(intro.tags));
  const [whatsapp, setWhatsapp] = useState(intro.whatsapp);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
          eyebrow,
          bullets: linesToArray(bullets),
          tags: linesToArray(tags),
          whatsapp,
        });
        setSaving(false);
      }}
    >
      <Field label="Headline on the tab" className="md:col-span-2">
        <TextInput value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
      </Field>
      <Field label="Bullet points (one per line)">
        <TextArea value={bullets} onChange={(e) => setBullets(e.target.value)} />
      </Field>
      <Field label="Tags (one per line)">
        <TextArea value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <Field label="WhatsApp message people send" className="md:col-span-2">
        <TextInput value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </Field>
      <div className="md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save tab text"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ pricing tiers */

type TierDraft = {
  id?: string;
  service_category: ServiceCategory;
  name: string;
  price: string;
  unit: string;
  note: string;
  features: string;
  image_id: string | null;
  imageUrl?: string;
  cta_type: "quote" | "cart";
  sort_order: string;
};

const emptyTier: TierDraft = {
  service_category: "corporate",
  name: "",
  price: "0",
  unit: "per head",
  note: "",
  features: "",
  image_id: null,
  cta_type: "quote",
  sort_order: "0",
};

const toTierDraft = (row: ServiceTierRow): TierDraft => ({
  id: row.id,
  service_category: row.service_category,
  name: row.name,
  price: String(row.price),
  unit: row.unit ?? "",
  note: row.note ?? "",
  features: arrayToLines(row.features),
  image_id: row.image_id,
  ...(row.image?.url ? { imageUrl: row.image.url } : {}),
  cta_type: row.cta_type,
  sort_order: String(row.sort_order),
});

function tierPayload(d: TierDraft) {
  return {
    ...(d.id ? { id: d.id } : {}),
    service_category: d.service_category,
    name: d.name,
    price: Number(d.price) || 0,
    unit: d.unit,
    note: d.note,
    features: linesToArray(d.features),
    image_id: d.image_id,
    cta_type: d.cta_type,
    sort_order: Number(d.sort_order) || 0,
  };
}

function TierForm({
  draft,
  onSave,
  onDelete,
}: {
  draft: TierDraft;
  onSave: (draft: TierDraft) => Promise<boolean | void>;
  onDelete?: () => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(draft);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof TierDraft>(key: K, v: TierDraft[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(value);
        setSaving(false);
      }}
    >
      <Field label="Card name">
        <TextInput value={value.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Price (KSh)">
        <TextInput type="number" min="0" value={value.price} onChange={(e) => set("price", e.target.value)} />
      </Field>
      <Field label="Price unit">
        <TextInput value={value.unit} onChange={(e) => set("unit", e.target.value)} placeholder="per head" />
      </Field>
      <Field label="Small note (optional)">
        <TextInput value={value.note} onChange={(e) => set("note", e.target.value)} placeholder="Up to 60 guests" />
      </Field>
      <Field label="What's included (one per line)" className="md:col-span-2">
        <TextArea rows={5} value={value.features} onChange={(e) => set("features", e.target.value)} />
      </Field>
      <Field label="Button">
        <SelectInput
          value={value.cta_type}
          onChange={(e) => set("cta_type", e.target.value as "quote" | "cart")}
        >
          <option value="quote">Request a quote</option>
          <option value="cart">Order plan (adds to basket)</option>
        </SelectInput>
      </Field>
      <Field label="Order on the page">
        <TextInput type="number" value={value.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
      </Field>

      <MediaPicker
        label="Photo"
        defaultLabel="service"
        value={{ id: value.image_id, ...(value.imageUrl ? { url: value.imageUrl } : {}) }}
        onSelect={(asset) => setValue((p) => ({ ...p, image_id: asset.id, imageUrl: asset.url }))}
        onClear={() => setValue((p) => ({ ...p, image_id: null, imageUrl: "" }))}
      />

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save card"}
        </button>
        {onDelete && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              if (window.confirm(`Delete "${value.name}"?`)) void onDelete();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
