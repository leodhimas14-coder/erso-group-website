const { InventoryItem, InventoryMovement } = require('../models/InventoryItem');
const { resolveIngredientUsage } = require('../models/Recipe');
const { emitInventoryLow } = require('../sockets/index');

/**
 * Deducts recipe ingredients for every line item in a paid order, records a
 * movement per ingredient for audit/reconciliation, and flags anything that
 * crosses its reorder threshold.
 */
async function deductForOrder(order, productsById) {
  const usageByIngredient = new Map();

  for (const item of order.items) {
    const product = productsById.get(String(item.product));
    if (!product) continue;

    for (const usage of resolveIngredientUsage(product, item)) {
      const key = String(usage.ingredient);
      usageByIngredient.set(key, (usageByIngredient.get(key) || 0) + usage.quantity);
    }
  }

  for (const [ingredientId, quantity] of usageByIngredient.entries()) {
    const item = await InventoryItem.findByIdAndUpdate(
      ingredientId,
      { $inc: { quantityOnHand: -quantity } },
      { new: true }
    );
    if (!item) continue;

    await InventoryMovement.create({
      item: item._id,
      change: -quantity,
      reason: 'order_deduction',
      order: order._id,
    });

    if (item.quantityOnHand <= item.reorderThreshold) {
      emitInventoryLow(item);
    }
  }
}

/** End-of-shift reconciliation: compares counted stock to system stock and logs the delta. */
async function reconcileShift(counts, performedBy) {
  const results = [];
  for (const { itemId, countedQuantity } of counts) {
    const item = await InventoryItem.findById(itemId);
    if (!item) continue;

    const delta = countedQuantity - item.quantityOnHand;
    if (delta !== 0) {
      item.quantityOnHand = countedQuantity;
      await item.save();
      await InventoryMovement.create({
        item: item._id,
        change: delta,
        reason: 'shift_reconciliation',
        performedBy,
      });
    }
    results.push({ itemId, delta, newQuantity: item.quantityOnHand });
  }
  return results;
}

module.exports = { deductForOrder, reconcileShift };
