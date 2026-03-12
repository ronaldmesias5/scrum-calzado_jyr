import api from '@/api/axios';
import type { Metric, RecentOrder, Alert } from '../types/dashboard';

export const getMetrics = async (): Promise<Metric[]> => {
  const res = await api.get('/api/v1/dashboard/admin/metrics');
  return res.data.metrics.map((m: { label: string; value: number; change: string; change_positive: boolean }) => ({
    label: m.label,
    value: m.value,
    change: m.change,
    changePositive: m.change_positive,
  }));
};

export const getRecentOrders = async (): Promise<RecentOrder[]> => {
  const res = await api.get('/api/v1/dashboard/admin/recent-orders');
  return res.data.orders.map((o: { order_id: string; client_name: string; quantity: number; status: RecentOrder['status']; date: string }) => ({
    orderId: o.order_id,
    clientName: o.client_name,
    quantity: o.quantity,
    status: o.status,
    date: o.date,
  }));
};

export const getAlerts = async (): Promise<Alert[]> => {
  const res = await api.get('/api/v1/dashboard/admin/alerts');
  return res.data.alerts.map((a: { id: string; type: Alert['type']; title: string; description: string; timestamp: string }) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    timestamp: a.timestamp,
  }));
};
