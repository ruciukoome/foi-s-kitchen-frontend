import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import logo from "@/assets/logo.png";
import { EmailField } from "@/components/EmailField";
import { FormAlert } from "@/components/FormAlert";
import { PasswordField } from "@/components/PasswordField";
import { getGoogleOAuthClientId } from "@/integrations/supabase-external/config.functions";
import { useAuth } from "@/lib/auth";
import { mapAuthError, unavailableError, type AuthFieldErrors } from "@/lib/auth-errors";
import { primaryButtonClass } from "@/lib/ui";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleIdentityScriptPromise: Promise<void> | undefined;

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in did not load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in did not load."));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { client, user } = useAuth();
  const navigate = useNavigate();
  const loadGoogleClientId = useServerFn(getGoogleOAuthClientId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const oneTapStarted = useRef(false);

  const isSignUp = mode === "sign-up";
  const mismatch = isSignUp && confirmPassword.length > 0 && confirmPassword !== password;

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

  useEffect(() => {
    if (!client || user || oneTapStarted.current) return;
    oneTapStarted.current = true;
    let cancelled = false;

    async function showGoogleOneTap() {
      if (!client) return;
      const { clientId } = await loadGoogleClientId({
        data: {
          projectUrl: import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined,
        },
      });
      if (!clientId) return;

      await loadGoogleIdentityScript();
      if (cancelled || !window.google?.accounts.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        callback: (response) => {
          if (!response.credential || cancelled) return;
          setBusy(true);
          setErrors({});
          void client.auth
            .signInWithIdToken({ provider: "google", token: response.credential })
            .then(async ({ data: signInData, error: signInError }) => {
              if (signInError) throw signInError;
              toast.success(isSignUp ? "Account created." : "Signed in.");
              await routeByRole(signInData.user.id);
            })
            .catch((signInError: unknown) => {
              setErrors(mapAuthError(signInError, isSignUp ? "sign-up" : "sign-in"));
            })
            .finally(() => setBusy(false));
        },
      });
      window.google.accounts.id.prompt();
    }

    void showGoogleOneTap().catch(() => {
      // Google may suppress One Tap because of browser or origin settings.
      // The visible Google button below remains available in every case.
    });

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [client, isSignUp, loadGoogleClientId, user]);

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
    if (password.length === 0) {
      setErrors({ password: "Please enter your password." });
      return;
    }
    if (isSignUp && password.length < 6) {
      setErrors({ password: "Use at least 6 characters." });
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setErrors({ confirmPassword: "Those passwords don't match." });
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
      setErrors(mapAuthError(error, isSignUp ? "sign-up" : "sign-in"));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setErrors({});
    if (!client) {
      setErrors(unavailableError);
      return;
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setErrors(mapAuthError(error, isSignUp ? "sign-up" : "sign-in"));
  }


  if (sentConfirmation) {
    return (
      <div className="rounded-3xl border border-gold/40 bg-card p-6 text-center shadow-card md:p-8">
        <h2 className="font-display text-xl font-bold">Check your email</h2>
        <p className="mt-3 text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open
          it to finish creating your account, then add your name and phone.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-card">
      <div className="flex flex-col items-center gap-3 border-b border-gold/40 px-6 py-7 text-center md:px-8">
        <img src={logo} alt="Foi's Kitchen" className="h-12 w-auto" />
        <h2 className="font-display text-2xl font-bold">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          {isSignUp
            ? "Save your details once and check out in seconds next time."
            : "Sign in to see your saved details and follow your orders."}
        </p>
      </div>

      <div className="p-6 md:p-8">
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <FormAlert message={errors.form} />

          <EmailField
            id="a-email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              if (errors.email || errors.form) setErrors({});
            }}
            error={errors.email}
          />

          <PasswordField
            id="a-password"
            label="Password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (errors.password || errors.form) setErrors({});
            }}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            error={errors.password}
            hint={
              isSignUp
                ? password.length === 0
                  ? "Use at least 6 characters."
                  : password.length < 6
                    ? `${6 - password.length} more character${password.length === 5 ? "" : "s"} needed.`
                    : "Looks good."
                : undefined
            }
          />

          {isSignUp ? (
            <PasswordField
              id="a-confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              error={mismatch ? "Those passwords don't match." : errors.confirmPassword}
            />
          ) : null}


          {!isSignUp ? (
            <div className="-mt-1 text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy || mismatch}
            className={`${primaryButtonClass} mt-1 w-full`}
          >
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
    </div>
  );
}
