import { useState } from "react";
import { toast } from "sonner";
import { site, waLink } from "@/lib/site";

const fieldClass =
  "min-h-[48px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors duration-200 ease-out focus:border-primary";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.message) {
      toast.error("Please add your name and a message.");
      return;
    }
    const text = `Hi ${site.name}!\nName: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`;
    window.open(waLink(text), "_blank", "noopener");
    toast.success("Opening WhatsApp with your message…");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="c-name" className="label-caps text-xs">Your name</label>
        <input
          id="c-name"
          className={fieldClass}
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-phone" className="label-caps text-xs">Phone</label>
        <input
          id="c-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={fieldClass}
          placeholder="07xx xxx xxx"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-message" className="label-caps text-xs">Message</label>
        <textarea
          id="c-message"
          rows={5}
          className={`${fieldClass} min-h-[140px]`}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
      </div>

      <button
        type="submit"
        className="label-caps flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
      >
        Send message
      </button>
    </form>
  );
}
