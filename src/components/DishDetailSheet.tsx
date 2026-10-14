import { useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(item);

  // Focus management: remember the opener, focus inside, trap Tab, restore on close.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (opener && opener.isConnected && opener !== document.body) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!item) return;
    setQty(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;
  const meta = [item.category, ...item.diet_tags.slice(0, 1)].join(" · ");

  const addToOrder = () => {
    add({ id: item.id, name: item.name, price: Number(item.price) }, qty);
    toast.success(`${qty} × ${item.name} added to your order`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-card motion-safe:animate-fade-in" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        onClick={(e) => e.stopPropagation()}
        className="dish-detail-screen relative flex h-dvh w-full flex-col overflow-y-auto bg-card motion-safe:animate-fade-up md:grid md:grid-cols-2"
      >
        {/* Upper / left: tinted stage */}
        <div className="dish-colour-stage relative bg-primary px-4 pt-4 pb-10 md:flex md:min-h-full md:flex-col md:px-6 md:pt-6 md:pb-12">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} aria-label="Back to menu" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-transform duration-200 ease-out hover:scale-105">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <p className="label-caps min-w-0 text-center text-xs text-primary-foreground">{meta}</p>
            <Link to="/order" aria-label={`View your order, ${count} items`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-card">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              {count > 0 && <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-primary-foreground">{count}</span>}
            </Link>
          </div>

          <div className="dish-poster-composition md:my-auto">
            <h2 id="dish-title" className="dish-poster-title relative z-0 text-center font-display font-extrabold uppercase text-primary-foreground/70">
              {item.name}
            </h2>
            <div className="dish-poster-photo relative z-10 mx-auto aspect-square motion-safe:animate-dish-float">
              <DishImage item={item} eager className="aspect-square h-full w-full rounded-full border-[8px] border-card shadow-dish md:border-[10px]" />
            </div>
          </div>
        </div>

        {/* Lower / right: details */}
        <div className="dish-details-panel relative z-20 -mt-6 flex flex-1 flex-col gap-5 rounded-t-[32px] bg-card px-5 pt-7 pb-5 md:mt-0 md:justify-end md:rounded-none md:rounded-l-[48px] md:px-10 md:py-10">
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

          <div className="sticky bottom-0 -mx-1 mt-auto md:mt-8 flex shrink-0 gap-2 rounded-full bg-foreground p-1.5 shadow-card md:static">
            <button type="button" onClick={addToOrder} className="label-caps flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Add to order<span className="hidden sm:inline"> · {currency(Number(item.price) * qty)}</span>
            </button>
            <Link to="/order" className="label-caps flex min-h-[48px] items-center justify-center rounded-full px-4 text-background">View cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
