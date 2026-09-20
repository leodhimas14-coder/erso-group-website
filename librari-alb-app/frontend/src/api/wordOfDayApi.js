import request from './client.js';

export function fetchActiveWord() {
  return request('/word-of-day/active');
}

export function setWordOfDay(word, note, token) {
  return request('/word-of-day', { method: 'POST', body: { word, note }, token });
}

export function fetchWordHistory(token) {
  return request('/word-of-day/history', { token });
}

export function submitSuggestion(wordId, text, token) {
  return request(`/word-of-day/${wordId}/suggestions`, { method: 'POST', body: { text }, token });
}

export function voteSuggestion(suggestionId, token) {
  return request(`/word-of-day/suggestions/${suggestionId}/vote`, { method: 'POST', token });
}

export function fetchWordComments(wordId) {
  return request(`/word-of-day/${wordId}/comments`);
}

export function postWordComment(wordId, text, token) {
  return request(`/word-of-day/${wordId}/comments`, { method: 'POST', body: { text }, token });
}
