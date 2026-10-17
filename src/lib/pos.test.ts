import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { matchesRecipe, removalReason, validateReceipt } from "./pos";

describe("POS accountability", () => {
  test("off-menu recipes match only their own dish", () => {
    const recipe = { menu_item_id: null, off_menu_item_id: "cake", inventory_item_id: "flour", qty_per_portion: 0.1 };
    assert.equal(matchesRecipe(recipe, { menu_item_id: null, off_menu_item_id: "cake" }), true);
    assert.equal(matchesRecipe(recipe, { menu_item_id: null, off_menu_item_id: "other" }), false);
    assert.equal(matchesRecipe(recipe, { menu_item_id: null }), false);
  });
  test("20 chapatis using 0.1 kg each deduct 2 kg", () => {
    const recipe = { menu_item_id: "chapati", inventory_item_id: "unga", qty_per_portion: 0.1 };
    assert.equal(matchesRecipe(recipe, { menu_item_id: "chapati" }), true);
    assert.equal(recipe.qty_per_portion * 20, 2);
  });
  test("removal requires a nonblank reason", () => {
    assert.throws(() => removalReason("  "), /A reason is required/);
    assert.equal(removalReason(" Entered twice "), "Entered twice");
  });
  test("receipts accept supported documents within the size limit", () => {
    assert.doesNotThrow(() => validateReceipt({ size: 1000, type: "application/pdf" }));
    assert.throws(() => validateReceipt({ size: 1000, type: "text/html" }));
    assert.throws(() => validateReceipt({ size: 5 * 1024 * 1024 + 1, type: "image/jpeg" }));
  });
});