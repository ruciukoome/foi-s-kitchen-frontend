import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LayoutGrid } from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Business",
    links: [
      { to: "/admin", label: "Overview", exact: true },
      { to: "/admin/orders", label: "Orders" },
      { to: "/admin/inventory", label: "Inventory" },
      { to: "/admin/carts", label: "Abandoned carts" },
      { to: "/admin/marketing", label: "Contacts" },
      { to: "/admin/requests", label: "Data requests" },
    ],
  },
  {
    label: "Website content",
    links: [
      { to: "/admin/menu", label: "Menu" },
      { to: "/admin/services", label: "Services & tiers" },
      { to: "/admin/plans", label: "Meal plans" },
      { to: "/admin/testimonials", label: "Reviews" },
      { to: "/admin/gallery", label: "Gallery" },
      { to: "/admin/content", label: "Page text" },
      { to: "/admin/media", label: "Photo library" },
    ],
  },
  {
    label: "Setup",
    links: [{ to: "/admin/settings", label: "Email settings" }],
  },
] as const;

type NavLink = { to: string; label: string; exact?: boolean };
const allLinks: NavLink[] = groups.flatMap((g) => g.links as readonly NavLink[]);

function isActive(pathname: string, l: NavLink) {
  const path = pathname.replace(/\/$/, "") || "/";
  return l.exact ? path === l.to : path === l.to || path.startsWith(l.to + "/");
}

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const current = allLinks.find((l) => isActive(pathname, l));

  useEffect(() => setOpen(false), [pathname]);

  const linkClass =
    "flex min-h-[44px] items-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ease-out hover:border-primary hover:text-primary";
  const activeClass = "border-primary bg-primary text-primary-foreground hover:text-primary-foreground";

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

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
          {/* Phones & tablets: one button that opens a grouped section menu */}
          <nav aria-label="Admin sections" className="lg:hidden">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 text-left transition-colors duration-200 ease-out hover:border-primary"
            >
              <span className="flex min-w-0 items-center gap-3">
                <LayoutGrid className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Admin section</span>
                  <span className="block truncate font-display text-[15px] font-semibold">
                    {current?.label ?? "Choose a section"}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 transition-transform duration-200 ease-out", open && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            {open && (
              <div
                id="admin-mobile-nav"
                className="mt-2 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200"
              >
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="label-caps mb-2 text-xs text-muted-foreground">{g.label}</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {g.links.map((l) => (
                        <li key={l.to} className="min-w-0">
                          <Link
                            to={l.to}
                            className={cn(linkClass, "h-full", isActive(pathname, l) && activeClass)}
                          >
                            <span className="truncate">{l.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* Desktop: sticky sidebar */}
          <nav aria-label="Admin sections" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="flex flex-col gap-4">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="label-caps mb-2 px-1 text-xs text-muted-foreground">{g.label}</p>
                  <ul className="flex flex-col gap-2">
                    {g.links.map((l) => (
                      <li key={l.to}>
                        <Link to={l.to} className={cn(linkClass, isActive(pathname, l) && activeClass)}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </RequireAuth>
  );
}
