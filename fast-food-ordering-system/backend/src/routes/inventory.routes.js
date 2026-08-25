const express = require('express');
const {
  listItems,
  createItem,
  updateItem,
  adjustStock,
  listMovements,
  reconcile,
} = require('../controllers/inventory.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// Inventory levels are visible to admin + cashier (for 86'd items) + kitchen
router.get('/', requireAuth, requireRole('admin', 'cashier', 'kitchen'), listItems);
router.get('/movements', requireAuth, requireRole('admin'), listMovements);

// Mutations are admin-only
router.post('/', requireAuth, requireRole('admin'), createItem);
router.put('/:id', requireAuth, requireRole('admin'), updateItem);
router.post('/:id/adjust', requireAuth, requireRole('admin'), adjustStock);
router.post('/reconcile', requireAuth, requireRole('admin'), reconcile);

module.exports = router;
