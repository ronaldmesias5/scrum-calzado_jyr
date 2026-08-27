export interface Notification {
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
  items: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export type NotificationType = 'new_order';
