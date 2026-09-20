import request from './client.js';

export function fetchFeed(page = 1, category = null) {
  const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
  return request(`/posts?page=${page}${categoryParam}`);
}

export function fetchPost(id) {
  return request(`/posts/${id}`);
}

export function createPost(text, category, token) {
  return request('/posts', { method: 'POST', body: { text, category: category || undefined }, token });
}

export function toggleLike(id, token) {
  return request(`/posts/${id}/like`, { method: 'POST', token });
}

export function createReply(id, text, token) {
  return request(`/posts/${id}/replies`, { method: 'POST', body: { text }, token });
}
