import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { dietTags, menuCategories, menuItemsQuery, type MenuItemRow } from "@/lib/cms";
import { useCmsTable } from "@/lib/cms-admin";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/menu")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Menu Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Add dishes, prices, photos and dietary tags." },
      { property: "og:title", content: "Menu Editor — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal menu editor." },
    ],
  }),
  component: AdminMenuPage,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image_id: string | null;
  imageUrl?: string;
  diet_tags: string[];
  is_available: boolean;
  sort_order: string;
};

const empty: Draft = {
  name: "",
  description: "",
  price: "0",
  category: menuCategories[0],
  image_id: null,
  diet_tags: [],
  is_available: true,
  sort_order: "0",
};

const toDraft = (row: MenuItemRow): Draft => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  price: String(row.price),
  category: row.category,
  image_id: row.image_id,
  ...(row.image?.url ? { imageUrl: row.image.url } : {}),
  diet_tags: row.diet_tags,
  is_available: row.is_available,
  sort_order: String(row.sort_order),
});

function AdminMenuPage() {
  const { data, isLoading } = useQuery(menuItemsQuery);
  const { save, remove } = useCmsTable("menu_items", menuItemsQuery.queryKey);
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Menu" note="Every dish on the Menu page.">
      <div className="mb-5">
        <button type="button" className={primaryButtonClass} onClick={() => setAdding((a) => !a)}>
          {adding ? "Cancel" : "Add a dish"}
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <MenuForm
            draft={empty}
            onSave={async (d) => {
              const ok = await save(payload(d));
              if (ok) setAdding(false);
            }}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading dishes…</p>}

      <ul className="flex flex-col gap-4">
        {data?.map((row) => (
          <li key={row.id}>
            <MenuForm
              draft={toDraft(row)}
              onSave={(d) => save(payload(d))}
              onDelete={() => remove(row.id)}
            />
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
    description: d.description,
    price: Number(d.price) || 0,
    category: d.category,
    image_id: d.image_id,
    diet_tags: d.diet_tags,
    is_available: d.is_available,
    sort_order: Number(d.sort_order) || 0,
  };
}

function MenuForm({
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
      <Field label="Dish name">
        <TextInput value={value.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Price (KSh)">
        <TextInput
          type="number"
          min="0"
          value={value.price}
          onChange={(e) => set("price", e.target.value)}
        />
      </Field>
      <Field label="Description" className="md:col-span-2">
        <TextArea value={value.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Category">
        <SelectInput value={value.category} onChange={(e) => set("category", e.target.value)}>
          {menuCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Order on the page">
        <TextInput
          type="number"
          value={value.sort_order}
          onChange={(e) => set("sort_order", e.target.value)}
        />
      </Field>

      <div className="md:col-span-2">
        <span className="label-caps text-xs">Dietary tags</span>
        <ul className="mt-2 flex flex-wrap gap-2">
          {dietTags.map((tag) => {
            const on = value.diet_tags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set(
                      "diet_tags",
                      on ? value.diet_tags.filter((t) => t !== tag) : [...value.diet_tags, tag],
                    )
                  }
                  className={cn(
                    "min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors duration-200 ease-out",
                    on ? "border-sage bg-sage text-sage-foreground" : "border-input text-muted-foreground hover:border-sage",
                  )}
                >
                  {tag}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <MediaPicker
        label="Photo"
        defaultLabel="menu"
        value={{ id: value.image_id, ...(value.imageUrl ? { url: value.imageUrl } : {}) }}
        onSelect={(asset) => setValue((p) => ({ ...p, image_id: asset.id, imageUrl: asset.url }))}
        onClear={() => setValue((p) => ({ ...p, image_id: null, imageUrl: "" }))}
      />

      <label className="flex items-center gap-2 self-end">
        <input
          type="checkbox"
          checked={value.is_available}
          onChange={(e) => set("is_available", e.target.checked)}
          className="h-5 w-5 accent-[var(--primary)]"
        />
        <span className="text-sm">Show on the menu</span>
      </label>

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Saving…" : "Save dish"}
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
