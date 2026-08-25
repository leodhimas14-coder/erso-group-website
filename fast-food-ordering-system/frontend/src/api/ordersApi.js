import request from './client.js';

export const createOrder = (order) => request('/orders', { method: 'POST', body: order });
export const getOrder = (id) => request(`/orders/${id}`);
export const listOrders = (params = {}, token) => {
  const query = new URLSearchParams(params).toString();
  return request(`/orders${query ? `?${query}` : ''}`, { token });
};
export const createPaymentIntent = (orderId) => request(`/orders/${orderId}/payment-intent`, { method: 'POST' });
export const markOrderPaid = (orderId, method, token) =>
  request(`/orders/${orderId}/mark-paid`, { method: 'POST', body: { method }, token });
export const updateOrderStatus = (orderId, status, token) =>
  request(`/orders/${orderId}/status`, { method: 'PATCH', body: { status }, token });
export const updateOrderItemStatus = (orderId, itemId, status, token) =>
  request(`/orders/${orderId}/items/${itemId}/status`, { method: 'PATCH', body: { status }, token });
