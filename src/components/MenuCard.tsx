import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/site";
import type { MenuItem } from "@/data/menu";

export function MenuCard({ item, index = 0 }: { item: MenuItem; index?: number }) {
  const { add } = useCart();

  return (
    <article
      className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="aspect-square overflow-hidden bg-secondary/60">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold sm:text-lg">{item.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

        {item.diet.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {item.diet.map((d) => (
              <li
                key={d}
                className="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold text-sage"
              >
                {d}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base font-bold whitespace-nowrap text-primary">
            {currency(item.price)}
          </span>
          <button
            type="button"
            onClick={() => {
              add({ id: item.id, name: item.name, price: item.price });
              toast.success(`${item.name} added to your order`);
            }}
            className="label-caps flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97] sm:w-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Add
          </button>
        </div>

      </div>
    </article>
  );
}
