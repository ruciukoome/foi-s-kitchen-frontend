export type RecipeLink = { menu_item_id: string | null; off_menu_item_id?: string | null; inventory_item_id: string; qty_per_portion: number };
export type DishLink = { menu_item_id: string | null; off_menu_item_id?: string | null };

export function matchesRecipe(recipe: RecipeLink, dish: DishLink) {
  return dish.off_menu_item_id
    ? recipe.off_menu_item_id === dish.off_menu_item_id
    : Boolean(dish.menu_item_id && recipe.menu_item_id === dish.menu_item_id);
}

export function removalReason(value: string) {
  const reason = value.trim();
  if (!reason) throw new Error("A reason is required.");
  return reason;
}

export function validateReceipt(file: { size: number; type: string }) {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new Error("Choose a JPG, PNG, WebP or PDF receipt.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Receipts must be 5 MB or smaller.");
}

export type StockUsage = { name: string; unit: string; used: number; remaining: number; reorder_level?: number | null; short: boolean };
export type OrderSyncResult = { receipt_no: string; already: boolean; usage: StockUsage[]; no_recipe: string[] };

const n = (v: number) => Number(Number(v).toFixed(3)).toString();

/** Should moving an order to this status record it as a POS sale? */
export function shouldSyncOrder(status: string, receiptNo: string | null | undefined) {
  return status === "Preparing" && !receiptNo;
}

/** Splits a sync result into the shortage alert and the used/remaining summary. */
export function summariseUsage(usage: StockUsage[]) {
  const shortages = usage
    .filter((u) => u.short)
    .map((u) => `${u.name}: needed ${n(u.used)} ${u.unit}, short by ${n(-u.remaining)} ${u.unit}`);
  const low = usage
    .filter((u) => !u.short && u.reorder_level != null && u.remaining <= Number(u.reorder_level))
    .map((u) => `${u.name} is low (${n(u.remaining)} ${u.unit} left)`);
  const lines = usage.map((u) => `${u.name}: used ${n(u.used)} ${u.unit}, ${n(u.remaining)} ${u.unit} left`);
  return { shortages, low, lines };
}
