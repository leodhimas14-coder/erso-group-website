const { InventoryItem, InventoryMovement } = require('../models/InventoryItem');
const { reconcileShift } = require('../services/inventory.service');

async function listItems(req, res, next) {
  try {
    const items = await InventoryItem.find().sort({ name: 1 });
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const item = await InventoryItem.create(req.body);
    return res.status(201).json({ item });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    return res.json({ item });
  } catch (err) {
    return next(err);
  }
}

/** Manual restock/adjustment entry point, distinct from automatic order deductions. */
async function adjustStock(req, res, next) {
  try {
    const { change, reason = 'manual_adjustment', note = '' } = req.body;
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantityOnHand: change } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    await InventoryMovement.create({
      item: item._id,
      change,
      reason,
      note,
      performedBy: req.user?.id,
    });

    return res.json({ item });
  } catch (err) {
    return next(err);
  }
}

async function listMovements(req, res, next) {
  try {
    const { itemId } = req.query;
    const filter = itemId ? { item: itemId } : {};
    const movements = await InventoryMovement.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.json({ movements });
  } catch (err) {
    return next(err);
  }
}

/** End-of-shift stock count reconciliation. Body: { counts: [{ itemId, countedQuantity }] } */
async function reconcile(req, res, next) {
  try {
    const results = await reconcileShift(req.body.counts || [], req.user?.id);
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listItems, createItem, updateItem, adjustStock, listMovements, reconcile };
