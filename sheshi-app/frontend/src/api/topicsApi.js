import request from './client.js';

export function fetchActiveTopic() {
  return request('/topics/daily');
}

export function setDailyTopic(text, token) {
  return request('/topics/daily', { method: 'POST', body: { text }, token });
}

export function fetchTopicHistory(token) {
  return request('/topics/daily/history', { token });
}
