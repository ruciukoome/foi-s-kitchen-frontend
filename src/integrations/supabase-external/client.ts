import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "./config.functions";

let clientPromise: Promise<SupabaseClient | null> | undefined;

/**
 * Browser Supabase client for the connected external project.
 *
 * Public config comes from build-time VITE_ variables first (needed for
 * static/Netlify deploys, where Lovable's server secrets don't exist).
 * When those are absent — e.g. the Lovable preview — it falls back to the
 * server function that reads the project secrets.
 */
export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    const url = import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined;
    const anonKey = import.meta.env["VITE_EXT_SUPABASE_ANON_KEY"] as string | undefined;

    clientPromise =
      url && anonKey
        ? Promise.resolve(
            createClient(url, anonKey, {
              auth: { persistSession: true, autoRefreshToken: true },
            }),
          )
        : getSupabasePublicConfig().then(({ url, anonKey, configured }) =>
            configured
              ? createClient(url, anonKey, {
                  auth: { persistSession: true, autoRefreshToken: true },
                })
              : null,
          );
  }
  return clientPromise;
}
