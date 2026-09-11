import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeadingRow } from "@/components/PageHeadingRow";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import {
  formatOrderDate,
  statusBadgeClass,
  summariseItems,
  type OrderRow,
} from "@/lib/orders";
import { currency } from "@/lib/site";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Orders — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content: "Follow the status of every order you've placed with Foi's Kitchen.",
      },
      { property: "og:title", content: "My Orders — Foi's Kitchen" },
      { property: "og:description", content: "Track your Foi's Kitchen orders." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyOrdersPage />
    </RequireAuth>
  ),
});

function MyOrdersPage() {
  const { client, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !user) return;
    let cancelled = false;
    void client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setOrders((data ?? []) as OrderRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, [client, user]);

  return (
    <section className="container-page max-w-3xl pb-16 md:pb-24">
      <PageHeadingRow title="My orders" note="Newest first — status updates as we cook." />

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-card p-5 text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && orders === null && <p className="text-muted-foreground">Loading your orders…</p>}

      {!error && orders?.length === 0 && (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <p className="text-muted-foreground">You haven't placed an order yet.</p>
          <Link to="/menu" className={`${primaryButtonClass} mt-5`}>
            Browse the menu
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {orders?.map((o) => (
          <li key={o.id} className="rounded-2xl bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{formatOrderDate(o.created_at)}</p>
              <span
                className={cn(
                  "label-caps rounded-full px-3 py-1 text-[11px]",
                  statusBadgeClass(o.status),
                )}
              >
                {o.status}
              </span>
            </div>
            <p className="mt-3 font-display font-semibold">{summariseItems(o.items)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {o.method}
              {o.address ? ` — ${o.address}` : ""}
            </p>
            <p className="mt-3 font-display font-bold text-primary">{currency(Number(o.total))}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link to="/account" className={outlineButtonClass}>
          Back to my account
        </Link>
      </div>
    </section>
  );
}
