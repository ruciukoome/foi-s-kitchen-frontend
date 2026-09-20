import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import {
  cartSummary,
  exactTime,
  reminderText,
  timeAgo,
  waNumberLink,
  type CartRow,
} from "@/lib/marketing";
import { currency, site } from "@/lib/site";

export const Route = createFileRoute("/admin/carts")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Abandoned Carts — Foi's Kitchen" },
      { name: "description", content: "Carts left behind, ready for a friendly reminder." },
      { property: "og:title", content: "Abandoned Carts — Foi's Kitchen" },
      { property: "og:description", content: "Internal follow-up list." },
    ],
  }),
  component: AdminCartsPage,
});

function AdminCartsPage() {
  const { client } = useAuth();
  const [carts, setCarts] = useState<CartRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oldestFirst, setOldestFirst] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    void client
      .from("abandoned_carts")
      .select("*")
      .eq("status", "active")
      .order("last_active_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setCarts((data ?? []) as CartRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const ordered = carts
    ? (oldestFirst ? [...carts].reverse() : carts)
    : null;

  return (
    <AdminShell title="Abandoned carts" note="Carts left behind — send a gentle nudge.">
      {error && (
        <p className="mb-4 rounded-2xl border border-destructive/40 bg-card p-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && ordered === null && <p className="text-muted-foreground">Loading…</p>}
      {!error && ordered?.length === 0 && (
        <p className="text-muted-foreground">No carts waiting right now.</p>
      )}

      {ordered && ordered.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="label-caps text-muted-foreground">Sort by time:</span>
          <button
            type="button"
            onClick={() => setOldestFirst(false)}
            className={`label-caps min-h-[44px] rounded-full px-4 transition-colors ${
              oldestFirst
                ? "border border-border hover:border-primary hover:text-primary"
                : "bg-primary text-primary-foreground"
            }`}
          >
            Freshest first
          </button>
          <button
            type="button"
            onClick={() => setOldestFirst(true)}
            className={`label-caps min-h-[44px] rounded-full px-4 transition-colors ${
              oldestFirst
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            Oldest first
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {ordered?.map((c) => {
          const message = reminderText(c);
          return (
            <li
              key={c.id}
              className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Last edited {exactTime(c.last_active_at)}
                  <span aria-hidden="true"> · </span>
                  {timeAgo(c.last_active_at)}
                </p>
                <p className="mt-1 font-display font-semibold">
                  {c.customer_name || "Unnamed visitor"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[c.customer_phone, c.customer_email].filter(Boolean).join(" · ") || "No contact details"}
                </p>
                <p className="mt-2">{cartSummary(c.items)}</p>
                <p className="mt-1 font-display font-bold text-primary">
                  {currency(Number(c.total))}
                  {c.method ? ` · ${c.method}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {c.customer_phone && (
                  <a
                    href={waNumberLink(c.customer_phone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-caps inline-flex min-h-[44px] items-center gap-2 rounded-full bg-whatsapp px-4 text-whatsapp-foreground transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Remind
                  </a>
                )}
                {c.customer_email && (
                  <a
                    href={`mailto:${c.customer_email}?subject=${encodeURIComponent(
                      `Your ${site.name} order`,
                    )}&body=${encodeURIComponent(message)}`}
                    className="label-caps inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-4 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Email
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
