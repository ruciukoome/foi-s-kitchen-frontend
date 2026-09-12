import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { mediaAssetsQuery, type MediaAsset } from "@/lib/cms";
import { fieldClass, outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const MEDIA_BUCKET = "media";

/** Upload a file to the media bucket and record it in media_assets. */
export async function uploadMedia(
  client: NonNullable<ReturnType<typeof useAuth>["client"]>,
  file: File,
  label: string,
  altText: string,
): Promise<MediaAsset> {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${Date.now()}-${safe}`;
  const { error: uploadError } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const { data, error } = await client
    .from("media_assets")
    .insert({ storage_path: path, url: pub.publicUrl, label: label || null, alt_text: altText || null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MediaAsset;
}

/**
 * Thumbnail grid picker reused by every content editor.
 * Calls onSelect with the chosen media_assets row.
 */
export function MediaPicker({
  value,
  onSelect,
  onClear,
  label,
  defaultLabel = "",
}: {
  value?: { id: string | null; url?: string } | null;
  onSelect: (asset: MediaAsset) => void;
  onClear?: () => void;
  label?: string;
  defaultLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const preview = value?.url;

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="label-caps text-xs">{label}</span>}
      <div className="flex items-center gap-3">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/60">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
        <button type="button" className={outlineButtonClass} onClick={() => setOpen(true)}>
          {preview ? "Change photo" : "Choose photo"}
        </button>
        {preview && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted-foreground underline hover:text-primary"
          >
            Remove
          </button>
        )}
      </div>

      {open && (
        <MediaDialog
          defaultLabel={defaultLabel}
          onClose={() => setOpen(false)}
          onPick={(asset) => {
            onSelect(asset);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MediaDialog({
  onClose,
  onPick,
  defaultLabel,
}: {
  onClose: () => void;
  onPick: (asset: MediaAsset) => void;
  defaultLabel: string;
}) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(mediaAssetsQuery);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(data ?? [])].reverse();
    if (!q) return list;
    return list.filter((m) =>
      `${m.label ?? ""} ${m.alt_text ?? ""} ${m.storage_path}`.toLowerCase().includes(q),
    );
  }, [data, query]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !client) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(client, file, defaultLabel, "");
      }
      await queryClient.invalidateQueries({ queryKey: ["cms", "media_assets"] });
      toast.success("Photo uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Photo library"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <p className="font-display text-lg font-semibold">Photo library</p>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2">
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <input
            className={fieldClass}
            placeholder="Filter by label, e.g. menu"
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
            className={cn(primaryButtonClass, "shrink-0")}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {busy ? "Uploading…" : "Upload new"}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading && <p className="text-muted-foreground">Loading photos…</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-muted-foreground">No photos yet — upload one above.</p>
          )}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onPick(m)}
                  className="group block w-full overflow-hidden rounded-xl border border-border bg-background text-left transition-colors hover:border-primary"
                >
                  <span className="block aspect-square overflow-hidden bg-secondary/60">
                    <img
                      src={m.url}
                      alt={m.alt_text ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                    {m.label ?? "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
