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

async function sendResend(payload: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env["RESEND_FROM"] || `Foi's Kitchen <orders@foiskitchen.co.ke>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
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
        replyTo: data.email,
      });
      await sendResend({
        to: data.email,
        subject: `We've got your quotation request (${reference})`,
        html: quoteCustomerEmail(data, reference),
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
        replyTo: data.email,
      });
      await sendResend({
        to: data.email,
        subject: `Your Foi's Kitchen order is in (${reference})`,
        html: orderCustomerEmail(data, reference),
      });
      return { ok: true, reference };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "We couldn't send your order by email just now. Please try again or use WhatsApp." };
    }
  });
