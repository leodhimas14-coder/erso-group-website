/**
 * Integration point for fature.al, the Albanian fiscalization platform.
 * Every paid order must be reported so a fiscal receipt (kupon tatimor) is
 * issued, per Albanian tax law. This is a thin client stub - swap the fetch
 * call for the real fature.al endpoint/payload shape once API docs/credentials
 * are available; the rest of the app only depends on the function signatures
 * below (see controllers/orders.controller.js).
 */

const FATURE_AL_API_URL = process.env.FATURE_AL_API_URL;
const FATURE_AL_API_KEY = process.env.FATURE_AL_API_KEY;
const FATURE_AL_BUSINESS_NIPT = process.env.FATURE_AL_BUSINESS_NIPT;

/**
 * Submits a paid order for fiscalization.
 * @param {import('../models/Order')} order
 * @returns {Promise<{ fiscalReceiptId: string, fiscalUrl: string }>}
 */
async function issueFiscalReceipt(order) {
  if (!FATURE_AL_API_URL || !FATURE_AL_API_KEY) {
    throw Object.assign(new Error('fature.al credentials are not configured'), { status: 503 });
  }

  const payload = {
    nipt: FATURE_AL_BUSINESS_NIPT,
    externalOrderId: order.orderNumber,
    items: order.items.map((item) => ({
      name: item.nameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    total: order.total,
    tax: order.tax,
    paymentMethod: order.payment?.method,
  };

  const response = await fetch(`${FATURE_AL_API_URL}/v1/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FATURE_AL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw Object.assign(new Error(`fature.al rejected the invoice: ${text}`), { status: 502 });
  }

  const data = await response.json();
  return {
    fiscalReceiptId: data.receiptId,
    fiscalUrl: data.receiptUrl,
  };
}

module.exports = { issueFiscalReceipt };
