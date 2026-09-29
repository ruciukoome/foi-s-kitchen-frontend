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
  id: short(80),
  name: short(160).min(1),
  qty: z.number().int().min(1).max(500),
  price: z.number().min(0).max(1_000_000),
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

/** Re-price the cart from the menu so the amount charged can't be tampered with. */
async function trustedTotal(items: z.infer<typeof itemSchema>[]): Promise<number> {
  try {
    const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
    const admin = getSupabaseAdmin();
    const ids = items.map((i) => i.id).filter(Boolean);
    const { data } = await admin.from("menu_items").select("id, price").in("id", ids);
    const priceById = new Map<string, number>((data ?? []).map((r: { id: string; price: number }) => [r.id, Number(r.price)]));
    return items.reduce((sum, i) => {
      const known = priceById.get(i.id);
      return sum + (typeof known === "number" && !Number.isNaN(known) ? known : i.price) * i.qty;
    }, 0);
  } catch {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
}

// --------------------------------------------------------------- customer

const initSchema = z.object({
  email: z.string().trim().email().max(200),
  name: short(120),
  phone: short(40),
  method: short(40),
  items: z.array(itemSchema).min(1).max(60),
});

export type PaystackInit =
  | { ok: true; reference: string; accessCode: string; amount: number }
  | { ok: false; error: string };

export const initializePaystackCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => initSchema.parse(d))
  .handler(async ({ data }): Promise<PaystackInit> => {
    const secret = await resolveSecretKey();
    if (!secret) return { ok: false, error: "Card and M-Pesa payment isn't switched on yet." };

    const amount = await trustedTotal(data.items);
    if (amount <= 0) return { ok: false, error: "Your cart total came to zero." };

    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          amount: Math.round(amount * 100), // KES subunits
          currency: "KES",
          channels: ["card", "mobile_money", "bank_transfer"],
          metadata: {
            customer_name: data.name,
            phone: data.phone,
            fulfilment: data.method,
            items: data.items.map((i) => `${i.qty} x ${i.name}`).join(", "),
          },
        }),
      });
      const body = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { reference?: string; access_code?: string };
      };
      if (!res.ok || !body.status || !body.data?.access_code || !body.data?.reference) {
        console.error("Paystack initialize failed", res.status, body.message);
        return { ok: false, error: body.message || "We couldn't start the payment. Please try again." };
      }
      return { ok: true, reference: body.data.reference, accessCode: body.data.access_code, amount };
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
        data?: { status?: string; amount?: number; channel?: string };
      };
      if (!res.ok || !body.status || !body.data) {
        return { ok: false, error: body.message || "We couldn't confirm the payment." };
      }
      const paid = body.data.status === "success";
      const amount = (body.data.amount ?? 0) / 100;

      try {
        const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
        await getSupabaseAdmin()
          .from("orders")
          .update({
            payment_status: paid ? "paid" : "failed",
            paid_at: paid ? new Date().toISOString() : null,
          })
          .eq("payment_reference", data.reference);
      } catch (e) {
        console.error("Could not update order payment status", e);
      }

      return { ok: true, paid, amount, channel: body.data.channel ?? null };
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
