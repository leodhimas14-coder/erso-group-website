// Orders placed from this device, so "Llogaria ime" can list them without a login.
const KEY = 'panda_my_orders_v1';

export function getMyOrders() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function rememberOrder(order, phone) {
  try {
    const list = getMyOrders().filter((o) => o.number !== order.number);
    list.unshift({ number: order.number, phone, total: order.total, createdAt: order.createdAt || new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch { /* ignore */ }
}
