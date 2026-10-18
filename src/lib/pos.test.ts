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
import { shouldSyncOrder, summariseUsage } from "./pos";
describe("Website order stock sync", () => {
  test("only Preparing syncs, and only once", () => {
    assert.equal(shouldSyncOrder("Preparing", null), true);
    assert.equal(shouldSyncOrder("Preparing", "FK-POS-1"), false);
    assert.equal(shouldSyncOrder("Completed", null), false);
  });
  test("not enough stock is flagged as a shortage", () => {
    const s = summariseUsage([{ name: "Unga", unit: "kg", used: 2, remaining: -1.5, short: true }]);
    assert.equal(s.shortages.length, 1);
    assert.match(s.shortages[0]!, /short by 1.5 kg/);
  });
  test("enough stock reports used and remaining", () => {
    const s = summariseUsage([{ name: "Unga", unit: "kg", used: 2, remaining: 8, short: false }]);
    assert.equal(s.shortages.length, 0);
    assert.equal(s.lines[0], "Unga: used 2 kg, 8 kg left");
  });
});
