import { createFileRoute } from "@tanstack/react-router";

/** Minimal public health check: reports only whether the backend answers. */
export const Route = createFileRoute("/api/public/supabase-status")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["EXT_SUPABASE_URL"];
        const anonKey = process.env["EXT_SUPABASE_ANON_KEY"];
        if (!url || !anonKey) return Response.json({ ok: false }, { status: 503 });
        try {
          const headers: Record<string, string> = { apikey: anonKey };
          if (anonKey.split(".").length === 3) headers["Authorization"] = `Bearer ${anonKey}`;
          const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, { headers });
          return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 503 });
        } catch {
          return Response.json({ ok: false }, { status: 503 });
        }
      },
    },
  },
});
