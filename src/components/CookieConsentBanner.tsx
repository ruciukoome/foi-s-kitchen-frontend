import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { readConsent, writeConsent, type ConsentChoice } from "@/lib/consent";

/** Small first-visit cookie notice. Renders after hydration only. */
export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!readConsent()) setShow(true);
  }, []);

  function choose(choice: ConsentChoice) {
    writeConsent(choice);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-gold/40 bg-card p-4 shadow-card md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <p className="text-[15px] text-foreground">
        We use a few essential cookies to keep your cart and sign-in working. Nothing else is
        tracked right now — if we ever add analytics, we'll only use it if you say yes.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="label-caps inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="label-caps inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-foreground/20 px-5 transition-colors duration-200 ease-out hover:border-primary hover:text-primary"
        >
          Reject
        </button>
        <Link
          to="/privacy"
          className="text-center text-sm font-semibold text-primary hover:underline sm:ml-1"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}
