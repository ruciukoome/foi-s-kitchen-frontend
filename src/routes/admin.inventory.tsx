import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { CardRow, Field, SelectInput, TextArea, TextInput } from "@/components/admin/Fields";
import { useAuth } from "@/lib/auth";
import { downloadCsv, exactTime, toCsv } from "@/lib/marketing";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventory")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Inventory — Foi's Kitchen" },
      { name: "description", content: "Check stock in and out and keep a full record of every movement." },
      { property: "og:title", content: "Inventory — Foi's Kitchen" },
      { property: "og:description", content: "Internal stock and inventory tracker." },
    ],
  }),
  component: InventoryPage,
});

const CATEGORIES = ["Proteins", "Fresh produce", "Starches", "Dry store", "Spices", "Drinks", "Packaging", "Other"] as const;
const UNITS = ["kg", "g", "L", "ml", "pcs", "packs", "trays", "bags"] as const;
const OUT_REASONS = [
  "Meal prep batch",
  "Catering / event",
  "Daily kitchen cooking",
  "Spoiled / expired",
  "Damaged",
  "Staff / tasting",
  "Other",
] as const;
const WASTE = new Set(["Spoiled / expired", "Damaged"]);

type Item = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  avg_cost: number;
  supplier: string | null;
  is_active: boolean;
};
type Tx = {
  id: string;
  item_id: string;
  kind: "in" | "out" | "adjust";
  reason: string;
  quantity: number;
  balance_after: number;
  unit_cost: number | null;
  supplier: string | null;
  batch: string | null;
  expiry_date: string | null;
  reference: string | null;
  note: string | null;
  logged_by_name: string | null;
  created_at: string;
};
type Mode = "in" | "out" | "adjust";

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;
const qty = (n: number) => Number(n).toLocaleString("en-KE", { maximumFractionDigits: 2 });

function stockState(i: Item) {
  if (Number(i.quantity) <= 0) return { label: "Out of stock", cls: "bg-destructive/10 text-destructive" };
  if (Number(i.quantity) <= Number(i.reorder_level)) return { label: "Low stock", cls: "bg-gold/20 text-foreground" };
  return { label: "In stock", cls: "bg-secondary text-foreground" };
}

const emptyItem = { id: "", name: "", category: "Proteins", unit: "kg", reorder_level: "", supplier: "" };
const emptyMove = { reason: "", quantity: "", unit_cost: "", supplier: "", batch: "", expiry: "", reference: "", note: "" };

