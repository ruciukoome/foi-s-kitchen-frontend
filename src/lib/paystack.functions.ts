import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Paystack checkout (test or live).
 *
 * Key resolution order, same idea as Resend:
 * 1. PAYSTACK_SECRET_KEY / PAYSTACK_PUBLIC_KEY environment variables
 * 2. admin_settings rows 'paystack_secret_key' / 'paystack_public_key'
 *
 * The secret key never leaves the server. The browser only ever receives an
 * access code for the popup.
 */

const short = (max: number) => z.string().trim().max(max);

const itemSchema = z.object({
  id: short(80).min(1),
  qty: z.number().int().min(1).max(500),
});

async function readSetting(key: string): Promise<string | null> {
  try {
    const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("admin_settings").select("value").eq("key", key).maybeSingle();
    return data?.value?.trim() || null;
  } catch {
    return null;
  }
}

async function resolveSecretKey(): Promise<string | null> {
  const env = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  if (env) return env;
  return readSetting("paystack_secret_key");
}

async function resolvePublicKey(): Promise<string | null> {
  const env = process.env["PAYSTACK_PUBLIC_KEY"]?.trim();
  if (env) return env;
  return readSetting("paystack_public_key");
}

// --------------------------------------------------------------- customer

const initSchema = z.object({
  accessToken: z.string().max(4000).optional(),
  email: z.string().trim().email().max(200),
  name: short(120).min(1),
  phone: short(40).min(5),
  method: z.enum(["Delivery", "Pickup"]),
  address: short(400).optional(),
  preferredTime: short(80).optional(),
  notes: short(2000).optional(),
  items: z.array(itemSchema).min(1).max(60),
});

export type PaystackInit =
  | { ok: true; reference: string; accessCode: string; amount: number }
  | { ok: false; error: string };

/**
 * Prices the cart on the server, creates the order (pending) and starts the
 * Paystack transaction for exactly that total. The browser never writes the
 * order or its amount.
 */
export const initializePaystackCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => initSchema.parse(d))
  .handler(async ({ data }): Promise<PaystackInit> => {
    const secret = await resolveSecretKey();
    if (!secret) return { ok: false, error: "Card and M-Pesa payment isn't switched on yet." };

    const { priceCart } = await import("@/lib/paystack-orders.server");
    const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
    const admin = getSupabaseAdmin();

    let priced;
    try {
      priced = await priceCart(data.items);
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't check prices just now. Please try again." };
    }
    if (!priced.ok) return priced;
    const { items, total } = priced;

    let userId: string | null = null;
    if (data.accessToken) {
      const { data: u } = await admin.auth.getUser(data.accessToken);
      userId = u.user?.id ?? null;
    }

    const reference = `FK-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

    const { error: insertErr } = await admin.from("orders").insert({
      user_id: userId,
      guest_name: userId ? null : data.name,
      guest_phone: userId ? null : data.phone,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      method: data.method,
      address: data.method === "Delivery" ? data.address || null : null,
      preferred_time: data.preferredTime || null,
      notes: data.notes || null,
      status: "Received",
      payment_status: "pending",
      payment_method: "paystack",
      payment_reference: reference,
    });
    if (insertErr) {
      console.error("Order insert failed", insertErr);
      return { ok: false, error: "We couldn't save your order. Please try again or use WhatsApp." };
    }

    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          amount: Math.round(total * 100), // KES subunits
          currency: "KES",
          reference,
          channels: ["card", "mobile_money", "bank_transfer"],
          metadata: {
            customer_name: data.name,
            phone: data.phone,
            fulfilment: data.method,
            items: items.map((i) => `${i.qty} x ${i.name}`).join(", "),
          },
        }),
      });
      const body = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { reference?: string; access_code?: string };
      };
      if (!res.ok || !body.status || !body.data?.access_code) {
        console.error("Paystack initialize failed", res.status, body.message);
        await admin.from("orders").update({ payment_status: "failed" }).eq("payment_reference", reference);
        return { ok: false, error: "We couldn't start the payment. Please try again." };
      }
      return { ok: true, reference, accessCode: body.data.access_code, amount: total };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't reach the payment service. Please try again." };
    }
  });

export type PaystackVerify =
  | { ok: true; paid: boolean; amount: number; channel: string | null }
  | { ok: false; error: string };

export const verifyPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: short(120).min(4) }).parse(d))
  .handler(async ({ data }): Promise<PaystackVerify> => {
    const secret = await resolveSecretKey();
    if (!secret) return { ok: false, error: "Payments aren't switched on yet." };
    try {
      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
        { headers: { Authorization: `Bearer ${secret}` } },
      );
      const body = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { status?: string; amount?: number; currency?: string; channel?: string; customer?: { email?: string } };
      };
      if (!res.ok || !body.status || !body.data) {
        return { ok: false, error: "We couldn't confirm the payment." };
      }
      const { reconcilePayment } = await import("@/lib/paystack-orders.server");
      const result = await reconcilePayment(data.reference, body.data);
      if (result.state === "paid") {
        return { ok: true, paid: true, amount: result.amount, channel: result.channel };
      }
      if (result.state === "mismatch") {
        return { ok: false, error: "The amount paid didn't match your order. Please contact us on WhatsApp." };
      }
      return { ok: true, paid: false, amount: 0, channel: null };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't confirm the payment. Please contact us on WhatsApp." };
    }
  });

// ------------------------------------------------------------------ admin

async function requireAdmin(accessToken: string) {
  const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
  const admin = getSupabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(accessToken);
  if (error || !userData.user) throw new Error("Not signed in");
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Admins only");
  return admin;
}

export type PaystackSettings = {
  connected: boolean;
  mode: "test" | "live" | null;
  source: "environment" | "dashboard" | null;
  publicKeyPreview: string | null;
  secretKeyPreview: string | null;
};

const preview = (v: string | null) => (v ? `${v.slice(0, 11)}…${v.slice(-4)}` : null);

export const getPaystackSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ accessToken: z.string().min(20) }).parse(d))
  .handler(async ({ data }): Promise<PaystackSettings> => {
    await requireAdmin(data.accessToken);
    const envSecret = process.env["PAYSTACK_SECRET_KEY"]?.trim() || null;
    const secret = envSecret || (await readSetting("paystack_secret_key"));
    const publicKey = await resolvePublicKey();
    return {
      connected: Boolean(secret),
      mode: secret ? (secret.startsWith("sk_live") ? "live" : "test") : null,
      source: secret ? (envSecret ? "environment" : "dashboard") : null,
      publicKeyPreview: preview(publicKey),
      secretKeyPreview: preview(secret),
    };
  });

export const savePaystackKeys = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        accessToken: z.string().min(20),
        publicKey: z.string().trim().max(200),
        secretKey: z.string().trim().max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const admin = await requireAdmin(data.accessToken);
      if (data.publicKey && !data.publicKey.startsWith("pk_")) {
        return { ok: false, error: "The public key should start with pk_test_ or pk_live_." };
      }
      if (data.secretKey && !data.secretKey.startsWith("sk_")) {
        return { ok: false, error: "The secret key should start with sk_test_ or sk_live_." };
      }
      const now = new Date().toISOString();
      const { error } = await admin.from("admin_settings").upsert([
        { key: "paystack_public_key", value: data.publicKey, updated_at: now },
        { key: "paystack_secret_key", value: data.secretKey, updated_at: now },
      ]);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Could not save the keys." };
    }
  });
