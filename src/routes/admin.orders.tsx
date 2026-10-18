import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import {
  ORDER_STATUSES,
  formatOrderDate,
  paymentBadgeClass,
  paymentLabel,
  statusBadgeClass,
  summariseItems,
  type OrderRow,
} from "@/lib/orders";
import { shouldSyncOrder, summariseUsage, type OrderSyncResult } from "@/lib/pos";
import { currency } from "@/lib/site";
import { fieldClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Order Status Admin — Foi's Kitchen" },
      { name: "description", content: "Internal tool for updating Foi's Kitchen order statuses." },
      { property: "og:title", content: "Order Status Admin — Foi's Kitchen" },
      { property: "og:description", content: "Internal order status tool." },
    ],
  }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const { client } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
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
  }, [client]);

  async function updateStatus(id: string, status: string) {
    if (!client) return;
    const previous = orders;
    const order = orders?.find((o) => o.id === id);
    setOrders((rows) => rows?.map((o) => (o.id === id ? { ...o, status } : o)) ?? rows);
    const { error: err } = await client.from("orders").update({ status }).eq("id", id);
    if (err) {
      setOrders(previous ?? null);
      toast.error(err.message);
      return;
    }
    toast.success("Status updated.");
    if (shouldSyncOrder(status, order?.pos_receipt_no)) await syncStock(id);
  }

  async function syncStock(id: string) {
    if (!client) return;
    const { data, error: err } = await client.rpc("pos_sync_order", { _order_id: id });
    if (err) {
      toast.error(`Stock wasn't deducted: ${err.message}`, { duration: 10000 });
      return;
    }
    const res = data as OrderSyncResult;
    setOrders((rows) => rows?.map((o) => (o.id === id ? { ...o, pos_receipt_no: res.receipt_no } : o)) ?? rows);
    if (res.already) return;
    const { shortages, low, lines } = summariseUsage(res.usage);
    if (shortages.length) {
      toast.error("Not enough stock for this order", {
        description: shortages.join("\n"),
        duration: Infinity,
        closeButton: true,
      });
    }
    if (low.length) toast.warning("Running low", { description: low.join("\n"), duration: 15000 });
    if (res.no_recipe.length) {
      toast.warning("No recipe set — nothing deducted for:", {
        description: res.no_recipe.join(", "),
        duration: 15000,
      });
    }
    toast.success(`Recorded as POS sale ${res.receipt_no}`, {
      description: lines.length ? lines.join("\n") : "No stock was used.",
      duration: 15000,
      closeButton: true,
    });
  }

  return (
    <AdminShell title="Orders" note="All orders — change a status to update it instantly.">


      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-card p-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && orders === null && <p className="text-muted-foreground">Loading orders…</p>}
      {!error && orders?.length === 0 && (
        <p className="text-muted-foreground">No orders yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {orders?.map((o) => (
          <li
            key={o.id}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "label-caps rounded-full px-3 py-1 text-[11px]",
                    statusBadgeClass(o.status),
                  )}
                >
                  {o.status}
                </span>
                <span
                  className={cn(
                    "label-caps rounded-full px-3 py-1 text-[11px]",
                    paymentBadgeClass(o),
                  )}
                >
                  {paymentLabel(o)}
                </span>
                {o.pos_receipt_no && (
                  <span className="label-caps rounded-full border border-gold px-3 py-1 text-[11px]">
                    Stock deducted · {o.pos_receipt_no}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Placed {formatOrderDate(o.created_at)}
              </p>
              {o.paid_at && (
                <p className="text-sm text-muted-foreground">
                  Paid {formatOrderDate(o.paid_at)}
                </p>
              )}
              {o.payment_reference && (
                <p className="text-sm text-muted-foreground">
                  Payment reference: <span className="font-mono">{o.payment_reference}</span>
                </p>
              )}
              <p className="mt-2 font-display font-semibold">{summariseItems(o.items)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {o.user_id ? "Account order" : `Guest: ${o.guest_name ?? "—"} · ${o.guest_phone ?? "—"}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {o.method}
                {o.address ? ` — ${o.address}` : ""}
                {o.preferred_time ? ` · ${o.preferred_time}` : ""}
              </p>
              {o.notes && <p className="text-sm text-muted-foreground">Notes: {o.notes}</p>}
              <p className="mt-2 font-display font-bold text-primary">
                {currency(Number(o.total))}
              </p>
            </div>


            <label className="flex flex-col gap-1 md:w-56">
              <span className="label-caps text-xs">Status</span>
              <select
                className={fieldClass}
                value={o.status}
                onChange={(e) => void updateStatus(o.id, e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
