import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "./config.functions";

let clientPromise: Promise<SupabaseClient | null> | undefined;

/**
 * Browser Supabase client for the connected external project.
 * Config is fetched once from the server (the keys live in project secrets),
 * then cached for the lifetime of the page.
 */
export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = getSupabasePublicConfig().then(({ url, anonKey, configured }) =>
      configured
        ? createClient(url, anonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
          })
        : null,
    );
  }
  return clientPromise;
}
