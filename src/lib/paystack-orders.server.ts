/**
 * Server-only Paystack order helpers: strict pricing, payment reconciliation
 * and the kitchen/customer notification on a confirmed payment.
 */
import { getSupabaseAdmin } from "@/integrations/supabase-external/admin.server";
import { orderBusinessEmail, orderCustomerEmail } from "@/lib/email-templates/order";

export type CartLine = { id: string; qty: number };
export type PricedLine = { id: string; name: string; qty: number; price: number };

/** Prices every line from the menu. Fails closed on unknown ids or lookup errors. */
export async function priceCart(
  lines: CartLine[],
): Promise<{ ok: true; items: PricedLine[]; total: number } | { ok: false; error: string }> {
  const ids = [...new Set(lines.map((l) => l.id))];
  const { data, error } = await getSupabaseAdmin()
    .from("menu_items")
    .select("id, name, price")
    .in("id", ids);
  if (error || !data) {
    console.error("Menu price lookup failed", error);
    return { ok: false, error: "We couldn't check prices just now. Please try again." };
  }
  const byId = new Map(
    (data as { id: string; name: string; price: number }[]).map((r) => [String(r.id), r]),
  );
  const items: PricedLine[] = [];
  for (const l of lines) {
    const row = byId.get(l.id);
    const price = Number(row?.price);
    if (!row || !Number.isFinite(price) || price <= 0) {
      return { ok: false, error: "Some items in your cart are no longer available. Please refresh your cart." };
    }
    items.push({ id: l.id, name: row.name, qty: l.qty, price });
  }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return { ok: true, items, total };
}

type PaystackTx = {
  status?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  customer?: { email?: string };
};

type OrderRow = {
  id: string;
  total: number;
  payment_status: string;
  guest_name: string | null;
  guest_phone: string | null;
  user_id: string | null;
  items: { name: string; qty: number; price: number }[];
  method: string;
  address: string | null;
  preferred_time: string | null;
  notes: string | null;
};

export type ReconcileResult =
  | { state: "paid"; amount: number; channel: string | null }
  | { state: "not_paid"; status: string }
  | { state: "mismatch" }
  | { state: "no_order" }
  | { state: "error" };

/**
 * Applies a Paystack transaction to its order. Only a successful charge whose
 * amount and currency match the order total marks it paid; a paid order is
 * never downgraded. Throws only on database errors (so webhooks can retry).
 */
export async function reconcilePayment(reference: string, tx: PaystackTx): Promise<ReconcileResult> {
  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, total, payment_status, guest_name, guest_phone, user_id, items, method, address, preferred_time, notes")
    .eq("payment_reference", reference)
    .maybeSingle<OrderRow>();
  if (error) throw error;
  if (!order) return { state: "no_order" };

  const amount = (tx.amount ?? 0) / 100;
  if (order.payment_status === "paid") return { state: "paid", amount, channel: tx.channel ?? null };

  if (tx.status !== "success") {
    // Only a definitive failure is recorded; pending/abandoned leaves it pending.
    if (tx.status === "failed") {
      const { error: upErr } = await admin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id)
        .neq("payment_status", "paid");
      if (upErr) throw upErr;
    }
    return { state: "not_paid", status: tx.status ?? "unknown" };
  }

  const expected = Math.round(Number(order.total) * 100);
  if ((tx.currency ?? "").toUpperCase() !== "KES" || tx.amount !== expected) {
    console.error("Paystack amount mismatch", { reference, expected, got: tx.amount, currency: tx.currency });
    return { state: "mismatch" };
  }

  // Conditional update: only the first confirmation flips it, so emails go once.
  const { data: flipped, error: upErr } = await admin
    .from("orders")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id");
  if (upErr) throw upErr;

  if (flipped && flipped.length > 0) {
    await notifyPaidOrder(order, reference, tx.customer?.email ?? null).catch((e) =>
      console.error("Paid-order email failed", e),
    );
  }
  return { state: "paid", amount, channel: tx.channel ?? null };
}

async function resolveResendKey(): Promise<string | null> {
  const env = process.env["RESEND_API_KEY"]?.trim();
  if (env) return env;
  const { data } = await getSupabaseAdmin()
    .from("admin_settings")
    .select("value")
    .eq("key", "resend_api_key")
    .maybeSingle();
  return data?.value?.trim() || null;
}

async function send(key: string, to: string, subject: string, html: string, from: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.error(`Resend failed [${res.status}]: ${await res.text()}`);
}

async function notifyPaidOrder(order: OrderRow, reference: string, email: string | null) {
  const key = await resolveResendKey();
  if (!key) return;
  let name = order.guest_name ?? "";
  let phone = order.guest_phone ?? "";
  if (order.user_id && (!name || !phone)) {
    const { data: p } = await getSupabaseAdmin()
      .from("profiles")
      .select("full_name, phone")
      .eq("id", order.user_id)
      .maybeSingle();
    name = name || p?.full_name || "Customer";
    phone = phone || p?.phone || "";
  }
  const data = {
    name: name || "Customer",
    phone,
    email: email ?? "",
    method: order.method,
    address: order.address ?? undefined,
    time: order.preferred_time ?? undefined,
    notes: order.notes ?? undefined,
    items: order.items,
  };
  const from = process.env["RESEND_FROM_ORDERS"] || `Foi's Kitchen <orders@foiskitchen.com>`;
  const inbox = process.env["ORDERS_INBOX"] || "orders@foiskitchen.com";
  await send(key, inbox, `New PAID order — ${data.name} (${reference})`, orderBusinessEmail(data, reference), from, email ?? undefined);
  if (email) {
    await send(key, email, `Your Foi's Kitchen order is in (${reference})`, orderCustomerEmail(data, reference), from);
  }
}
