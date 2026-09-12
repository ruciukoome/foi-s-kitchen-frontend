import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { mealPlansQuery, type MealPlanRow } from "@/lib/cms";
import { arrayToLines, linesToArray, useCmsTable } from "@/lib/cms-admin";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/plans")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Meal Plans Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Edit the weekly meal prep plans." },
      { property: "og:title", content: "Meal Plans Editor — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal meal plan editor." },
    ],
  }),
  component: AdminPlansPage,
});

type Draft = {
  id?: string;
  name: string;
  price: string;
  cadence: string;
  image_id: string | null;
  imageUrl?: string;
  includes: string;
  tags: string;
  sort_order: string;
};

const empty: Draft = {
  name: "",
  price: "0",
  cadence: "per week",
  image_id: null,
  includes: "",
  tags: "",
  sort_order: "0",
};

const toDraft = (row: MealPlanRow): Draft => ({
  id: row.id,
  name: row.name,
  price: String(row.price),
  cadence: row.cadence ?? "",
  image_id: row.image_id,
  ...(row.image?.url ? { imageUrl: row.image.url } : {}),
  includes: arrayToLines(row.includes),
  tags: arrayToLines(row.tags),
  sort_order: String(row.sort_order),
});

function AdminPlansPage() {
  const { data, isLoading } = useQuery(mealPlansQuery);
  const { save, remove } = useCmsTable("meal_plans", mealPlansQuery.queryKey);
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Meal plans" note="The weekly plans shown on the meal prep tab.">
      <div className="mb-5">
        <button type="button" className={primaryButtonClass} onClick={() => setAdding((a) => !a)}>
          {adding ? "Cancel" : "Add a plan"}
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <PlanForm
            draft={empty}
            onSave={async (d) => {
              const ok = await save(payload(d));
              if (ok) setAdding(false);
            }}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading plans…</p>}

      <ul className="flex flex-col gap-4">
        {data?.map((row) => (
          <li key={row.id}>
            <PlanForm draft={toDraft(row)} onSave={(d) => save(payload(d))} onDelete={() => remove(row.id)} />
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

function payload(d: Draft) {
  return {
    ...(d.id ? { id: d.id } : {}),
    name: d.name,
    price: Number(d.price) || 0,
    cadence: d.cadence,
    image_id: d.image_id,
    includes: linesToArray(d.includes),
    tags: linesToArray(d.tags),
    sort_order: Number(d.sort_order) || 0,
  };
}

function PlanForm({
  draft,
  onSave,
  onDelete,
}: {
  draft: Draft;
  onSave: (draft: Draft) => Promise<boolean | void>;
  onDelete?: () => Promise<boolean | void>;
}) {
  const [value, setValue] = useState(draft);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(key: K, v: Draft[K]) =>
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
      <Field label="Plan name">
        <TextInput value={value.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Price (KSh)">
        <TextInput type="number" min="0" value={value.price} onChange={(e) => set("price", e.target.value)} />
      </Field>
      <Field label="How often">
        <TextInput value={value.cadence} onChange={(e) => set("cadence", e.target.value)} />
      </Field>
      <Field label="Order on the page">
        <TextInput type="number" value={value.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
      </Field>
      <Field label="What's included (one per line)" className="md:col-span-2">
        <TextArea rows={5} value={value.includes} onChange={(e) => set("includes", e.target.value)} />
      </Field>
      <Field label="Tags (one per line)" className="md:col-span-2">
        <TextArea value={value.tags} onChange={(e) => set("tags", e.target.value)} />
      </Field>

      <MediaPicker
        label="Photo"
        defaultLabel="plan"
        value={{ id: value.image_id, ...(value.imageUrl ? { url: value.imageUrl } : {}) }}
        onSelect={(asset) => setValue((p) => ({ ...p, image_id: asset.id, imageUrl: asset.url }))}
        onClear={() => setValue((p) => ({ ...p, image_id: null, imageUrl: "" }))}
      />

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save plan"}
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
