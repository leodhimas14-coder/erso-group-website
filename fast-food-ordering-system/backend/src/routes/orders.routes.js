const express = require('express');
const {
  createOrder,
  createPaymentForOrder,
  markOrderPaid,
  updateOrderStatus,
  updateOrderItemStatus,
  listOrders,
  getOrder,
} = require('../controllers/orders.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// Kiosk/website customers and cashiers can all place orders
router.post('/', createOrder);
router.get('/', requireAuth, requireRole('admin', 'cashier', 'kitchen'), listOrders);
router.get('/:id', getOrder);

router.post('/:id/payment-intent', createPaymentForOrder);
router.post('/:id/mark-paid', requireAuth, requireRole('admin', 'cashier'), markOrderPaid);

router.patch('/:id/status', requireAuth, requireRole('admin', 'cashier', 'kitchen'), updateOrderStatus);
router.patch(
  '/:id/items/:itemId/status',
  requireAuth,
  requireRole('admin', 'kitchen'),
  updateOrderItemStatus
);

module.exports = router;
