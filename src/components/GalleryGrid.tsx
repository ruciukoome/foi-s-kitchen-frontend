import type { GalleryItem } from "@/data/gallery";

/** Masonry photo grid. */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
      {items.map((item, i) => (
        <figure
          key={item.id}
          className="animate-fade-up group overflow-hidden rounded-2xl bg-card shadow-card break-inside-avoid"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </figure>
      ))}
    </div>
  );
}
