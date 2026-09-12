import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { galleryCategories, galleryItemsQuery, type GalleryItemRow } from "@/lib/cms";
import { useCmsTable } from "@/lib/cms-admin";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/gallery")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gallery Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Manage the photo gallery and its categories." },
      { property: "og:title", content: "Gallery Editor — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal gallery editor." },
    ],
  }),
  component: AdminGalleryPage,
});

type Draft = {
  id?: string;
  image_id: string | null;
  imageUrl?: string;
  caption: string;
  category: string;
  sort_order: string;
};

const empty: Draft = { image_id: null, caption: "", category: galleryCategories[0], sort_order: "0" };

const toDraft = (row: GalleryItemRow): Draft => ({
  id: row.id,
  image_id: row.image_id,
  ...(row.image?.url ? { imageUrl: row.image.url } : {}),
  caption: row.caption ?? "",
  category: row.category,
  sort_order: String(row.sort_order),
});

function AdminGalleryPage() {
  const { data, isLoading } = useQuery(galleryItemsQuery);
  const { save, remove } = useCmsTable("gallery_items", galleryItemsQuery.queryKey);
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Gallery" note="Photos shown on the Gallery & Reviews page.">
      <div className="mb-5">
        <button type="button" className={primaryButtonClass} onClick={() => setAdding((a) => !a)}>
          {adding ? "Cancel" : "Add a photo"}
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <GalleryForm
            draft={empty}
            onSave={async (d) => {
              const ok = await save(payload(d));
              if (ok) setAdding(false);
            }}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading gallery…</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {data?.map((row) => (
          <li key={row.id}>
            <GalleryForm draft={toDraft(row)} onSave={(d) => save(payload(d))} onDelete={() => remove(row.id)} />
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

function payload(d: Draft) {
  return {
    ...(d.id ? { id: d.id } : {}),
    image_id: d.image_id,
    caption: d.caption,
    category: d.category,
    sort_order: Number(d.sort_order) || 0,
  };
}

function GalleryForm({
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
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(value);
        setSaving(false);
      }}
    >
      <MediaPicker
        label="Photo"
        defaultLabel="gallery"
        value={{ id: value.image_id, ...(value.imageUrl ? { url: value.imageUrl } : {}) }}
        onSelect={(asset) => setValue((p) => ({ ...p, image_id: asset.id, imageUrl: asset.url }))}
        onClear={() => setValue((p) => ({ ...p, image_id: null, imageUrl: "" }))}
      />
      <Field label="Caption">
        <TextInput value={value.caption} onChange={(e) => set("caption", e.target.value)} />
      </Field>
      <Field label="Category">
        <SelectInput value={value.category} onChange={(e) => set("category", e.target.value)}>
          {galleryCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Order on the page">
        <TextInput type="number" value={value.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save photo"}
        </button>
        {onDelete && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              if (window.confirm("Remove this photo from the gallery?")) void onDelete();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
