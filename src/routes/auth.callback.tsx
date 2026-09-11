import { useEffect } from "react";
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

/** Landing page after Google sign-in: routes admins to their orders view, everyone else home. */
function AuthCallbackPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect((): (() => void) | undefined => {
    if (loading) return undefined;
    if (!user) {
      void navigate({ to: "/sign-in", replace: true });
      return undefined;
    }
    // Profile may still be loading; wait briefly, then fall back to home.
    if (profile === null) {
      const fallback = setTimeout(() => void navigate({ to: "/", replace: true }), 4000);
      return () => clearTimeout(fallback);
    }
    if (profile.is_admin) void navigate({ to: "/admin/orders", replace: true });
    else void navigate({ to: "/", replace: true });
    return undefined;
  }, [user, profile, loading, navigate]);

  return (
    <div className="container-page py-20 text-center text-muted-foreground">
      Signing you in…
    </div>
  );
}
