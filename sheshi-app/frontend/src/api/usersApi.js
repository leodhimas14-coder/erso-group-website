import request from './client.js';

export function fetchProfile(username, token) {
  return request(`/users/${username}`, { token });
}

export function toggleFollow(username, token) {
  return request(`/users/${username}/follow`, { method: 'POST', token });
}
