import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Newsletter sign-up through the server, so it can be rate limited. */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(200),
        source: z.string().trim().max(40).default("footer"),
        website: z.string().max(0).optional(), // honeypot
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { allowPublicForm } = await import("@/lib/admin-auth.server");
    if (!(await allowPublicForm("newsletter", data.email))) {
      return { ok: false, error: "Too many attempts. Please try again a little later." };
    }
    try {
      const { getSupabaseAdmin } = await import("@/integrations/supabase-external/admin.server");
      const { error } = await getSupabaseAdmin()
        .from("newsletter_subscribers")
        .upsert({ email: data.email, source: data.source }, { onConflict: "email", ignoreDuplicates: true });
      if (error) {
        console.error("Newsletter insert failed", error);
        return { ok: false, error: "That didn't go through. Please try again shortly." };
      }
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "That didn't go through. Please try again shortly." };
    }
  });
