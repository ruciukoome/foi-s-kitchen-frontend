import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { site } from "@/lib/site";
import { quoteBusinessEmail, quoteCustomerEmail } from "@/lib/email-templates/quote";
import { orderBusinessEmail, orderCustomerEmail } from "@/lib/email-templates/order";

type Result = { ok: true; reference: string } | { ok: false; error: string };

const short = (max: number) => z.string().trim().max(max);

function makeReference(kind: "Q" | "O") {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `FK-${kind}-${ymd}-${rand}`;
}

/** Sender mailboxes. Env vars override these defaults. */
const ORDERS_FROM = () => process.env["RESEND_FROM_ORDERS"] || `Foi's Kitchen <orders@foiskitchen.com>`;
const SUPPORT_FROM = () => process.env["RESEND_FROM_SUPPORT"] || `Foi's Kitchen <support@foiskitchen.com>`;

/**
 * Resend API key resolution order:
 * 1. RESEND_API_KEY environment variable (hosting secret)
 * 2. admin_settings.resend_api_key row (pasted in the admin dashboard)
 */
async function resolveResendKey(): Promise<string | null> {
  const envKey = process.env["RESEND_API_KEY"]?.trim();
  if (envKey) return envKey;
  try {
    const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "resend_api_key")
      .maybeSingle();
    const value = data?.value?.trim();
    return value || null;
  } catch {
    return null;
  }
}

async function sendResend(payload: {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}) {
  const key = await resolveResendKey();
  if (!key) throw new Error("Resend is not connected yet");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend failed [${res.status}]: ${text}`);
    throw new Error(`Resend failed [${res.status}]`);
  }
}

const inbox = () => process.env["ORDERS_INBOX"] || site.email;

const quoteSchema = z.object({
  name: short(120).min(1),
  phone: short(40).min(5),
  email: z.string().trim().email().max(200),
  context: short(120),
  eventType: short(80),
  date: short(40).optional(),
  guests: short(20).optional(),
  budget: short(80).optional(),
  notes: short(2000).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export const sendQuoteEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => quoteSchema.parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const reference = makeReference("Q");
    try {
      await sendResend({
        to: inbox(),
        subject: `New quotation request — ${data.name} (${reference})`,
        html: quoteBusinessEmail(data, reference),
        from: SUPPORT_FROM(),
        replyTo: data.email,
      });
      await sendResend({
        to: data.email,
        subject: `We've got your quotation request (${reference})`,
        html: quoteCustomerEmail(data, reference),
        from: SUPPORT_FROM(),
      });
      return { ok: true, reference };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't send your email just now. Please try again or use WhatsApp." };
    }
  });

const orderSchema = z.object({
  name: short(120).min(1),
  phone: short(40).min(5),
  email: z.string().trim().email().max(200),
  method: short(40),
  address: short(400).optional(),
  time: short(80).optional(),
  notes: short(2000).optional(),
  items: z
    .array(z.object({ name: short(160).min(1), qty: z.number().int().min(1).max(500), price: z.number().min(0).max(1_000_000) }))
    .min(1)
    .max(60),
  website: z.string().max(0).optional(),
});

export const sendOrderEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const reference = makeReference("O");
    try {
      await sendResend({
        to: inbox(),
        subject: `New order — ${data.name} (${reference})`,
        html: orderBusinessEmail(data, reference),
        from: ORDERS_FROM(),
        replyTo: data.email,
      });
      await sendResend({
        to: data.email,
        subject: `Your Foi's Kitchen order is in (${reference})`,
        html: orderCustomerEmail(data, reference),
        from: ORDERS_FROM(),
      });
      return { ok: true, reference };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't send your order by email just now. Please try again or use WhatsApp." };
    }
  });

// ---------------------------------------------------------------------------
// Admin: manage the Resend connection from the dashboard.
// Each function takes the caller's access token and verifies they are an
// admin (profiles.is_admin) before touching settings.
// ---------------------------------------------------------------------------

const tokenSchema = z.object({ accessToken: z.string().min(20) });

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

export type EmailSettings = {
  connected: boolean;
  source: "environment" | "dashboard" | null;
  keyPreview: string | null;
  ordersFrom: string;
  supportFrom: string;
  inbox: string;
};

export const getEmailSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }): Promise<EmailSettings> => {
    const admin = await requireAdmin(data.accessToken);
    const envKey = process.env["RESEND_API_KEY"]?.trim();
    const { data: row } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "resend_api_key")
      .maybeSingle();
    const dbKey = row?.value?.trim() || "";
    const active = envKey || dbKey;
    return {
      connected: Boolean(active),
      source: envKey ? "environment" : dbKey ? "dashboard" : null,
      keyPreview: active ? `${active.slice(0, 7)}…${active.slice(-4)}` : null,
      ordersFrom: ORDERS_FROM(),
      supportFrom: SUPPORT_FROM(),
      inbox: inbox(),
    };
  });

export const saveResendKey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ accessToken: z.string().min(20), apiKey: z.string().trim().max(200) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const admin = await requireAdmin(data.accessToken);
      if (data.apiKey && !data.apiKey.startsWith("re_")) {
        return { ok: false, error: "That doesn't look like a Resend API key — they start with re_." };
      }
      const { error } = await admin.from("admin_settings").upsert({
        key: "resend_api_key",
        value: data.apiKey,
        updated_at: new Date().toISOString(),
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Could not save the key." };
    }
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ accessToken: z.string().min(20), to: z.string().trim().email().max(200) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      await requireAdmin(data.accessToken);
      await sendResend({
        to: data.to,
        subject: "Foi's Kitchen — email connection test",
        from: SUPPORT_FROM(),
        html: `<div style="font-family:Georgia,serif;background:#FBF6F4;padding:32px">
          <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #ead9dc">
            <h1 style="color:#8C1F35;font-size:22px;margin:0 0 12px">Email is connected</h1>
            <p style="color:#1A1613;font-size:15px;line-height:1.6;margin:0">
              This is a test from your Foi's Kitchen admin dashboard. Order and quotation
              emails will now arrive styled like this, sent from your foiskitchen.com mailboxes.
            </p>
          </div>
        </div>`,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "The test email failed." };
    }
  });
