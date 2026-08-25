import request from './client.js';

export const getMenu = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/menu${query ? `?${query}` : ''}`);
};

export const getProduct = (id) => request(`/menu/${id}`);
export const createProduct = (product, token) => request('/menu', { method: 'POST', body: product, token });
export const updateProduct = (id, product, token) =>
  request(`/menu/${id}`, { method: 'PUT', body: product, token });
export const deleteProduct = (id, token) => request(`/menu/${id}`, { method: 'DELETE', token });
