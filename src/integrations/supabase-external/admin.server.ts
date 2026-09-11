import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for the connected external Supabase project.
 * SERVER ONLY — bypasses row level security. Import this inside a server
 * function handler with `await import(...)`, never at module scope of a
 * `*.functions.ts` file and never from a component.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env["EXT_SUPABASE_URL"];
  const serviceKey = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) {
    throw new Error("EXT_SUPABASE_URL / EXT_SUPABASE_SERVICE_ROLE_KEY are not configured");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
