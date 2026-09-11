import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { EmailField } from "@/components/EmailField";
import { FormAlert } from "@/components/FormAlert";
import { PageHeadingRow } from "@/components/PageHeadingRow";
import { useAuth } from "@/lib/auth";
import { mapAuthError, unavailableError, type AuthFieldErrors } from "@/lib/auth-errors";
import { primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Your Password — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Forgot your Foi's Kitchen password? Enter your email and we'll send you a secure link to set a new one.",
      },
      { property: "og:title", content: "Reset Your Password — Foi's Kitchen" },
      { property: "og:description", content: "We'll email you a secure password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { client } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    if (!client) {
      setErrors(unavailableError);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: "Please enter a valid email address." });
      return;
    }
    setBusy(true);
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setErrors(mapAuthError(error, "recover"));
    } finally {
      setBusy(false);
    }
  }


  return (
    <section className="container-page max-w-md pb-16 md:pb-24">
      <PageHeadingRow title="Forgot password" note="We'll email you a link to set a new one." />

      <div className="rounded-3xl border border-gold/40 bg-card p-6 shadow-card md:p-8">
        {sent ? (
          <div className="text-center">
            <h2 className="font-display text-xl font-bold">Check your email</h2>
            <p className="mt-3 text-muted-foreground">
              If an account exists for{" "}
              <strong className="text-foreground">{email}</strong>, a password reset link is on its
              way. The link expires after a short while.
            </p>
            <Link
              to="/sign-in"
              className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
              <FormAlert message={errors.form} />
              <EmailField
                id="fp-email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (errors.email || errors.form) setErrors({});
                }}
                error={errors.email}
              />

              <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                Send reset link
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/sign-in" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
