import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paystack webhook. Records successful payments even if the customer closes
 * the browser before the popup finishes. Paystack signs the raw body with
 * HMAC SHA-512 using the secret key. Only charge.success is acted on; database
 * errors return 500 so Paystack retries.
 */
async function resolveSecretKey(): Promise<string | null> {
  const env = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  if (env) return env;
  try {
    const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
    const { data } = await getSupabaseAdmin()
      .from("admin_settings")
      .select("value")
      .eq("key", "paystack_secret_key")
      .maybeSingle();
    return data?.value?.trim() || null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = await resolveSecretKey();
        if (!secret) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(raw).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          data?: {
            reference?: string;
            status?: string;
            amount?: number;
            currency?: string;
            channel?: string;
            customer?: { email?: string };
          };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        // Allowlist: everything else is acknowledged and ignored.
        if (event.event !== "charge.success" || !event.data?.reference) {
          return new Response("ignored");
        }

        try {
          const { reconcilePayment } = await import("@/lib/paystack-orders.server");
          const result = await reconcilePayment(event.data.reference, event.data);
          if (result.state === "mismatch") console.error("Webhook amount mismatch", event.data.reference);
          return new Response("ok");
        } catch (e) {
          console.error("Paystack webhook update failed", e);
          return new Response("Retry later", { status: 500 });
        }
      },
    },
  },
});
