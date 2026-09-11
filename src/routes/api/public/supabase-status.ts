import { createFileRoute } from "@tanstack/react-router";

/** Read-only health check for the connected external Supabase project. */
export const Route = createFileRoute("/api/public/supabase-status")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["EXT_SUPABASE_URL"];
        const anonKey = process.env["EXT_SUPABASE_ANON_KEY"];
        const hasServiceRoleKey = Boolean(process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"]);

        if (!url || !anonKey) {
          return Response.json({
            configured: false,
            hasServiceRoleKey,
            message: "Missing EXT_SUPABASE_URL or EXT_SUPABASE_ANON_KEY",
          });
        }

        try {
          // New-format publishable keys (sb_publishable_...) are not JWTs and must
          // be sent as `apikey` only — a Bearer header makes PostgREST reject them.
          const isJwt = anonKey.split(".").length === 3;
          const headers: Record<string, string> = { apikey: anonKey };
          if (isJwt) headers["Authorization"] = `Bearer ${anonKey}`;
          // /auth/v1/health accepts the anon/publishable key; /rest/v1/ root is service_role only.
          const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, { headers });
          return Response.json({
            configured: true,
            hasServiceRoleKey,
            ok: res.ok,
            status: res.status,
            ...(res.ok ? {} : { detail: (await res.text()).slice(0, 300) }),
          });
        } catch (error) {
          return Response.json({
            configured: true,
            hasServiceRoleKey,
            ok: false,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
  },
});
