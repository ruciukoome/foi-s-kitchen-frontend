import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

import { altOf, imageOf, type GalleryItemRow } from "@/lib/cms";
import { embedSrc, isPlayable } from "@/lib/media";

/** Masonry grid of photos and videos. Videos open in a lightbox. */
export function GalleryGrid({ items }: { items: GalleryItemRow[] }) {
  const [active, setActive] = useState<GalleryItemRow | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {items.map((item, i) => {
          const type = item.image?.media_type ?? "image";
          const playable = isPlayable(type);
          const poster = item.image?.poster_url || (type === "video" ? "" : imageOf(item));
          // Descriptive fallback alt text: the CMS alt text wins, then the
          // caption, then a category-based description for SEO/screen readers.
          const alt = altOf(
            item,
            item.caption ?? `${item.category} catering in Nairobi by Foi's Kitchen`,
          );

          return (
            <figure
              key={item.id}
              className="animate-fade-up group relative overflow-hidden rounded-2xl bg-card shadow-card break-inside-avoid"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              {playable ? (
                <button
                  type="button"
                  onClick={() => setActive(item)}
                  className="relative block w-full min-h-[44px] text-left"
                  aria-label={`Play video: ${item.caption ?? "Foi's Kitchen"}`}
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={alt}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  ) : type === "video" ? (
                    <video
                      src={imageOf(item)}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full object-cover"
                    />
                  ) : (
                    <span className="block aspect-[4/5] w-full bg-secondary/60" />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-foreground/25 transition-colors duration-200 ease-out group-hover:bg-foreground/35">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-card/90 shadow-card">
                      <Play className="h-6 w-6 fill-primary text-primary" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </span>
                </button>
              ) : (
                <img
                  src={imageOf(item)}
                  alt={alt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
              )}
              {item.caption && (
                <figcaption className="px-4 py-3 text-sm text-muted-foreground">{item.caption}</figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption ?? "Video"}
          onClick={() => setActive(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close video"
                className="grid h-11 w-11 place-items-center rounded-full bg-card"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-card">
              {active.image?.media_type === "embed" ? (
                <iframe
                  src={embedSrc(imageOf(active))}
                  title={active.caption ?? "Foi's Kitchen video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                <video
                  src={imageOf(active)}
                  poster={active.image?.poster_url ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
