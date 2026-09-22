import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { allTestimonialsQuery, type TestimonialRow, type TestimonialStatus } from "@/lib/cms";
import { useCmsTable } from "@/lib/cms-admin";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/testimonials")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Reviews Editor — Foi's Kitchen Admin" },
      { name: "description", content: "Approve customer reviews and add your own." },
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
  status: TestimonialStatus;
  photo_id: string | null;
  photoUrl?: string;
  sort_order: string;
};

const empty: Draft = {
  name: "",
  role: "",
  quote: "",
  rating: "5",
  status: "approved",
  photo_id: null,
  sort_order: "0",
};

const toDraft = (row: TestimonialRow): Draft => ({
  id: row.id,
  name: row.name,
  role: row.role ?? "",
  quote: row.quote,
  rating: String(row.rating),
  status: row.status ?? "approved",
  photo_id: row.photo_id,
  ...(row.photo?.url ? { photoUrl: row.photo.url } : {}),
  sort_order: String(row.sort_order),
});

type Tab = "pending" | "approved" | "hidden";

function AdminTestimonialsPage() {
  const { data, isLoading } = useQuery(allTestimonialsQuery);
  const { save, remove } = useCmsTable("testimonials", ["cms", "testimonials"]);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");

  const byStatus = useMemo(() => {
    const rows = data ?? [];
    return {
      pending: rows.filter((r) => (r.status ?? "approved") === "pending"),
      approved: rows.filter((r) => (r.status ?? "approved") === "approved"),
      hidden: rows.filter((r) => r.status === "hidden"),
    };
  }, [data]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: `Waiting for you (${byStatus.pending.length})` },
    { key: "approved", label: `Live on the site (${byStatus.approved.length})` },
    { key: "hidden", label: `Hidden (${byStatus.hidden.length})` },
  ];

  const rows = byStatus[tab];

  return (
    <AdminShell
      title="Reviews"
      note="Customers can send reviews from the Gallery page. Approve one to show it on the site."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(tab === t.key ? primaryButtonClass : outlineButtonClass, "px-5 text-xs")}
          >
            {t.label}
          </button>
        ))}
      </div>

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
      {!isLoading && rows.length === 0 && (
        <p className="text-muted-foreground">
          {tab === "pending" ? "No reviews waiting for approval." : "Nothing here yet."}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id}>
            <ReviewForm
              draft={toDraft(row)}
              onSave={(d) => save(payload(d))}
              onDelete={() => remove(row.id)}
              onSetStatus={(status) => save({ id: row.id, status })}
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
    role: d.role,
    quote: d.quote,
    rating: Number(d.rating) || 5,
    status: d.status,
    photo_id: d.photo_id,
    sort_order: Number(d.sort_order) || 0,
  };
}

function ReviewForm({
  draft,
  onSave,
  onDelete,
  onSetStatus,
}: {
  draft: Draft;
  onSave: (draft: Draft) => Promise<boolean | void>;
  onDelete?: () => Promise<boolean | void>;
  onSetStatus?: (status: TestimonialStatus) => Promise<boolean | void>;
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
      {onSetStatus && value.status === "pending" && (
        <p className="label-caps text-xs text-primary md:col-span-2">Sent by a customer — waiting for approval</p>
      )}

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
        {onSetStatus && value.status !== "approved" && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              set("status", "approved");
              void onSetStatus("approved");
            }}
          >
            Approve
          </button>
        )}
        {onSetStatus && value.status === "approved" && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              set("status", "hidden");
              void onSetStatus("hidden");
            }}
          >
            Hide
          </button>
        )}
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
