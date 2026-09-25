import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { site, waLink } from "@/lib/site";
import { useAuth } from "@/lib/auth";
import { sendQuoteEmail } from "@/lib/email.functions";

const eventTypes = [
  "Corporate event",
  "Wedding",
  "Private party",
  "Meal prep",
  "Other",
];

const budgets = ["Under KSh 50,000", "KSh 50,000 – 150,000", "KSh 150,000 – 400,000", "Above KSh 400,000"];

const fieldClass =
  "min-h-[48px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors duration-200 ease-out focus:border-primary";

export function QuoteForm({ context = "Quotation" }: { context?: string }) {
  const { user } = useAuth();
  const send = useServerFn(sendQuoteEmail);
  const [sending, setSending] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: eventTypes[0],
    date: "",
    guests: "",
    budget: "",
    notes: "",
    website: "",
  });

  useEffect(() => {
    if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email ?? "" }));
  }, [user]);

  const message = [
    `Hi ${site.name}, I'd like a quotation.`,
    `Request: ${context}`,
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
    `Event: ${form.eventType}`,
    `Date: ${form.date || "flexible"}`,
    `Guests: ${form.guests}`,
    form.budget ? `Budget: ${form.budget}` : "",
    form.notes ? `Notes: ${form.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function basicsOk() {
    if (!form.name || !form.phone) {
      toast.error("Please add your name and phone number.");
      return false;
    }
    return true;
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!basicsOk()) return;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please add your email so we can send you a copy.");
      return;
    }
    setSending(true);
    try {
      const res = await send({
        data: {
          ...form,
          context,
          eventType: form.eventType ?? "Other",
        },
      });
      if (res.ok) setSentRef(res.reference);
      else toast.error(res.error);
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setSending(false);
    }
  }

  function handleWhatsApp() {
    if (!basicsOk()) return;
    window.open(waLink(message), "_blank", "noopener");
    toast.success("Opening WhatsApp with your request…");
  }

  if (sentRef) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl font-bold">Got it — we'll be in touch.</h2>
        <p className="text-muted-foreground">
          A copy is on its way to {form.email}. Your reference is{" "}
          <strong className="text-primary">{sentRef}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmail} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="q-name" className="label-caps text-xs">Your name</label>
        <input id="q-name" className={fieldClass} autoComplete="name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-phone" className="label-caps text-xs">Phone</label>
        <input id="q-phone" type="tel" inputMode="tel" autoComplete="tel" className={fieldClass}
          placeholder="07xx xxx xxx" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-email" className="label-caps text-xs">
          Email <span className="font-normal normal-case text-muted-foreground">(needed to send by email)</span>
        </label>
        <input id="q-email" type="email" autoComplete="email" className={fieldClass}
          placeholder="you@email.com" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-type" className="label-caps text-xs">Event type</label>
        <select id="q-type" className={fieldClass} value={form.eventType}
          onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
          {eventTypes.map((t) => (<option key={t}>{t}</option>))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-date" className="label-caps text-xs">Event date</label>
        <input id="q-date" type="date" className={fieldClass} value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-guests" className="label-caps text-xs">Guest count</label>
        <input id="q-guests" type="number" inputMode="numeric" min={1} className={fieldClass}
          value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-budget" className="label-caps text-xs">
          Budget range <span className="font-normal normal-case text-muted-foreground">(optional)</span>
        </label>
        <select id="q-budget" className={fieldClass} value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}>
          <option value="">Prefer not to say</option>
          {budgets.map((b) => (<option key={b}>{b}</option>))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-notes" className="label-caps text-xs">Notes</label>
        <textarea id="q-notes" rows={4} className={`${fieldClass} min-h-[120px]`}
          placeholder="Menu ideas, dietary needs, venue…" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {/* Honeypot — hidden from people, bots fill it */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden"
        value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />

      <button type="submit" disabled={sending}
        className="label-caps flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60">
        {sending ? "Sending…" : "Send by email"}
      </button>

      <button type="button" onClick={handleWhatsApp}
        className="label-caps flex min-h-[48px] items-center justify-center rounded-full bg-whatsapp px-6 text-whatsapp-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]">
        Send on WhatsApp instead
      </button>
    </form>
  );
}
