import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrderItem } from "@/lib/orders";
import { currency, site } from "@/lib/site";

export type ContactRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  marketing_opt_in: boolean | null;
  created_at: string;
};

export type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
};

export type CartRow = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  method: string | null;
  status: string;
  last_active_at: string;
  created_at: string;
};

const CART_ID_KEY = "foi-cart-row-id";

function readCartId() {
  try {
    return window.localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function writeCartId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(CART_ID_KEY, id);
    else window.localStorage.removeItem(CART_ID_KEY);
  } catch {
    /* storage unavailable */
  }
}

type CartSnapshot = {
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  method: string;
  items: OrderItem[];
  total: number;
};

/**
 * Saves (or refreshes) the visitor's in-progress cart so Foi can follow up if
 * they never finish checkout. Fails silently — it must never block ordering.
 */
export async function saveCartSnapshot(
  client: SupabaseClient | null,
  snapshot: CartSnapshot,
) {
  if (!client || snapshot.items.length === 0) return;
  const payload = {
    user_id: snapshot.userId,
    customer_name: snapshot.name || null,
    customer_email: snapshot.email || null,
    customer_phone: snapshot.phone || null,
    items: snapshot.items,
    total: snapshot.total,
    method: snapshot.method,
    status: "active",
    last_active_at: new Date().toISOString(),
  };

  const existing = readCartId();
  if (existing) {
    const { error } = await client
      .from("abandoned_carts")
      .update(payload)
      .eq("id", existing)
      .select("id")
      .maybeSingle();
    if (!error) return;
    writeCartId(null);
  }

  const { data } = await client
    .from("abandoned_carts")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (data?.id) writeCartId(data.id as string);
}

/** Marks the saved cart as converted once the order goes out on WhatsApp. */
export async function markCartConverted(client: SupabaseClient | null) {
  const id = readCartId();
  if (!client || !id) return;
  await client.from("abandoned_carts").update({ status: "converted" }).eq("id", id);
  writeCartId(null);
}

export function cartSummary(items: OrderItem[] | null | undefined) {
  if (!items || items.length === 0) return "Empty cart";
  return items.map((i) => `${i.qty} × ${i.name}`).join(", ");
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day(s) ago`;
}

export function reminderText(cart: CartRow) {
  const first = (cart.customer_name ?? "there").split(" ")[0];
  return [
    `Hi ${first}! It's ${site.name}.`,
    `We noticed you left ${cartSummary(cart.items)} (${currency(Number(cart.total))}) in your cart.`,
    "Would you like us to get that cooking for you?",
  ].join(" ");
}

export function waNumberLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "254");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function toCsv(rows: string[][]) {
  return rows
    .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
