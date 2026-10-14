import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/site";
import { altOf, imageOf, type MenuItemRow } from "@/lib/cms";

export function DishImage({ item, className, eager }: { item: MenuItemRow; className?: string; eager?: boolean }) {
  const src = item.image?.url ? imageOf(item) : null;
  if (!src) {
    return (
      <div role="img" aria-label={item.name} className={`flex items-center justify-center bg-secondary text-primary/40 ${className ?? ""}`}>
        <UtensilsCrossed className="h-1/3 w-1/3" strokeWidth={1.25} aria-hidden="true" />
      </div>
    );
  }
  return (
    <img src={src} alt={altOf(item, item.name)} width={1024} height={1024} loading={eager ? "eager" : "lazy"} decoding="async" className={`object-cover ${className ?? ""}`} />
  );
}

export function DishDetailSheet({ item, onClose }: { item: MenuItemRow | null; onClose: () => void }) {
  const { add, count } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!item) return;
    setQty(1);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;
  const meta = [item.category, ...item.diet_tags.slice(0, 1)].join(" · ");

  const addToOrder = () => {
    for (let i = 0; i < qty; i++) add({ id: item.id, name: item.name, price: Number(item.price) });
    toast.success(`${qty} × ${item.name} added to your order`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 motion-safe:animate-fade-in sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[100dvh] w-full flex-col overflow-y-auto rounded-t-[32px] bg-card shadow-card motion-safe:animate-fade-up sm:max-w-5xl sm:rounded-[32px] md:grid md:grid-cols-2 md:overflow-hidden"
      >
        {/* Upper / left: tinted stage */}
        <div className="relative overflow-hidden bg-secondary/60 px-5 pt-5 pb-8 md:flex md:flex-col md:pb-10">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} aria-label="Back to menu" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-transform duration-200 ease-out hover:scale-105">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <p className="label-caps truncate text-xs text-muted-foreground">{meta}</p>
            <Link to="/order" aria-label={`View your order, ${count} items`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-card">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              {count > 0 && <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-primary-foreground">{count}</span>}
            </Link>
          </div>

          <h2 id="dish-title" className="relative z-0 mt-5 text-center font-display font-extrabold uppercase leading-[0.9] tracking-tight text-primary break-words" style={{ fontSize: "clamp(2.5rem, 11vw, 5.5rem)" }}>
            {item.name}
          </h2>

          <div className="relative z-10 mx-auto -mt-[clamp(1.25rem,6vw,3rem)] aspect-square w-[min(78%,360px)] motion-safe:animate-dish-float">
            <DishImage item={item} eager className="aspect-square h-full w-full rounded-full shadow-[0_30px_60px_-20px_color-mix(in_oklab,var(--foreground)_45%,transparent)]" />
          </div>
        </div>

        {/* Lower / right: details */}
        <div className="flex flex-col gap-5 px-5 pt-6 pb-4 md:justify-center md:px-8">
          {item.description && <p className="text-[15px] leading-relaxed text-muted-foreground">{item.description}</p>}
          {item.diet_tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {item.diet_tags.map((d) => <li key={d} className="rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage">{d}</li>)}
            </ul>
          )}

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label-caps text-xs text-muted-foreground">Price</p>
              <p className="font-display text-3xl font-bold text-primary">{currency(Number(item.price))}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer" className="flex h-11 w-11 items-center justify-center rounded-full border border-input transition-colors hover:border-primary"><Minus className="h-4 w-4" /></button>
                <span className="flex h-11 w-11 items-center justify-center rounded-full font-display font-bold ring-2 ring-primary" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="More" className="flex h-11 w-11 items-center justify-center rounded-full border border-input transition-colors hover:border-primary"><Plus className="h-4 w-4" /></button>
              </div>
              <p className="label-caps mt-1 text-[11px] text-muted-foreground">Portions</p>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-1 mt-auto flex gap-2 rounded-full bg-foreground p-1.5 shadow-card md:static">
            <button type="button" onClick={addToOrder} className="label-caps flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Add to order · {currency(Number(item.price) * qty)}
            </button>
            <Link to="/order" className="label-caps flex min-h-[48px] items-center justify-center rounded-full px-4 text-background">View cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
