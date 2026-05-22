import { apiRequest } from './apiClient.js';

export function listNotifications(accessToken, unreadOnly = false) {
  const qs = unreadOnly ? '?unread_only=true' : '';
  return apiRequest(`/notifications${qs}`, { accessToken });
}

export function getUnreadCount(accessToken) {
  return apiRequest('/notifications/unread-count', { accessToken });
}

export function markNotificationRead(accessToken, id) {
  return apiRequest(`/notifications/${id}/read`, { accessToken, method: 'POST' });
}

export function markAllNotificationsRead(accessToken) {
  return apiRequest('/notifications/read-all', { accessToken, method: 'POST' });
}
