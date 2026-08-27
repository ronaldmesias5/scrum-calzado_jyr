import { apiClient } from '@/services/apiClient';
import type { NotificationListResponse, UnreadCountResponse } from '@/types/notifications';

export async function getNotifications(limit = 50): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>('/notifications', {
    params: { limit },
  });
  return data ?? { items: [], total: 0, unread_count: 0 };
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return data ?? { unread_count: 0 };
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}
