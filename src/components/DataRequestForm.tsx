import { useState } from "react";
import { toast } from "sonner";

import { site, waLink } from "@/lib/site";
import { fieldClass, outlineButtonClass, primaryButtonClass } from "@/lib/ui";

type RequestKind = "access" | "correction" | "deletion" | "marketing";

const kinds: { value: RequestKind; label: string; line: string }[] = [
  { value: "access", label: "See my data", line: "I'd like a copy of the personal data you hold about me." },
  { value: "correction", label: "Correct my data", line: "I'd like to correct some of the personal data you hold about me." },
  { value: "deletion", label: "Delete my data", line: "I'd like you to delete the personal data you hold about me." },
  { value: "marketing", label: "Stop marketing", line: "Please stop sending me marketing messages." },
];

/** Lets a customer send a data request by email or WhatsApp in one tap. */
export function DataRequestForm() {
  const [kind, setKind] = useState<RequestKind>("access");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const chosen = kinds.find((k) => k.value === kind)!;
  const body = [
    `Hi ${site.name},`,
    "",
    chosen.line,
    "",
    `Name: ${name || "(your name)"}`,
    `Email or phone on the account: ${contact || "(your email or phone)"}`,
  ].join("\n");

  function mailto() {
    if (!name || !contact) {
      toast.error("Please add your name and the email or phone on your account.");
      return;
    }
    const subject = `Data request — ${chosen.label}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function whatsapp() {
    if (!name || !contact) {
      toast.error("Please add your name and the email or phone on your account.");
      return;
    }
    window.open(waLink(body), "_blank", "noopener");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="dr-kind" className="label-caps text-xs">What do you need?</label>
        <select
          id="dr-kind"
          className={fieldClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as RequestKind)}
        >
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dr-name" className="label-caps text-xs">Your name</label>
        <input
          id="dr-name"
          className={fieldClass}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dr-contact" className="label-caps text-xs">Email or phone on your account</label>
        <input
          id="dr-contact"
          className={fieldClass}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={mailto} className={`${primaryButtonClass} sm:flex-1`}>
          Send by email
        </button>
        <button type="button" onClick={whatsapp} className={`${outlineButtonClass} sm:flex-1`}>
          Send on WhatsApp
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        We reply within 7 days and complete requests within 30 days.
      </p>
    </div>
  );
}
