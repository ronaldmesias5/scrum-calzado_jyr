/**
 * Servicio para consumir API de notificaciones del backend.
 */
import apiClient from '@/api/axios';

export interface BackendNotification {
  id: string;
  title_notification: string;
  message_notification: string;
  type_notification: 'info' | 'advertencia' | 'error' | 'exito';
  is_read: boolean;
  order_id: string | null;
  link_url: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: BackendNotification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export async function getNotifications(limit = 50): Promise<NotificationListResponse> {
  const res = await apiClient.get<NotificationListResponse>(`/api/v1/notifications?limit=${limit}`);
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
  return res.data.unread_count;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/api/v1/notifications/read-all');
}

export async function dismissNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/api/v1/notifications/${notificationId}`);
}
