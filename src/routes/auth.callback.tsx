import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Foi's Kitchen Nairobi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

/**
 * Landing page after Google sign-in / email confirmation.
 *
 * Supabase finishes the sign-in in the background (it swaps the code in the
 * URL for a session), so we must NOT bounce to /sign-in the moment there is
 * no user yet — that was sending people straight back to the sign-in page.
 * We wait for the session, and only give up after a grace period.
 */
function AuthCallbackPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [gaveUp, setGaveUp] = useState(false);

  // Grace period for the session exchange to complete.
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect((): (() => void) | undefined => {
    if (loading) return undefined;

    if (!user) {
      const errorInUrl =
        typeof window !== "undefined" &&
        (window.location.hash.includes("error") || window.location.search.includes("error"));
      if (errorInUrl || gaveUp) {
        void navigate({ to: "/sign-in", replace: true });
      }
      return undefined;
    }

    // Signed in. Profile may still be loading; wait briefly, then go home.
    if (profile === null) {
      const fallback = setTimeout(() => void navigate({ to: "/", replace: true }), 4000);
      return () => clearTimeout(fallback);
    }

    if (profile.is_admin) void navigate({ to: "/admin/orders", replace: true });
    else void navigate({ to: "/", replace: true });
    return undefined;
  }, [user, profile, loading, gaveUp, navigate]);

  return (
    <div className="container-page py-20 text-center text-muted-foreground">Signing you in…</div>
  );
}
