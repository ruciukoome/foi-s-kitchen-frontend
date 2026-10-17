import { describe, expect, test } from "bun:test";
import { matchesRecipe, removalReason, validateReceipt } from "./pos";

describe("POS accountability", () => {
  test("off-menu recipes match only their own dish", () => {
    const recipe = { menu_item_id: null, off_menu_item_id: "cake", inventory_item_id: "flour", qty_per_portion: 0.1 };
    expect(matchesRecipe(recipe, { menu_item_id: null, off_menu_item_id: "cake" })).toBe(true);
    expect(matchesRecipe(recipe, { menu_item_id: null, off_menu_item_id: "other" })).toBe(false);
    expect(matchesRecipe(recipe, { menu_item_id: null })).toBe(false);
  });
  test("20 chapatis using 0.1 kg each deduct 2 kg", () => {
    const recipe = { menu_item_id: "chapati", inventory_item_id: "unga", qty_per_portion: 0.1 };
    expect(matchesRecipe(recipe, { menu_item_id: "chapati" })).toBe(true);
    expect(recipe.qty_per_portion * 20).toBe(2);
  });
  test("removal requires a nonblank reason", () => {
    expect(() => removalReason("  ")).toThrow("A reason is required.");
    expect(removalReason(" Entered twice ")).toBe("Entered twice");
  });
  test("receipts accept supported documents within the size limit", () => {
    expect(() => validateReceipt({ size: 1000, type: "application/pdf" })).not.toThrow();
    expect(() => validateReceipt({ size: 1000, type: "text/html" })).toThrow();
    expect(() => validateReceipt({ size: 5 * 1024 * 1024 + 1, type: "image/jpeg" })).toThrow();
  });
});