import request from './client.js';

export function fetchFeed(page = 1) {
  return request(`/posts?page=${page}`);
}

export function fetchPost(id) {
  return request(`/posts/${id}`);
}

export function createPost(text, token) {
  return request('/posts', { method: 'POST', body: { text }, token });
}

export function toggleLike(id, token) {
  return request(`/posts/${id}/like`, { method: 'POST', token });
}

export function createReply(id, text, token) {
  return request(`/posts/${id}/replies`, { method: 'POST', body: { text }, token });
}
