import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  const isSignUp = mode === "sign-up";

  async function routeByRole(userId: string) {
    if (!client) return navigate({ to: "/" });
    const { data } = await client
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (data?.is_admin) return navigate({ to: "/admin/orders" });
    return navigate({ to: "/" });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!client) {
      toast.error("Accounts aren't available right now. Please try again shortly.");
      return;
    }
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
        toast.success("Welcome! Add your name and phone anytime from My Account.");
        await routeByRole(data.session.user.id);
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        await routeByRole(data.user.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    if (!client) {
      toast.error("Accounts aren't available right now. Please try again shortly.");
      return;
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) toast.error(error.message);
  }

  if (sentConfirmation) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center shadow-card md:p-8">
        <h2 className="font-display text-xl font-bold">Check your email</h2>
        <p className="mt-3 text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open
          it to finish creating your account, then add your name and phone.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card md:p-8">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="a-email" className="label-caps text-xs">
            Email
          </label>
          <input
            id="a-email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="a-password" className="label-caps text-xs">
            Password
          </label>
          <input
            id="a-password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={6}
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-gold/40" />
        or
        <span className="h-px flex-1 bg-gold/40" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        className="label-caps inline-flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-input bg-background px-6 text-foreground transition-colors duration-200 ease-out hover:border-primary hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.5 5.5 0 0 1-2.4 3.61v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.74l4.01-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to Foi's Kitchen? "}
        <Link
          to={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-semibold text-primary hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
