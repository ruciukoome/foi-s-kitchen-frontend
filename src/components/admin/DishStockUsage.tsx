import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SelectInput, TextInput } from "@/components/admin/Fields";
import { useAuth } from "@/lib/auth";
import { outlineButtonClass } from "@/lib/ui";

type Ing = { id: string; name: string; unit: string; quantity: number };
type Row = { id: string; inventory_item_id: string; qty_per_portion: number };

/** Per-portion stock usage for one menu dish; each sold portion deducts these amounts. */
export function DishStockUsage({ menuItemId }: { menuItemId: string }) {
  const { client } = useAuth();
  const [ings, setIngs] = useState<Ing[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [ingId, setIngId] = useState("");
  const [amount, setAmount] = useState("");

  async function load() {
    if (!client) return;
    const [i, r] = await Promise.all([
      client.from("inventory_items").select("id, name, unit, quantity").eq("is_active", true).order("name"),
      client.from("pos_recipes").select("id, inventory_item_id, qty_per_portion").eq("menu_item_id", menuItemId),
    ]);
    if (i.error || r.error) return setUnavailable(true);
    setIngs((i.data ?? []) as Ing[]);
    setRows((r.data ?? []) as Row[]);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, menuItemId]);

  async function add() {
    if (!client || !ingId || !(Number(amount) > 0)) return void toast.error("Pick a stock item and an amount.");
    const { error } = await client
      .from("pos_recipes")
      .upsert({ menu_item_id: menuItemId, inventory_item_id: ingId, qty_per_portion: Number(amount) }, { onConflict: "menu_item_id,inventory_item_id" });
    if (error) return void toast.error(error.message);
    setIngId("");
    setAmount("");
    toast.success("Stock usage saved.");
    await load();
  }
  async function remove(id: string) {
    if (!client) return;
    const { error } = await client.from("pos_recipes").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    await load();
  }

  if (unavailable) return <p className="text-sm text-muted-foreground md:col-span-2">Stock usage appears once the Point of sale is set up.</p>;
  const byId = new Map(ings.map((i) => [i.id, i]));

  return (
    <div className="md:col-span-2 rounded-xl border border-border p-4">
      <span className="label-caps text-xs">Stock used per portion</span>
      <p className="mt-1 text-sm text-muted-foreground">Deducted automatically when an order of this dish is marked Preparing.</p>
      <ul className="mt-2 flex flex-col divide-y divide-border">
        {rows?.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nothing set yet.</li>}
        {rows?.map((r) => {
          const i = byId.get(r.inventory_item_id);
          return (
            <li key={r.id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span>
                {r.qty_per_portion} {i?.unit} {i?.name ?? "Removed item"}{" "}
                <span className="text-muted-foreground">· {i ? `${Number(i.quantity)} ${i.unit} in stock` : ""}</span>
              </span>
              <button type="button" aria-label="Remove" onClick={() => void remove(r.id)} className="grid h-11 w-11 place-items-center rounded-full hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_100px_auto] gap-2">
        <SelectInput value={ingId} onChange={(e) => setIngId(e.target.value)} aria-label="Stock item">
          <option value="">Stock item…</option>
          {ings.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </SelectInput>
        <TextInput type="number" min={0} step="any" placeholder="Amount" aria-label="Amount per portion" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button type="button" className={outlineButtonClass} onClick={() => void add()}>Add</button>
      </div>
    </div>
  );
}
