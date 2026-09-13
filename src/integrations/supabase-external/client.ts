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
  // AuthProvider handles the PKCE code explicitly so routing cannot win a
  // race against Supabase's background URL detection.
  detectSessionInUrl: false,
  flowType: "pkce",
} as const;

function cleanConfigValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function isValidPublicConfig(url: string, anonKey: string) {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const buildUrl = cleanConfigValue(
        import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined,
      );
      const buildAnonKey = cleanConfigValue(
        import.meta.env["VITE_EXT_SUPABASE_ANON_KEY"] as string | undefined,
      );

      if (
        buildUrl &&
        buildAnonKey &&
        (await isValidPublicConfig(buildUrl, buildAnonKey))
      ) {
        return createClient(buildUrl, buildAnonKey, { auth: { ...authOptions } });
      }

      try {
        const config = await getSupabasePublicConfig();
        const serverUrl = cleanConfigValue(config.url);
        const serverAnonKey = cleanConfigValue(config.anonKey);
        if (
          config.configured &&
          serverUrl &&
          serverAnonKey &&
          (await isValidPublicConfig(serverUrl, serverAnonKey))
        ) {
          return createClient(serverUrl, serverAnonKey, { auth: { ...authOptions } });
        }
      } catch {
        // Static hosts may not provide the server fallback. In that case the
        // build-time values above must be configured correctly.
      }

      return null;
    })();
  }
  return clientPromise;
}
