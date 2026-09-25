import { layout, row } from "./layout";

export type QuoteEmailData = {
  name: string;
  phone: string;
  email: string;
  context: string;
  eventType: string;
  date?: string | undefined;
  guests?: string | undefined;
  budget?: string | undefined;
  notes?: string | undefined;
};

function table(d: QuoteEmailData) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Request", d.context)}${row("Name", d.name)}${row("Phone", d.phone)}${row("Email", d.email)}
${row("Event", d.eventType)}${row("Date", d.date || "Flexible")}${row("Guests", d.guests)}${row("Budget", d.budget)}${row("Notes", d.notes)}
</table>`;
}

export function quoteCustomerEmail(d: QuoteEmailData, reference: string) {
  return layout({
    preview: "We've got your quotation request.",
    heading: `Thanks, ${d.name.split(" ")[0]} — we've got it.`,
    intro: "We'll come back with a menu and a price, usually the same day. Here's what you sent us:",
    body: table(d),
    reference,
  });
}

export function quoteBusinessEmail(d: QuoteEmailData, reference: string) {
  return layout({
    preview: `New quotation request from ${d.name}`,
    heading: "New quotation request",
    intro: "Reply to this email to answer the customer directly.",
    body: table(d),
    reference,
  });
}
