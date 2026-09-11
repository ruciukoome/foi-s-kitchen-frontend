import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeadingRow } from "@/components/PageHeadingRow";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/lib/auth";
import { primaryButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a New Password — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content: "Choose a new password for your Foi's Kitchen account.",
      },
      { property: "og:title", content: "Set a New Password — Foi's Kitchen" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { client, session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  useEffect(() => {
    if (loading || session) return;
    // The recovery link establishes a session shortly after load; allow a grace period.
    const timer = setTimeout(() => setExpired(true), 4000);
    return () => clearTimeout(timer);
  }, [loading, session]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!client) {
      toast.error("Accounts aren't available right now. Please try again shortly.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Those passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      await navigate({ to: "/account", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-page max-w-md pb-16 md:pb-24">
      <PageHeadingRow title="New password" note="Choose something you'll remember." />

      <div className="rounded-3xl border border-gold/40 bg-card p-6 shadow-card md:p-8">
        {expired && !session ? (
          <div className="text-center">
            <h2 className="font-display text-xl font-bold">This link has expired</h2>
            <p className="mt-3 text-muted-foreground">
              Password reset links can only be used once, and only for a short time.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Send a new link
            </Link>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <PasswordField
              id="rp-password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint={
                password.length === 0
                  ? "Use at least 6 characters."
                  : password.length < 6
                    ? `${6 - password.length} more character${password.length === 5 ? "" : "s"} needed.`
                    : "Looks good."
              }
            />
            <PasswordField
              id="rp-confirm"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              error={mismatch ? "Those passwords don't match." : null}
            />
            <button
              type="submit"
              disabled={busy || mismatch || !session}
              className={`${primaryButtonClass} mt-1 w-full`}
            >
              Save new password
            </button>
            {!session ? (
              <p className="text-center text-sm text-muted-foreground">Checking your link…</p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
