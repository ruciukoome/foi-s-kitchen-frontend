import { BRAND, esc, layout } from "./layout";
import { site } from "@/lib/site";
import { SITE_URL } from "@/lib/seo";

type ReminderItem = { name: string; qty: number; price: number };

const ksh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

/** Styled abandoned-cart reminder, sent from ivy@foiskitchen.com. */
export function cartReminderEmail(opts: {
  name: string | null;
  items: ReminderItem[];
  total: number;
  reference: string;
}) {
  const first = (opts.name ?? "there").split(" ")[0];
  const rows = opts.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:15px;color:${BRAND.charcoal}">${esc(i.qty)} × ${esc(i.name)}</td>
        <td align="right" style="padding:8px 0;font-size:15px;color:${BRAND.charcoal}">${ksh(i.price * i.qty)}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:4px 0">
      ${rows}
      <tr>
        <td style="padding:12px 0 0;font-weight:700;font-size:16px;color:${BRAND.primary};border-top:1px solid ${BRAND.gold}">Total</td>
        <td align="right" style="padding:12px 0 0;font-weight:700;font-size:16px;color:${BRAND.primary};border-top:1px solid ${BRAND.gold}">${ksh(opts.total)}</td>
      </tr>
    </table>
    <p style="margin:20px 0 0;text-align:center">
      <a href="${SITE_URL}/order" style="display:inline-block;background:${BRAND.primary};color:#ffffff;font-family:Poppins,Helvetica,Arial,sans-serif;font-weight:600;font-size:15px;padding:14px 32px;border-radius:999px;text-decoration:none">Finish my order</a>
    </p>
    <p style="margin:16px 0 0;text-align:center;font-size:13px;color:${BRAND.muted}">
      Prefer to chat? <a href="https://wa.me/${esc(site.whatsapp)}" style="color:${BRAND.primary};text-decoration:none">Message us on WhatsApp</a>.
    </p>`;

  return layout({
    preview: `You left something delicious in your cart, ${first}.`,
    heading: `Still hungry, ${first}?`,
    intro:
      "Your cart is saved and waiting. Tap below to finish your order in a minute — " +
      "we'll take care of the rest.",
    body,
    reference: opts.reference,
  });
}
