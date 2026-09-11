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
          const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          });
          return Response.json({
            configured: true,
            hasServiceRoleKey,
            ok: res.ok,
            status: res.status,
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
