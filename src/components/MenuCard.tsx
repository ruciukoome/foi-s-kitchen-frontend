import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/site";
import { type MenuItemRow } from "@/lib/cms";
import { DishImage } from "@/components/DishDetailSheet";

export function MenuCard({ item, index = 0, onOpen }: { item: MenuItemRow; index?: number; onOpen?: (item: MenuItemRow) => void }) {
  const { add } = useCart();

  return (
    <article
      className="animate-fade-up group relative mt-10 flex flex-col rounded-3xl border border-border bg-card px-4 pt-0 pb-4 shadow-card transition-transform duration-300 ease-out hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <button type="button" onClick={() => onOpen?.(item)} aria-label={`View ${item.name}`} className="-mt-10 mx-auto block aspect-square w-[82%] rounded-full focus-visible:ring-2 focus-visible:ring-primary">
        <DishImage item={item} className="aspect-square h-full w-full rounded-full shadow-card transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
      </button>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight sm:text-lg">
          <button type="button" onClick={() => onOpen?.(item)} className="text-left uppercase hover:text-primary">{item.name}</button>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

        {item.diet_tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {item.diet_tags.map((d) => (
              <li key={d} className="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold text-sage">{d}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="label-caps text-[10px] text-muted-foreground">Price</p>
            <span className="font-display text-lg font-bold whitespace-nowrap text-primary sm:text-xl">{currency(Number(item.price))}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              add({ id: item.id, name: item.name, price: Number(item.price) });
              toast.success(`${item.name} added to your order`);
            }}
            aria-label={`Add ${item.name} to your order`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
