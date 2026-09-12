import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { testimonialsQuery, type TestimonialRow } from "@/lib/cms";
import { useCmsTable } from "@/lib/cms-admin";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/testimonials")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reviews Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Add and edit customer reviews." },
      { property: "og:title", content: "Reviews Editor — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal reviews editor." },
    ],
  }),
  component: AdminTestimonialsPage,
});

type Draft = {
  id?: string;
  name: string;
  role: string;
  quote: string;
  rating: string;
  photo_id: string | null;
  photoUrl?: string;
  sort_order: string;
};

const empty: Draft = { name: "", role: "", quote: "", rating: "5", photo_id: null, sort_order: "0" };

const toDraft = (row: TestimonialRow): Draft => ({
  id: row.id,
  name: row.name,
  role: row.role ?? "",
  quote: row.quote,
  rating: String(row.rating),
  photo_id: row.photo_id,
  ...(row.photo?.url ? { photoUrl: row.photo.url } : {}),
  sort_order: String(row.sort_order),
});

function AdminTestimonialsPage() {
  const { data, isLoading } = useQuery(testimonialsQuery);
  const { save, remove } = useCmsTable("testimonials", testimonialsQuery.queryKey);
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Reviews" note="Shown on the home page and the gallery page.">
      <div className="mb-5">
        <button type="button" className={primaryButtonClass} onClick={() => setAdding((a) => !a)}>
          {adding ? "Cancel" : "Add a review"}
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <ReviewForm
            draft={empty}
            onSave={async (d) => {
              const ok = await save(payload(d));
              if (ok) setAdding(false);
            }}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading reviews…</p>}

      <ul className="flex flex-col gap-4">
        {data?.map((row) => (
          <li key={row.id}>
            <ReviewForm draft={toDraft(row)} onSave={(d) => save(payload(d))} onDelete={() => remove(row.id)} />
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
    role: d.role,
    quote: d.quote,
    rating: Number(d.rating) || 5,
    photo_id: d.photo_id,
    sort_order: Number(d.sort_order) || 0,
  };
}

function ReviewForm({
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
      <Field label="Name">
        <TextInput value={value.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Where they're from">
        <TextInput value={value.role} onChange={(e) => set("role", e.target.value)} placeholder="Wedding, Karen" />
      </Field>
      <Field label="What they said" className="md:col-span-2">
        <TextArea value={value.quote} onChange={(e) => set("quote", e.target.value)} required />
      </Field>
      <Field label="Stars">
        <SelectInput value={value.rating} onChange={(e) => set("rating", e.target.value)}>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Order on the page">
        <TextInput type="number" value={value.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
      </Field>

      <MediaPicker
        label="Photo (optional)"
        defaultLabel="review"
        value={{ id: value.photo_id, ...(value.photoUrl ? { url: value.photoUrl } : {}) }}
        onSelect={(asset) => setValue((p) => ({ ...p, photo_id: asset.id, photoUrl: asset.url }))}
        onClear={() => setValue((p) => ({ ...p, photo_id: null, photoUrl: "" }))}
      />

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save review"}
        </button>
        {onDelete && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              if (window.confirm(`Delete the review from ${value.name}?`)) void onDelete();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
