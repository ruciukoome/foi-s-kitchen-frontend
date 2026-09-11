import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";

/** Client-side gate: sends signed-out visitors to /sign-in. */
export function RequireAuth({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const blocked = !loading && !user;
  const notAdmin = requireAdmin && !loading && Boolean(user) && profile !== null && !profile.is_admin;

  useEffect(() => {
    if (blocked) void navigate({ to: "/sign-in", replace: true });
    else if (notAdmin) void navigate({ to: "/", replace: true });
  }, [blocked, notAdmin, navigate]);

  if (loading || blocked || notAdmin) {
    return (
      <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (requireAdmin && !profile) {
    return (
      <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  return <>{children}</>;
}
