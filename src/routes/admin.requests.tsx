import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { CardRow, Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { useAuth } from "@/lib/auth";
import { exactTime } from "@/lib/marketing";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/requests")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Data Requests — Foi's Kitchen" },
      { name: "description", content: "Track customer data access and deletion requests." },
      { property: "og:title", content: "Data Requests — Foi's Kitchen" },
      { property: "og:description", content: "Internal privacy request tracker." },
    ],
  }),
  component: AdminRequestsPage,
});

type Kind = "access" | "correction" | "deletion" | "marketing";
type Status = "new" | "in_progress" | "completed" | "rejected";
type Row = {
  id: string;
  kind: Kind;
  customer_name: string;
  customer_contact: string;
  channel: string;
  details: string | null;
  status: Status;
  assigned_to: string | null;
  received_at: string;
  due_at: string;
  completed_at: string | null;
  resolution_note: string | null;
};
type Admin = { id: string; full_name: string | null; email: string | null };

const kindLabel: Record<Kind, string> = {
  access: "See data",
  correction: "Correct data",
  deletion: "Delete data",
  marketing: "Stop marketing",
};
const statusLabel: Record<Status, string> = {
  new: "New",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Declined",
};
const tabs = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
] as const;

const empty = { kind: "access" as Kind, customer_name: "", customer_contact: "", channel: "email", details: "", received: "" };

function AdminRequestsPage() {
  const { client } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!client) return;
    const [r, a] = await Promise.all([
      client.from("data_requests").select("*").order("due_at", { ascending: true }),
      client.from("profiles").select("id, full_name, email").eq("is_admin", true),
    ]);
    if (r.error) setError(r.error.message);
    setRows((r.data ?? []) as Row[]);
    setAdmins((a.data ?? []) as Admin[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () =>
      (rows ?? []).filter((r) =>
        tab === "open" ? r.status === "new" || r.status === "in_progress" : r.status === "completed" || r.status === "rejected",
      ),
    [rows, tab],
  );
  const openCount = (rows ?? []).filter((r) => r.status === "new" || r.status === "in_progress").length;

  async function record(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    if (!form.customer_name.trim() || !form.customer_contact.trim()) {
      toast.error("Add the customer's name and email or phone.");
      return;
    }
    setSaving(true);
    const received = form.received ? new Date(form.received) : new Date();
    const due = new Date(received.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { error: err } = await client.from("data_requests").insert({
      kind: form.kind,
      customer_name: form.customer_name.trim(),
      customer_contact: form.customer_contact.trim(),
      channel: form.channel,
      details: form.details.trim() || null,
      received_at: received.toISOString(),
      due_at: due.toISOString(),
    });
    setSaving(false);
    if (err) return void toast.error(err.message);
    toast.success("Request recorded.");
    setForm(empty);
    setTab("open");
    await load();
  }

  async function update(id: string, values: Partial<Row>) {
    if (!client) return;
    const { error: err } = await client
      .from("data_requests")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) return void toast.error(err.message);
    toast.success("Saved.");
    await load();
  }

  return (
    <AdminShell title="Data requests" note="Access, correction and deletion requests — due within 30 days.">
      <div className="flex flex-col gap-6">
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-card p-4 text-sm text-destructive">
            {error.includes("data_requests")
              ? "The requests table isn't set up yet — run docs/data-requests-schema.sql in the SQL editor."
              : error}
          </p>
        )}

        <CardRow>
          <form onSubmit={record} className="grid gap-4 sm:grid-cols-2">
            <p className="font-display text-lg font-semibold sm:col-span-2">Record a new request</p>
            <Field label="Request type">
              <SelectInput value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
                {(Object.keys(kindLabel) as Kind[]).map((k) => (
                  <option key={k} value={k}>{kindLabel[k]}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Arrived by">
              <SelectInput value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </SelectInput>
            </Field>
            <Field label="Customer name">
              <TextInput value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </Field>
            <Field label="Email or phone on account">
              <TextInput value={form.customer_contact} onChange={(e) => setForm({ ...form, customer_contact: e.target.value })} />
            </Field>
            <Field label="Date received (blank = now)">
              <TextInput type="datetime-local" value={form.received} onChange={(e) => setForm({ ...form, received: e.target.value })} />
            </Field>
            <Field label="Details" className="sm:col-span-2">
              <TextArea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? "Saving…" : "Record request"}
              </button>
            </div>
          </form>
        </CardRow>

        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors duration-200 ease-out",
                tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
              )}
            >
              {t.label}
              {t.key === "open" && openCount > 0 ? ` (${openCount})` : ""}
            </button>
          ))}
        </div>

        {rows === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-muted-foreground">{tab === "open" ? "No open requests." : "Nothing closed yet."}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {shown.map((r) => (
              <RequestCard key={r.id} row={r} admins={admins} onUpdate={update} />
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function RequestCard({
  row,
  admins,
  onUpdate,
}: {
  row: Row;
  admins: Admin[];
  onUpdate: (id: string, values: Partial<Row>) => Promise<void>;
}) {
  const [note, setNote] = useState(row.resolution_note ?? "");
  const open = row.status === "new" || row.status === "in_progress";
  const daysLeft = Math.ceil((new Date(row.due_at).getTime() - Date.now()) / 86400000);
  const overdue = open && daysLeft < 0;

  return (
    <li>
      <CardRow>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-semibold">
              {kindLabel[row.kind]} · {row.customer_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.customer_contact} · via {row.channel} · received {exactTime(row.received_at)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              overdue ? "border-destructive text-destructive" : "border-border",
            )}
          >
            {open
              ? overdue
                ? `Overdue by ${-daysLeft} day${daysLeft === -1 ? "" : "s"}`
                : `${statusLabel[row.status]} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : `${statusLabel[row.status]}${row.completed_at ? ` · ${exactTime(row.completed_at)}` : ""}`}
          </span>
        </div>

        {row.details && <p className="mt-3 whitespace-pre-line">{row.details}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Assigned to">
            <SelectInput
              value={row.assigned_to ?? ""}
              onChange={(e) =>
                void onUpdate(row.id, {
                  assigned_to: e.target.value || null,
                  ...(row.status === "new" && e.target.value ? { status: "in_progress" as Status } : {}),
                })
              }
            >
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.email || "Admin"}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput
              value={row.status}
              onChange={(e) => {
                const status = e.target.value as Status;
                const closed = status === "completed" || status === "rejected";
                void onUpdate(row.id, { status, completed_at: closed ? new Date().toISOString() : null });
              }}
            >
              {(Object.keys(statusLabel) as Status[]).map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="What was done" className="sm:col-span-2">
            <TextArea
              value={note}
              placeholder="e.g. Sent data export by email; deleted account and saved carts."
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={outlineButtonClass} onClick={() => void onUpdate(row.id, { resolution_note: note || null })}>
            Save note
          </button>
          {open && (
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!note.trim()) return void toast.error("Add a short note of what was done first.");
                void onUpdate(row.id, { status: "completed", resolution_note: note, completed_at: new Date().toISOString() });
              }}
            >
              Mark complete
            </button>
          )}
        </div>
      </CardRow>
    </li>
  );
}
