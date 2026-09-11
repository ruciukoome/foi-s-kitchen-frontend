import { useState } from "react";
import { toast } from "sonner";
import { site, waLink } from "@/lib/site";

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
  const [form, setForm] = useState({
    name: "",
    phone: "",
    eventType: eventTypes[0],
    date: "",
    guests: "",
    budget: "",
    notes: "",
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please add your name and phone number.");
      return;
    }
    window.open(waLink(message), "_blank", "noopener");
    toast.success("Opening WhatsApp with your request…");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="q-name" className="label-caps text-xs">Your name</label>
        <input
          id="q-name"
          className={fieldClass}
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-phone" className="label-caps text-xs">Phone</label>
        <input
          id="q-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={fieldClass}
          placeholder="07xx xxx xxx"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-type" className="label-caps text-xs">Event type</label>
        <select
          id="q-type"
          className={fieldClass}
          value={form.eventType}
          onChange={(e) => setForm({ ...form, eventType: e.target.value })}
        >
          {eventTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-date" className="label-caps text-xs">Event date</label>
        <input
          id="q-date"
          type="date"
          className={fieldClass}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-guests" className="label-caps text-xs">Guest count</label>
        <input
          id="q-guests"
          type="number"
          inputMode="numeric"
          min={1}
          className={fieldClass}
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-budget" className="label-caps text-xs">
          Budget range <span className="font-normal normal-case text-muted-foreground">(optional)</span>
        </label>
        <select
          id="q-budget"
          className={fieldClass}
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        >
          <option value="">Prefer not to say</option>
          {budgets.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="q-notes" className="label-caps text-xs">Notes</label>
        <textarea
          id="q-notes"
          rows={4}
          className={`${fieldClass} min-h-[120px]`}
          placeholder="Menu ideas, dietary needs, venue…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="label-caps flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
      >
        Send my request
      </button>

      <a
        href={`mailto:${site.email}?subject=${encodeURIComponent(`Quotation request — ${context}`)}&body=${encodeURIComponent(message)}`}
        className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
      >
        Prefer email? Send it to {site.email}
      </a>
    </form>
  );
}
