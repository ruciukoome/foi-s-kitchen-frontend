import { createServerFn } from "@tanstack/react-start";

/**
 * Public (browser-safe) config for the externally connected Supabase project.
 * The values live in project secrets: EXT_SUPABASE_URL / EXT_SUPABASE_ANON_KEY.
 * The service_role key (EXT_SUPABASE_SERVICE_ROLE_KEY) is never returned here.
 */
export const getSupabasePublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["EXT_SUPABASE_URL"] ?? "";
  const anonKey = process.env["EXT_SUPABASE_ANON_KEY"] ?? "";
  return { url, anonKey, configured: Boolean(url && anonKey) };
});

/** Lightweight reachability check against the connected project's REST endpoint. */
export const checkSupabaseConnection = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["EXT_SUPABASE_URL"];
  const anonKey = process.env["EXT_SUPABASE_ANON_KEY"];
  const serviceKey = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !anonKey) {
    return { ok: false, status: 0, message: "Missing EXT_SUPABASE_URL or EXT_SUPABASE_ANON_KEY" };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    return {
      ok: res.ok,
      status: res.status,
      hasServiceRoleKey: Boolean(serviceKey),
      message: res.ok ? "Connected" : await res.text(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      hasServiceRoleKey: Boolean(serviceKey),
      message: error instanceof Error ? error.message : String(error),
    };
  }
});
