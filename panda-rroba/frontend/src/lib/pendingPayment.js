// Remembers which order is being paid while the customer is on the bank's page.
const KEY = 'panda_pending_payment';

export function savePendingPayment(data) {
  try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function getPendingPayment() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; }
}

export function clearPendingPayment() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
