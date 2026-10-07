/**
 * Server-only security helpers shared by server functions.
 */
import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseAdmin } from "@/integrations/supabase-external/admin.server";

/** Verifies the access token belongs to an admin; returns the service client. */
export async function requireAdmin(accessToken: string) {
  const admin = getSupabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(accessToken);
  if (error || !userData.user) throw new Error("Not signed in");
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Admins only");
  return admin;
}

/** Best-effort client IP from the hosting edge headers. */
export function clientIp(): string {
  const h = (n: string) => getRequestHeader(n)?.split(",")[0]?.trim();
  return h("cf-connecting-ip") || h("x-nf-client-connection-ip") || h("x-real-ip") || h("x-forwarded-for") || "unknown";
}

/**
 * Counts one hit against `bucket` and returns false when over `max` hits in
 * `windowSeconds`. Backed by the hit_rate_limit() database function. If that
 * function isn't installed yet, it allows the request (logged) rather than
 * blocking real customers.
 */
export async function allowRequest(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("hit_rate_limit", {
      _bucket: bucket.slice(0, 200),
      _max: max,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("Rate limit check failed", e);
    return true;
  }
}

/** Applies an IP limit and a per-email limit for a public form. */
export async function allowPublicForm(kind: string, email: string): Promise<boolean> {
  const ip = clientIp();
  const [ipOk, emailOk] = await Promise.all([
    allowRequest(`${kind}:ip:${ip}`, 5, 600),
    allowRequest(`${kind}:email:${email.trim().toLowerCase()}`, 3, 3600),
  ]);
  return ipOk && emailOk;
}
