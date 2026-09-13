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

/** Human-readable reason why no client could be created (for support/debug). */
let configReason = "";

export function getSupabaseConfigReason() {
  return configReason;
}

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const candidates: Array<{ source: string; url: string; anonKey: string }> = [];

      const buildUrl = cleanConfigValue(
        import.meta.env["VITE_EXT_SUPABASE_URL"] as string | undefined,
      );
      const buildAnonKey = cleanConfigValue(
        import.meta.env["VITE_EXT_SUPABASE_ANON_KEY"] as string | undefined,
      );
      if (buildUrl && buildAnonKey) {
        candidates.push({ source: "build-time VITE_ variables", url: buildUrl, anonKey: buildAnonKey });
      }

      try {
        const config = await getSupabasePublicConfig();
        const serverUrl = cleanConfigValue(config.url);
        const serverAnonKey = cleanConfigValue(config.anonKey);
        if (config.configured && serverUrl && serverAnonKey) {
          candidates.push({ source: "server settings", url: serverUrl, anonKey: serverAnonKey });
        }
      } catch {
        // Static hosts may not provide the server fallback.
      }

      if (candidates.length === 0) {
        configReason =
          "No Supabase URL/anon key available. Set VITE_EXT_SUPABASE_URL and VITE_EXT_SUPABASE_ANON_KEY in the hosting environment.";
        return null;
      }

      for (const candidate of candidates) {
        if (await isValidPublicConfig(candidate.url, candidate.anonKey)) {
          configReason = "";
          return createClient(candidate.url, candidate.anonKey, { auth: { ...authOptions } });
        }
      }

      // None validated (bad key, or the check itself was blocked). Use the first
      // candidate anyway so Supabase can report the real error to the customer.
      const fallback = candidates[0]!;
      configReason = `Supabase rejected the ${fallback.source} (check the Project URL and anon key).`;
      return createClient(fallback.url, fallback.anonKey, { auth: { ...authOptions } });
    })();
  }
  return clientPromise;
}

