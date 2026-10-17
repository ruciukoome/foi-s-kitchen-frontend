import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Field, SelectInput, TextInput } from "@/components/admin/Fields";
import { useAuth } from "@/lib/auth";
import { downloadCsv, toCsv } from "@/lib/marketing";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { InventoryPanel } from "./admin.inventory";

export const Route = createFileRoute("/admin/pos")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Point of sale — Foi's Kitchen" },
      { name: "description", content: "Record sales, deduct ingredients automatically and keep receipts." },
      { property: "og:title", content: "Point of sale — Foi's Kitchen" },
      { property: "og:description", content: "Internal point of sale for Foi's Kitchen." },
    ],
  }),
  component: PosPage,
});

type Dish = { id: string; name: string; price: number; category: string };
type Ing = { id: string; name: string; unit: string; quantity: number; created_at: string; is_active: boolean };
type Recipe = { id: string; menu_item_id: string; inventory_item_id: string; qty_per_portion: number };
type SaleItem = { name: string; unit_price: number; quantity: number };
type Sale = {
  id: string;
  receipt_no: string;
  sold_at: string;
  payment_method: string;
  channel: string;
  customer: string | null;
  total: number;
  logged_by_name: string | null;
  pos_sale_items: SaleItem[];
};
type Line = { key: string; menu_item_id: string | null; name: string; unit_price: number; quantity: number };

const PAYMENTS = ["Cash", "M-Pesa", "Card", "Bank", "Other"] as const;
const CHANNELS = ["Walk-in", "Phone / WhatsApp", "Website", "Event", "Other"] as const;
const TABS = [
  { id: "sell", label: "New sale" },
  { id: "sales", label: "Sales & receipts" },
  { id: "recipes", label: "Recipes" },
  { id: "stock", label: "Stock" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;
const num = (n: number) => Number(n).toLocaleString("en-KE", { maximumFractionDigits: 3 });
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const when = (s: string) =>
  new Date(s).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });

function PosPage() {
  const { client } = useAuth();
  const [tab, setTab] = useState<Tab>("sell");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ings, setIngs] = useState<Ing[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    const [d, i, r, s] = await Promise.all([
      client.from("menu_items").select("id, name, price, category").order("name"),
      client.from("inventory_items").select("id, name, unit, quantity, created_at, is_active").order("name"),
      client.from("pos_recipes").select("*"),
      client
        .from("pos_sales")
        .select("*, pos_sale_items(name, unit_price, quantity)")
        .order("sold_at", { ascending: false })
        .limit(500),
    ]);
    const err = r.error ?? s.error;
    setError(err ? "The point-of-sale tables aren't set up yet — run docs/pos-schema.sql once." : null);
    setDishes((d.data ?? []) as Dish[]);
    setIngs((i.data ?? []) as Ing[]);
    setRecipes((r.data ?? []) as Recipe[]);
    setSales((s.data ?? []) as Sale[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const m = new Date();
    const t = sales.filter((s) => new Date(s.sold_at).toDateString() === today);
    const month = sales.filter((s) => {
      const d = new Date(s.sold_at);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });
    return {
      today: t.reduce((a, s) => a + Number(s.total), 0),
      todayCount: t.length,
      month: month.reduce((a, s) => a + Number(s.total), 0),
      low: ings.filter((i) => i.is_active && Number(i.quantity) <= 0).length,
    };
  }, [sales, ings]);

  return (
    <AdminShell title="Point of sale" note="Sell, deduct ingredients, keep every receipt.">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Sales today", ksh(stats.today)],
            ["Receipts today", String(stats.todayCount)],
            ["This month", ksh(stats.month)],
            ["Out of stock", String(stats.low)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-border bg-card p-4">
              <p className="label-caps text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 font-display text-xl font-bold text-primary">{v}</p>
            </div>
          ))}
        </div>

        <div role="tablist" aria-label="Point of sale" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-[44px] shrink-0 rounded-full border px-5 text-sm font-semibold transition-colors duration-200 ease-out",
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary hover:text-primary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && tab !== "stock" && (
          <p className="rounded-xl border border-destructive/40 bg-card p-4 text-sm text-destructive">{error}</p>
        )}

        {tab === "sell" && <SellTab dishes={dishes} ings={ings} recipes={recipes} onSaved={load} />}
        {tab === "sales" && <SalesTab sales={sales} />}
        {tab === "recipes" && <RecipesTab dishes={dishes} ings={ings} recipes={recipes} onChange={load} />}
        {tab === "stock" && <InventoryPanel />}
      </div>
    </AdminShell>
  );
}

