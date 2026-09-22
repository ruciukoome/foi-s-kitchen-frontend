import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Mail, MessageCircle } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import {
  downloadCsv,
  toCsv,
  waNumberLink,
  type ContactRow,
  type SubscriberRow,
} from "@/lib/marketing";
import { site } from "@/lib/site";
import { fieldClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/marketing")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Customer Contacts — Foi's Kitchen" },
      { name: "description", content: "Customer emails and newsletter sign-ups for Foi's Kitchen." },
      { property: "og:title", content: "Customer Contacts — Foi's Kitchen" },
      { property: "og:description", content: "Internal marketing contact list." },
    ],
  }),
  component: AdminMarketingPage,
});

function AdminMarketingPage() {
  const { client } = useAuth();
  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [subs, setSubs] = useState<SubscriberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    void (async () => {
      const [c, s] = await Promise.all([
        client
          .from("profiles")
          .select("id, full_name, phone, email, marketing_opt_in, created_at")
          .order("created_at", { ascending: false }),
        client
          .from("newsletter_subscribers")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (c.error || s.error) setError((c.error ?? s.error)!.message);
      setContacts((c.data ?? []) as ContactRow[]);
      setSubs((s.data ?? []) as SubscriberRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const term = q.trim().toLowerCase();
  const filteredContacts = useMemo(
    () =>
      (contacts ?? []).filter((c) =>
        !term
          ? true
          : `${c.full_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`
              .toLowerCase()
              .includes(term),
      ),
    [contacts, term],
  );
  const filteredSubs = useMemo(
    () => (subs ?? []).filter((s) => (!term ? true : s.email.toLowerCase().includes(term))),
    [subs, term],
  );

  function exportAll() {
    const rows: string[][] = [["name", "email", "phone", "type", "joined"]];
    filteredContacts
      .filter((c) => c.email && c.marketing_opt_in !== false)
      .forEach((c) =>
        rows.push([c.full_name ?? "", c.email ?? "", c.phone ?? "", "customer", c.created_at]),
      );
    filteredSubs
      .filter((s) => s.is_active)
      .forEach((s) => rows.push([s.name ?? "", s.email, "", "subscriber", s.created_at]));
    downloadCsv("fois-kitchen-contacts.csv", toCsv(rows));
  }

  return (
    <AdminShell title="Customer contacts" note="Everyone you can reach out to.">
      {error && (
        <p className="mb-4 rounded-2xl border border-destructive/40 bg-card p-5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className={`${fieldClass} max-w-xs`}
          placeholder="Search name, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          onClick={exportAll}
          className="label-caps inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <h2 className="font-display text-lg font-semibold">
        Customers with accounts ({filteredContacts.length})
      </h2>
      {contacts === null && <p className="mt-2 text-muted-foreground">Loading…</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {filteredContacts.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="min-w-0">
              <p className="font-display font-semibold">{c.full_name || "No name yet"}</p>
              <p className="text-sm text-muted-foreground">{c.email ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{c.phone ?? "—"}</p>
              {c.marketing_opt_in === false && (
                <p className="text-sm text-destructive">Opted out of marketing</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
                  aria-label={`Email ${c.full_name ?? c.email}`}
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </a>
              )}
              {c.phone && (
                <a
                  href={waNumberLink(c.phone, `Hi from ${site.name}!`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
                  aria-label={`WhatsApp ${c.full_name ?? c.phone}`}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </a>
              )}
            </div>
          </li>
        ))}
        {contacts !== null && filteredContacts.length === 0 && (
          <li className="text-muted-foreground">No customers yet.</li>
        )}
      </ul>

      <h2 className="mt-10 font-display text-lg font-semibold">
        Newsletter sign-ups ({filteredSubs.length})
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {filteredSubs.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="min-w-0">
              <p className="font-display font-semibold">{s.email}</p>
              <p className="text-sm text-muted-foreground">
                {s.source}
                {s.is_active ? "" : " · unsubscribed"}
              </p>
            </div>
            <a
              href={`mailto:${s.email}`}
              className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
              aria-label={`Email ${s.email}`}
            >
              <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </li>
        ))}
        {subs !== null && filteredSubs.length === 0 && (
          <li className="text-muted-foreground">No sign-ups yet.</li>
        )}
      </ul>
    </AdminShell>
  );
}
