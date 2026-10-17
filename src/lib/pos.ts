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