function SellTab({
  dishes,
  ings,
  recipes,
  onSaved,
}: {
  dishes: Dish[];
  ings: Ing[];
  recipes: Recipe[];
  onSaved: () => Promise<void>;
}) {
  const { client } = useAuth();
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [soldAt, setSoldAt] = useState(nowLocal);
  const [payment, setPayment] = useState<string>("M-Pesa");
  const [channel, setChannel] = useState<string>("Walk-in");
  const [customer, setCustomer] = useState("");
  const [custom, setCustom] = useState({ name: "", price: "" });
  const [busy, setBusy] = useState(false);

  const shown = dishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  const total = lines.reduce((a, l) => a + l.unit_price * l.quantity, 0);
  const ingById = new Map(ings.map((i) => [i.id, i]));

  const deductions = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of lines) {
      if (!l.menu_item_id) continue;
      for (const r of recipes.filter((x) => x.menu_item_id === l.menu_item_id)) {
        m.set(r.inventory_item_id, (m.get(r.inventory_item_id) ?? 0) + Number(r.qty_per_portion) * l.quantity);
      }
    }
    return [...m.entries()];
  }, [lines, recipes]);

  const addDish = (d: Dish) =>
    setLines((ls) => {
      const hit = ls.find((l) => l.menu_item_id === d.id);
      if (hit) return ls.map((l) => (l === hit ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { key: d.id, menu_item_id: d.id, name: d.name, unit_price: Number(d.price), quantity: 1 }];
    });
  const setQty = (key: string, q: number) =>
    setLines((ls) => (q <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, quantity: q } : l))));

  async function save() {
    if (!client || lines.length === 0) return;
    setBusy(true);
    const { data, error } = await client.rpc("pos_record_sale", {
      _items: lines.map(({ menu_item_id, name, unit_price, quantity }) => ({ menu_item_id, name, unit_price, quantity })),
      _sold_at: new Date(soldAt).toISOString(),
      _payment: payment,
      _channel: channel,
      _customer: customer,
      _note: null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Sale saved — receipt ${data as string}`);
    setLines([]);
    setCustomer("");
    setSoldAt(nowLocal());
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        <TextInput placeholder="Search dishes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => addDish(d)}
              className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 ease-out hover:border-primary active:scale-[0.98]"
            >
              <span className="font-display text-sm font-semibold leading-tight">{d.name}</span>
              <span className="mt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-primary">{ksh(d.price)}</span>
                {recipes.some((r) => r.menu_item_id === d.id) && (
                  <span className="text-xs text-muted-foreground">recipe ✓</span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps mb-3 text-xs">Off-menu item</p>
          <div className="flex flex-wrap gap-2">
            <TextInput
              className="flex-1 min-w-[160px]"
              placeholder="e.g. Birthday cake"
              value={custom.name}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            />
            <TextInput
              className="w-32"
              type="number"
              min={0}
              placeholder="KSh"
              value={custom.price}
              onChange={(e) => setCustom({ ...custom, price: e.target.value })}
            />
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => {
                if (!custom.name.trim() || !(Number(custom.price) >= 0)) return;
                setLines((ls) => [
                  ...ls,
                  { key: crypto.randomUUID(), menu_item_id: null, name: custom.name.trim(), unit_price: Number(custom.price), quantity: 1 },
                ]);
                setCustom({ name: "", price: "" });
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
        <p className="font-display text-lg font-semibold">This sale</p>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tap a dish to add it.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{ksh(l.unit_price * l.quantity)}</p>
                </div>
                <button type="button" aria-label="Less" onClick={() => setQty(l.key, l.quantity - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-border">
                  {l.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </button>
                <input
                  aria-label={`Quantity of ${l.name}`}
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => setQty(l.key, Math.floor(Number(e.target.value)) || 0)}
                  className="h-11 w-14 rounded-xl border border-input bg-card text-center text-base"
                />
                <button type="button" aria-label="More" onClick={() => setQty(l.key, l.quantity + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-border">
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {deductions.length > 0 && (
          <div className="rounded-xl bg-secondary/60 p-3 text-sm">
            <p className="label-caps mb-1 text-xs">Will be taken from stock</p>
            <ul>
              {deductions.map(([id, q]) => {
                const i = ingById.get(id);
                const short = i && q > Number(i.quantity);
                return (
                  <li key={id} className={cn(short && "text-destructive")}>
                    {num(q)} {i?.unit} {i?.name ?? "item"}
                    {short && ` (only ${num(i!.quantity)} left)`}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Field label="Date & time sold">
          <TextInput type="datetime-local" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment">
            <SelectInput value={payment} onChange={(e) => setPayment(e.target.value)}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </SelectInput>
          </Field>
          <Field label="Sold via">
            <SelectInput value={channel} onChange={(e) => setChannel(e.target.value)}>
              {CHANNELS.map((p) => <option key={p}>{p}</option>)}
            </SelectInput>
          </Field>
        </div>
        <Field label="Customer (optional)">
          <TextInput value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </Field>
        <div className="flex items-baseline justify-between border-t border-gold pt-3">
          <span className="label-caps text-xs">Total</span>
          <span className="font-display text-2xl font-bold text-primary">{ksh(total)}</span>
        </div>
        <button type="button" disabled={busy || lines.length === 0} onClick={save} className={primaryButtonClass}>
          {busy ? "Saving…" : "Complete sale"}
        </button>
      </aside>
    </div>
  );
}

function printReceipt(s: Sale) {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) return;
  const rows = s.pos_sale_items
    .map((i) => `<tr><td>${i.quantity} × ${i.name.replace(/</g, "&lt;")}</td><td style="text-align:right">${ksh(i.unit_price * i.quantity)}</td></tr>`)
    .join("");
  w.document.write(`<html><head><title>${s.receipt_no}</title></head><body style="font-family:sans-serif;padding:16px">
<h2 style="margin:0">Foi's Kitchen</h2><p>Receipt ${s.receipt_no}<br>${when(s.sold_at)}<br>${s.payment_method} · ${s.channel}</p>
<table style="width:100%">${rows}</table><hr><p><b>Total ${ksh(s.total)}</b></p><p>Thank you!</p></body></html>`);
  w.document.close();
  w.print();
}

function SalesTab({ sales }: { sales: Sale[] }) {
  const [q, setQ] = useState("");
  const shown = sales.filter((s) =>
    [s.receipt_no, s.customer ?? "", s.payment_method, s.logged_by_name ?? "", ...s.pos_sale_items.map((i) => i.name)]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <TextInput className="flex-1 min-w-[200px]" placeholder="Search receipt, dish, customer or payment…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button
          type="button"
          className={outlineButtonClass}
          onClick={() =>
            downloadCsv(
              "pos-sales.csv",
              toCsv(
                shown.map((s) => ({
                  receipt: s.receipt_no,
                  sold_at: s.sold_at,
                  items: s.pos_sale_items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
                  payment: s.payment_method,
                  channel: s.channel,
                  customer: s.customer ?? "",
                  total: s.total,
                  by: s.logged_by_name ?? "",
                })),
              ),
            )
          }
        >
          Export CSV
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0">
                <p className="font-display font-semibold">{s.receipt_no}</p>
                <p className="text-sm text-muted-foreground">
                  {when(s.sold_at)} · {s.payment_method} · {s.channel}
                  {s.customer ? ` · ${s.customer}` : ""}
                </p>
                <p className="mt-1 text-sm">{s.pos_sale_items.map((i) => `${num(i.quantity)} × ${i.name}`).join(", ")}</p>
                {s.logged_by_name && <p className="text-xs text-muted-foreground">By {s.logged_by_name}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-primary">{ksh(s.total)}</span>
                <button type="button" aria-label={`Print ${s.receipt_no}`} onClick={() => printReceipt(s)} className="grid h-11 w-11 place-items-center rounded-full border border-border hover:border-primary hover:text-primary">
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecipesTab({
  dishes,
  ings,
  recipes,
  onChange,
}: {
  dishes: Dish[];
  ings: Ing[];
  recipes: Recipe[];
  onChange: () => Promise<void>;
}) {
  const { client } = useAuth();
  const [dishId, setDishId] = useState("");
  const [ingId, setIngId] = useState("");
  const [amount, setAmount] = useState("");
  const ingById = new Map(ings.map((i) => [i.id, i]));
  const mine = recipes.filter((r) => r.menu_item_id === dishId);
  const dish = dishes.find((d) => d.id === dishId);

  async function add() {
    if (!client || !dishId || !ingId || !(Number(amount) > 0)) return toast.error("Pick an ingredient and amount.");
    const { error } = await client
      .from("pos_recipes")
      .upsert({ menu_item_id: dishId, inventory_item_id: ingId, qty_per_portion: Number(amount) }, { onConflict: "menu_item_id,inventory_item_id" });
    if (error) return toast.error(error.message);
    setIngId("");
    setAmount("");
    await onChange();
  }
  async function remove(id: string) {
    if (!client) return;
    const { error } = await client.from("pos_recipes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await onChange();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Say what one portion uses — e.g. 1 chapati = 0.1 kg unga. Each sale then deducts it automatically.
        </p>
        <Field label="Dish">
          <SelectInput value={dishId} onChange={(e) => setDishId(e.target.value)}>
            <option value="">Choose a dish…</option>
            {dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectInput>
        </Field>
        {dish && (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {mine.length === 0 && <li className="py-2 text-sm text-muted-foreground">No ingredients yet.</li>}
              {mine.map((r) => {
                const i = ingById.get(r.inventory_item_id);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      {num(r.qty_per_portion)} {i?.unit} {i?.name} <span className="text-muted-foreground">per portion</span>
                    </span>
                    <button type="button" aria-label="Remove ingredient" onClick={() => remove(r.id)} className="grid h-11 w-11 place-items-center rounded-full hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
              <SelectInput value={ingId} onChange={(e) => setIngId(e.target.value)}>
                <option value="">Ingredient…</option>
                {ings.filter((i) => i.is_active).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </SelectInput>
              <TextInput type="number" min={0} step="any" placeholder="Per portion" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button type="button" onClick={add} className={primaryButtonClass}>Add ingredient</button>
          </>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-display font-semibold">Ingredients in stock</p>
        <p className="mb-3 text-xs text-muted-foreground">Add new ones in the Stock tab.</p>
        <ul className="flex flex-col divide-y divide-border text-sm">
          {ings.filter((i) => i.is_active).map((i) => (
            <li key={i.id} className="flex justify-between gap-2 py-2">
              <span>
                {i.name}
                <span className="block text-xs text-muted-foreground">Added {new Date(i.created_at).toLocaleDateString("en-KE")}</span>
              </span>
              <span className={cn("font-semibold", Number(i.quantity) <= 0 && "text-destructive")}>
                {num(i.quantity)} {i.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
