import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { RequireAuth } from "@/components/RequireAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/services", label: "Services & tiers" },
  { to: "/admin/plans", label: "Meal plans" },
  { to: "/admin/testimonials", label: "Reviews" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/content", label: "Page text" },
  { to: "/admin/media", label: "Photo library" },
] as const;

/** Shared admin chrome: admin-only gate + the one navigation list. */
export function AdminShell({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <RequireAuth requireAdmin>
      <section className="container-page pb-16 md:pb-24">
        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 px-0.5 pt-[26px] pb-[14px]">
          <h1 className="font-serif-eyebrow">{title}</h1>
          {note && (
            <>
              <span className="font-serif-eyebrow-sub text-primary" aria-hidden="true">
                〜
              </span>
              <p className="font-serif-eyebrow-sub">{note}</p>
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Admin sections" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
              {links.map((l) => (
                <li key={l.to} className="shrink-0">
                  <Link
                    to={l.to}
                    activeOptions={{ exact: "exact" in l ? l.exact : false }}
                    className="block min-h-[44px] rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ease-out hover:border-primary hover:text-primary lg:rounded-xl"
                    activeProps={{ className: "border-primary bg-primary text-primary-foreground hover:text-primary-foreground" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={cn("min-w-0")}>{children}</div>
        </div>
      </section>
    </RequireAuth>
  );
}
