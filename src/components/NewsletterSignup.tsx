import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";

/** Small email capture box — feeds the admin marketing contact list. */
export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const { client } = useAuth();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      toast.error("Please tick the box so we know it's okay to email you.");
      return;
    }
    if (!client) {
      toast.error("We can't sign you up right now. Please try again shortly.");
      return;
    }
    setBusy(true);
    const { error } = await client
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source });
    setBusy(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("That didn't go through. Please try again shortly.");
      return;
    }
    setDone(true);
    toast.success("You're on the list — thank you!");
  }

  if (done) {
    return (
      <p className="text-sm opacity-80">
        You're on the list. We'll only send the good stuff.
      </p>
    );
  }

  return (
    <form onSubmit={subscribe} className="flex flex-col gap-2"><div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-[44px] w-full rounded-full border border-current/25 bg-transparent px-4 text-base outline-none transition-colors duration-200 ease-out placeholder:opacity-60 focus:border-primary"
      />
      <button
        type="submit"
        disabled={busy}
        className="label-caps inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
      >
        {busy ? "Signing up…" : "Sign up"}
      </button>
    </form>
  );
}
