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

/** Public Google Web client ID from the OAuth provider already configured in Supabase. */
export const getGoogleOAuthClientId = createServerFn({ method: "GET" })
  .inputValidator((data: { projectUrl: string }) => data)
  .handler(async ({ data }) => {
  const configuredUrl = process.env["EXT_SUPABASE_URL"];
  const requestedUrl = data.projectUrl?.trim();
  const url = configuredUrl || requestedUrl;
  if (!url) return { clientId: "" };

  try {
    const project = new URL(url);
    if (project.protocol !== "https:" || !project.hostname.endsWith(".supabase.co")) {
      return { clientId: "" };
    }
  } catch {
    return { clientId: "" };
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/auth/v1/authorize?provider=google&skip_http_redirect=true`,
      { redirect: "manual" },
    );
    const destination = response.headers.get("location");
    if (!destination) return { clientId: "" };
    return { clientId: new URL(destination).searchParams.get("client_id") ?? "" };
  } catch {
    return { clientId: "" };
  }
  });
