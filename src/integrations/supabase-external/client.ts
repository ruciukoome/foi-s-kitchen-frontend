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
const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  // Required so the sign-in link/redirect that lands on /auth/callback is
  // turned into a real session instead of being ignored.
  detectSessionInUrl: true,
  flowType: "pkce",
} as const;

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    const url = import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined;
    const anonKey = import.meta.env["VITE_EXT_SUPABASE_ANON_KEY"] as string | undefined;

    clientPromise =
      url && anonKey
        ? Promise.resolve(createClient(url, anonKey, { auth: { ...authOptions } }))
        : getSupabasePublicConfig().then(({ url, anonKey, configured }) =>
            configured ? createClient(url, anonKey, { auth: { ...authOptions } }) : null,
          );
  }
  return clientPromise;
}
