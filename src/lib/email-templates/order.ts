import { BRAND, esc, layout, row } from "./layout";

export type OrderEmailData = {
  name: string;
  phone: string;
  email: string;
  method: string;
  address?: string;
  time?: string;
  notes?: string;
  items: { name: string; qty: number; price: number }[];
};

const ksh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

function body(d: OrderEmailData) {
  const total = d.items.reduce((s, i) => s + i.qty * i.price, 0);
  const items = d.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-size:15px">${i.qty} × ${esc(i.name)}</td><td style="padding:6px 0;font-size:15px;text-align:right;color:${BRAND.primary}">${ksh(i.qty * i.price)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:12px 16px">
${items}
<tr><td style="padding:10px 0 4px;border-top:1px solid ${BRAND.gold};font-family:Poppins,Helvetica,Arial,sans-serif;font-weight:700">Total</td><td style="padding:10px 0 4px;border-top:1px solid ${BRAND.gold};text-align:right;font-family:Poppins,Helvetica,Arial,sans-serif;font-weight:700;color:${BRAND.primary}">${ksh(total)}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
${row("Name", d.name)}${row("Phone", d.phone)}${row("Email", d.email)}${row("Method", d.method)}
${row("Address", d.method === "Delivery" ? d.address : undefined)}${row("Preferred time", d.time)}${row("Notes", d.notes)}
</table>`;
}

export function orderCustomerEmail(d: OrderEmailData, reference: string) {
  return layout({
    preview: "Your Foi's Kitchen order is in.",
    heading: `Thanks, ${d.name.split(" ")[0]} — your order is in.`,
    intro: "We'll confirm the total and delivery time shortly, then send an M-Pesa prompt. Here's your order:",
    body: body(d),
    reference,
  });
}

export function orderBusinessEmail(d: OrderEmailData, reference: string) {
  return layout({
    preview: `New order from ${d.name}`,
    heading: "New order",
    intro: "Reply to this email to confirm with the customer directly.",
    body: body(d),
    reference,
  });
}
