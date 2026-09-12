import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, TextInput } from "@/components/admin/Fields";
import { MEDIA_BUCKET, uploadMedia } from "@/components/admin/MediaPicker";
import { useAuth } from "@/lib/auth";
import { mediaAssetsQuery, type MediaAsset } from "@/lib/cms";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/media")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Photo Library — Foi's Kitchen Admin" },
      { name: "description", content: "Upload and manage the photos used across the site." },
      { property: "og:title", content: "Photo Library — Foi's Kitchen Admin" },
      { property: "og:description", content: "Internal photo library." },
    ],
  }),
  component: AdminMediaPage,
});

function AdminMediaPage() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(mediaAssetsQuery);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = [...(data ?? [])]
    .reverse()
    .filter((m) =>
      `${m.label ?? ""} ${m.alt_text ?? ""} ${m.storage_path}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !client) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) await uploadMedia(client, file, "", "");
      await queryClient.invalidateQueries({ queryKey: ["cms", "media_assets"] });
      toast.success("Photos uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Photo library" note="Upload photos once, use them anywhere on the site.">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <TextInput
          placeholder="Filter by label or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter photos"
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={busy}
          className={primaryButtonClass}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {busy ? "Uploading…" : "Upload photos"}
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading photos…</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-muted-foreground">No photos yet — upload some above.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((asset) => (
          <MediaRow key={asset.id} asset={asset} />
        ))}
      </ul>
    </AdminShell>
  );
}

function MediaRow({ asset }: { asset: MediaAsset }) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(asset.label ?? "");
  const [alt, setAlt] = useState(asset.alt_text ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!client) return;
    setSaving(true);
    const { error } = await client
      .from("media_assets")
      .update({ label: label || null, alt_text: alt || null })
      .eq("id", asset.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ["cms", "media_assets"] });
      toast.success("Photo details saved.");
    }
  }

  async function remove() {
    if (!client) return;
    if (!window.confirm("Delete this photo? Anywhere it is used will lose its picture.")) return;
    const { error } = await client.from("media_assets").delete().eq("id", asset.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await client.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
    await queryClient.invalidateQueries({ queryKey: ["cms", "media_assets"] });
    toast.success("Photo deleted.");
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="block aspect-[4/3] overflow-hidden rounded-xl bg-secondary/60">
        <img src={asset.url} alt={asset.alt_text ?? ""} loading="lazy" className="h-full w-full object-cover" />
      </span>
      <Field label="Label">
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="menu, hero, wedding…" />
      </Field>
      <Field label="Description (alt text)">
        <TextInput value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="What's in the photo" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryButtonClass} onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className={outlineButtonClass} onClick={() => void remove()}>
          Delete
        </button>
      </div>
    </li>
  );
}
