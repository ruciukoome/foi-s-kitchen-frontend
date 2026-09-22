import { MapPin } from "lucide-react";

import { useSite } from "@/lib/site-info";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Geo-targeted local SEO block. Name, address and phone come from the CMS
 * business details (Admin → Page Text), so the NAP here always matches the
 * footer, contact page and the structured data in src/lib/seo.ts.
 */
export function ServiceArea({ className }: { className?: string }) {
  const info = useSite();

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 md:p-6", className)}>
      <div className="flex items-start gap-3">
        <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <h2 className="font-display text-lg font-semibold">Where we cook and deliver</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {site.name} cooks in {info.address} and serves Nairobi and the surrounding areas —
            Kilimani, Kileleshwa, Lavington, Westlands, Karen, Runda, Upper Hill, Parklands, South B
            and C, Syokimau and Ruiru. Catering further out? Ask us on WhatsApp.
          </p>
          <p className="mt-3 text-sm">
            <span className="font-semibold">{site.name}</span> ·{" "}
            <a href={`tel:${info.phoneTel}`} className="hover:text-primary">
              {info.phoneDisplay}
            </a>{" "}
            · {info.address}
          </p>
        </div>
      </div>
    </div>
  );
}
