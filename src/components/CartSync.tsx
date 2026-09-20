import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { saveCartSnapshot } from "@/lib/marketing";

/**
 * Records an in-progress cart as soon as a visitor adds food, anywhere on the
 * site — not only when they reach the order details step. Debounced so we save
 * once the visitor pauses, and silent on failure so it never blocks ordering.
 */
export function CartSync() {
  const { client, user, profile } = useAuth();
  const { lines, total } = useCart();

  useEffect(() => {
    if (!client || lines.length === 0) return;
    const timer = window.setTimeout(() => {
      void saveCartSnapshot(client, {
        userId: user?.id ?? null,
        name: profile?.full_name ?? "",
        email: user?.email ?? "",
        phone: profile?.phone ?? "",
        method: profile?.default_method ?? "Delivery",
        items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        total,
      });
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [client, lines, total, user, profile]);

  return null;
}
