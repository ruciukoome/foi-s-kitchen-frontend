import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { getGoogleOAuthClientId } from "@/integrations/supabase-external/config.functions";
import { useAuth } from "@/lib/auth";
import { loadGoogleIdentityScript } from "@/lib/google-identity";

/** Pages that render their own Google button, or where a prompt would intrude. */
const SKIPPED_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/admin",
];

/**
 * Shows Google's One Tap prompt on any page for visitors who are not signed in.
 * Signing in through the prompt keeps the visitor exactly where they are.
 */
export function GoogleOneTap() {
  const { client, user, loading, refreshProfile } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const loadGoogleClientId = useServerFn(getGoogleOAuthClientId);
  const started = useRef(false);

  const skipped = SKIPPED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (!client || user || loading || skipped || started.current) return;
    started.current = true;
    let cancelled = false;

    async function showOneTap() {
      if (!client) return;
      const { clientId } = await loadGoogleClientId({
        data: {
          projectUrl: (import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined) ?? "",
        },
      });
      if (!clientId || cancelled) return;

      await loadGoogleIdentityScript();
      if (cancelled || !window.google?.accounts.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        itp_support: true,
        auto_select: false,
        callback: (response) => {
          if (!response.credential || cancelled) return;
          void client.auth
            .signInWithIdToken({ provider: "google", token: response.credential })
            .then(async ({ error }) => {
              if (error) throw error;
              await refreshProfile();
              toast.success("Signed in. You're right where you left off.");
            })
            .catch(() => {
              toast.error("We couldn't sign you in with Google. Please try again.");
            });
        },
      });

      window.google.accounts.id.prompt();
    }

    void showOneTap().catch(() => {
      // Google can suppress the prompt (browser settings, origin rules, recent
      // dismissal). The Sign in page always remains available.
    });

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [client, loading, loadGoogleClientId, refreshProfile, skipped, user]);

  return null;
}
