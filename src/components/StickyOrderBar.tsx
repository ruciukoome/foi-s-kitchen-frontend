import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/site";

/** Mobile-only sticky Order Now bar so checkout is always one tap away. */
export function StickyOrderBar() {
  const { count, total } = useCart();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <Link
        to="/order"
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep active:scale-[0.97]"
      >
        <ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="label-caps">
          {count > 0 ? `Order Now · ${currency(total)}` : "Order Now"}
        </span>
      </Link>
    </div>
  );
}