function InventoryPage() {
  const { client } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"stock" | "ledger">("stock");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [ledgerKind, setLedgerKind] = useState<"all" | Mode | "waste">("all");
  const [itemForm, setItemForm] = useState<typeof emptyItem | null>(null);
  const [move, setMove] = useState<{ mode: Mode; itemId: string } | null>(null);
  const [moveForm, setMoveForm] = useState(emptyMove);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!client) return;
    const [i, t] = await Promise.all([
      client.from("inventory_items").select("*").order("name"),
      client.from("inventory_transactions").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (i.error) setError(i.error.message);
    else setError(null);
    setItems((i.data ?? []) as Item[]);
    setTxs((t.data ?? []) as Tx[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map((items ?? []).map((i) => [i.id, i])), [items]);
  const active = useMemo(() => (items ?? []).filter((i) => i.is_active), [items]);

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const value = active.reduce((s, i) => s + Number(i.quantity) * Number(i.avg_cost), 0);
    const low = active.filter((i) => Number(i.quantity) <= Number(i.reorder_level)).length;
    const waste = txs
      .filter((t) => t.kind === "out" && WASTE.has(t.reason) && new Date(t.created_at) >= monthStart)
      .reduce((s, t) => s + Math.abs(Number(t.quantity)) * Number(t.unit_cost ?? 0), 0);
    return { value, low, count: active.length, waste };
  }, [active, txs]);

  const shownItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter(
      (i) => (cat === "All" || i.category === cat) && (!q || i.name.toLowerCase().includes(q)),
    );
  }, [active, search, cat]);

  const shownTxs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txs.filter((t) => {
      if (ledgerKind === "waste" ? !(t.kind === "out" && WASTE.has(t.reason)) : ledgerKind !== "all" && t.kind !== ledgerKind)
        return false;
      if (!q) return true;
      const name = byId.get(t.item_id)?.name ?? "";
      return [name, t.reason, t.reference, t.note, t.logged_by_name].some((v) => v?.toLowerCase().includes(q));
    });
  }, [txs, ledgerKind, search, byId]);

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !itemForm) return;
    if (!itemForm.name.trim()) return void toast.error("Give the item a name.");
    setBusy(true);
    const values = {
      name: itemForm.name.trim(),
      category: itemForm.category,
      unit: itemForm.unit,
      reorder_level: Number(itemForm.reorder_level) || 0,
      supplier: itemForm.supplier.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = itemForm.id
      ? await client.from("inventory_items").update(values).eq("id", itemForm.id)
      : await client.from("inventory_items").insert(values);
    setBusy(false);
    if (err) return void toast.error(err.message);
    toast.success(itemForm.id ? "Item updated." : "Item added. Check in some stock to get started.");
    setItemForm(null);
    await load();
  }

  async function archive(i: Item) {
    if (!client) return;
    if (!confirm(`Hide "${i.name}" from the stock list? Its history stays in the record.`)) return;
    const { error: err } = await client.from("inventory_items").update({ is_active: false }).eq("id", i.id);
    if (err) return void toast.error(err.message);
    toast.success("Item hidden.");
    await load();
  }

  function openMove(mode: Mode, itemId = "") {
    setMove({ mode, itemId: itemId || active[0]?.id || "" });
    setMoveForm({ ...emptyMove, reason: mode === "in" ? "Stock received" : mode === "out" ? OUT_REASONS[0] : "Stock take" });
    setItemForm(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitMove(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !move) return;
    const amount = Number(moveForm.quantity);
    if (!move.itemId) return void toast.error("Choose an item.");
    if (!moveForm.quantity || Number.isNaN(amount)) return void toast.error("Enter a quantity.");
    if (move.mode === "adjust" && !moveForm.note.trim()) return void toast.error("Add a note explaining the count.");
    setBusy(true);
    const { error: err } = await client.rpc("inventory_move", {
      _item_id: move.itemId,
      _kind: move.mode,
      _reason: moveForm.reason,
      _quantity: amount,
      _unit_cost: moveForm.unit_cost ? Number(moveForm.unit_cost) : null,
      _supplier: moveForm.supplier || null,
      _batch: moveForm.batch || null,
      _expiry: moveForm.expiry || null,
      _reference: moveForm.reference || null,
      _note: moveForm.note || null,
    });
    setBusy(false);
    if (err) return void toast.error(err.message);
    toast.success(move.mode === "in" ? "Stock checked in." : move.mode === "out" ? "Stock checked out." : "Count recorded.");
    setMove(null);
    await load();
  }

  function exportLedger() {
    const rows = [
      ["Date", "Item", "Type", "Reason", "Change", "Unit", "Balance after", "Unit cost (KSh)", "Supplier", "Batch", "Expiry", "Reference", "Note", "Logged by"],
      ...shownTxs.map((t) => {
        const it = byId.get(t.item_id);
        return [
          new Date(t.created_at).toLocaleString("en-KE"),
          it?.name ?? "",
          t.kind,
          t.reason,
          String(t.quantity),
          it?.unit ?? "",
          String(t.balance_after),
          t.unit_cost != null ? String(t.unit_cost) : "",
          t.supplier ?? "",
          t.batch ?? "",
          t.expiry_date ?? "",
          t.reference ?? "",
          t.note ?? "",
          t.logged_by_name ?? "",
        ];
      }),
    ];
    downloadCsv(`foi-inventory-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  }

  const moveItem = move ? byId.get(move.itemId) : undefined;
  const pill = (on: boolean) =>
    cn(
      "label-caps min-h-[44px] rounded-full border px-4 text-xs transition-colors duration-200 ease-out",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary hover:text-primary",
    );

  return (
    <AdminShell title="Inventory" note="Check stock in and out — every movement is on record.">
      <div className="flex flex-col gap-6">
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-card p-4 text-sm text-destructive">
            {error.includes("inventory")
              ? "The inventory tables aren't set up yet — run docs/inventory-schema.sql in the SQL editor."
              : error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Stock value", value: ksh(stats.value) },
            { label: "Low or out", value: String(stats.low), warn: stats.low > 0 },
            { label: "Items tracked", value: String(stats.count) },
            { label: "Wastage this month", value: ksh(stats.waste) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 font-display text-xl font-semibold", s.warn && "text-primary")}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryButtonClass} onClick={() => openMove("in")} disabled={!active.length}>
            + Check in
          </button>
          <button type="button" className={outlineButtonClass} onClick={() => openMove("out")} disabled={!active.length}>
            − Check out
          </button>
          <button type="button" className={outlineButtonClass} onClick={() => openMove("adjust")} disabled={!active.length}>
            Stock take
          </button>
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              setItemForm(emptyItem);
              setMove(null);
            }}
          >
            New item
          </button>
        </div>

        {move && (
          <CardRow>
            <form onSubmit={submitMove} className="flex flex-col gap-4">
              <p className="font-display text-lg font-semibold">
                {move.mode === "in" ? "Check stock in" : move.mode === "out" ? "Check stock out" : "Stock take (physical count)"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Item">
                  <SelectInput value={move.itemId} onChange={(e) => setMove({ ...move, itemId: e.target.value })}>
                    {active.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({qty(i.quantity)} {i.unit})
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label={move.mode === "adjust" ? `Counted quantity (${moveItem?.unit ?? ""})` : `Quantity (${moveItem?.unit ?? ""})`}>
                  <TextInput
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={moveForm.quantity}
                    onChange={(e) => setMoveForm({ ...moveForm, quantity: e.target.value })}
                    required
                  />
                </Field>
                {move.mode === "out" && (
                  <Field label="Reason">
                    <SelectInput value={moveForm.reason} onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}>
                      {OUT_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </SelectInput>
                  </Field>
                )}
                {move.mode === "in" && (
                  <>
                    <Field label="Price per unit (KSh)">
                      <TextInput
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={moveForm.unit_cost}
                        onChange={(e) => setMoveForm({ ...moveForm, unit_cost: e.target.value })}
                      />
                    </Field>
                    <Field label="Supplier / market">
                      <TextInput
                        value={moveForm.supplier}
                        placeholder={moveItem?.supplier ?? "e.g. City Market"}
                        onChange={(e) => setMoveForm({ ...moveForm, supplier: e.target.value })}
                      />
                    </Field>
                    <Field label="Batch number (optional)">
                      <TextInput value={moveForm.batch} onChange={(e) => setMoveForm({ ...moveForm, batch: e.target.value })} />
                    </Field>
                    <Field label="Best before (optional)">
                      <TextInput type="date" value={moveForm.expiry} onChange={(e) => setMoveForm({ ...moveForm, expiry: e.target.value })} />
                    </Field>
                  </>
                )}
                {move.mode === "out" && (
                  <Field label="Order, quote or event reference (optional)">
                    <TextInput
                      value={moveForm.reference}
                      placeholder="e.g. FK-O-261003-AB12 or Kamau wedding"
                      onChange={(e) => setMoveForm({ ...moveForm, reference: e.target.value })}
                    />
                  </Field>
                )}
              </div>
              {move.mode === "adjust" && moveItem && moveForm.quantity !== "" && (
                <p className="text-sm text-muted-foreground">
                  System shows {qty(moveItem.quantity)} {moveItem.unit}. Difference:{" "}
                  <span className="font-semibold text-foreground">
                    {qty(Number(moveForm.quantity) - Number(moveItem.quantity))} {moveItem.unit}
                  </span>
                </p>
              )}
              <Field label={move.mode === "adjust" ? "Note (required)" : "Note (optional)"}>
                <TextArea value={moveForm.note} onChange={(e) => setMoveForm({ ...moveForm, note: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button type="button" className={outlineButtonClass} onClick={() => setMove(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </CardRow>
        )}

        {itemForm && (
          <CardRow>
            <form onSubmit={saveItem} className="flex flex-col gap-4">
              <p className="font-display text-lg font-semibold">{itemForm.id ? "Edit item" : "New item"}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput
                    value={itemForm.name}
                    placeholder="e.g. Goat meat"
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Category">
                  <SelectInput value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Unit">
                  <SelectInput value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}>
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Warn me when below">
                  <TextInput
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={itemForm.reorder_level}
                    onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                  />
                </Field>
                <Field label="Usual supplier (optional)" className="sm:col-span-2">
                  <TextInput value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  {busy ? "Saving…" : "Save item"}
                </button>
                <button type="button" className={outlineButtonClass} onClick={() => setItemForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </CardRow>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className={pill(view === "stock")} onClick={() => setView("stock")}>
            Stock
          </button>
          <button type="button" className={pill(view === "ledger")} onClick={() => setView("ledger")}>
            History
          </button>
        </div>

        <TextInput
          type="search"
          placeholder={view === "stock" ? "Search items" : "Search item, reason, reference or person"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {view === "stock" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {["All", ...CATEGORIES].map((c) => (
                <button key={c} type="button" className={pill(cat === c)} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
            {items === null ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : shownItems.length === 0 ? (
              <p className="text-muted-foreground">No items yet. Tap "New item" to add your first one.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {shownItems.map((i) => {
                  const s = stockState(i);
                  return (
                    <CardRow key={i.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-base font-semibold">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {i.category}
                            {i.supplier ? ` · ${i.supplier}` : ""}
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>
                      </div>
                      <p className="mt-3 font-display text-2xl font-semibold">
                        {qty(i.quantity)} <span className="text-base font-normal text-muted-foreground">{i.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Warn below {qty(i.reorder_level)} {i.unit} · avg {ksh(i.avg_cost)}/{i.unit} · value{" "}
                        {ksh(Number(i.quantity) * Number(i.avg_cost))}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className={cn(outlineButtonClass, "px-4")} onClick={() => openMove("in", i.id)}>
                          In
                        </button>
                        <button type="button" className={cn(outlineButtonClass, "px-4")} onClick={() => openMove("out", i.id)}>
                          Out
                        </button>
                        <button type="button" className={cn(outlineButtonClass, "px-4")} onClick={() => openMove("adjust", i.id)}>
                          Count
                        </button>
                        <button
                          type="button"
                          className={cn(outlineButtonClass, "px-4")}
                          onClick={() => {
                            setMove(null);
                            setItemForm({
                              id: i.id,
                              name: i.name,
                              category: i.category,
                              unit: i.unit,
                              reorder_level: String(i.reorder_level),
                              supplier: i.supplier ?? "",
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className={cn(outlineButtonClass, "px-4")} onClick={() => void archive(i)}>
                          Hide
                        </button>
                      </div>
                    </CardRow>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["all", "All"],
                  ["in", "Checked in"],
                  ["out", "Checked out"],
                  ["waste", "Wastage"],
                  ["adjust", "Stock takes"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" className={pill(ledgerKind === k)} onClick={() => setLedgerKind(k)}>
                  {l}
                </button>
              ))}
              <button type="button" className={cn(outlineButtonClass, "ml-auto")} onClick={exportLedger} disabled={!shownTxs.length}>
                Export CSV
              </button>
            </div>
            {shownTxs.length === 0 ? (
              <p className="text-muted-foreground">No movements yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shownTxs.map((t) => {
                  const it = byId.get(t.item_id);
                  const sign = Number(t.quantity) > 0 ? "+" : "";
                  return (
                    <li key={t.id}>
                      <CardRow>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display font-semibold">{it?.name ?? "Removed item"}</p>
                          <p className={cn("font-display font-semibold", Number(t.quantity) < 0 ? "text-primary" : "text-foreground")}>
                            {sign}
                            {qty(t.quantity)} {it?.unit}
                          </p>
                        </div>
                        <p className="text-sm">
                          {t.reason} · balance {qty(t.balance_after)} {it?.unit}
                          {t.unit_cost != null && t.kind === "in" ? ` · ${ksh(t.unit_cost)}/${it?.unit ?? "unit"}` : ""}
                        </p>
                        {(t.supplier || t.batch || t.expiry_date || t.reference) && (
                          <p className="text-xs text-muted-foreground">
                            {[
                              t.supplier && `From ${t.supplier}`,
                              t.batch && `Batch ${t.batch}`,
                              t.expiry_date && `Best before ${t.expiry_date}`,
                              t.reference && `Ref ${t.reference}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {t.note && <p className="mt-1 text-sm text-muted-foreground">“{t.note}”</p>}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {exactTime(t.created_at)} · by {t.logged_by_name ?? "admin"}
                        </p>
                      </CardRow>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
