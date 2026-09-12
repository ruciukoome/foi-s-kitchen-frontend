import { altOf, imageOf, type GalleryItemRow } from "@/lib/cms";

/** Masonry photo grid. */
export function GalleryGrid({ items }: { items: GalleryItemRow[] }) {
  return (
    <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
      {items.map((item, i) => (
        <figure
          key={item.id}
          className="animate-fade-up group overflow-hidden rounded-2xl bg-card shadow-card break-inside-avoid"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <img
            src={imageOf(item)}
            alt={altOf(item, item.caption ?? "Foi's Kitchen photo")}
            loading="lazy"
            className="w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </figure>
      ))}
    </div>
  );
}
