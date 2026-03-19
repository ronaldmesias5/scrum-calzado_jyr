import api from '@/api/axios';
import type { Metric, RecentOrder, Alert } from '../types/dashboard';

export const getMetrics = async (): Promise<Metric[]> => {
  try {
    const [pendiente, en_progreso, completado, usuarios] = await Promise.allSettled([
      api.get('/api/v1/admin/orders', { params: { page: 1, page_size: 1, state: 'pendiente' } }),
      api.get('/api/v1/admin/orders', { params: { page: 1, page_size: 1, state: 'en_progreso' } }),
      api.get('/api/v1/admin/orders', { params: { page: 1, page_size: 1, state: 'completado' } }),
      api.get('/api/v1/admin/users/pending-validation'),
    ]);

    const val = (r: PromiseSettledResult<{ data: { total?: number; length?: number } }>, fallback = 0): number => {
      if (r.status !== 'fulfilled') return fallback;
      return r.value.data?.total ?? (Array.isArray(r.value.data) ? r.value.data.length : fallback);
    };

    return [
      { label: 'Pedidos Pendientes', value: val(pendiente as PromiseSettledResult<{ data: { total?: number } }>) },
      { label: 'En Producción',      value: val(en_progreso as PromiseSettledResult<{ data: { total?: number } }>) },
      { label: 'Pedidos Completados', value: val(completado as PromiseSettledResult<{ data: { total?: number } }>) },
      { label: 'Usuarios por Validar', value: val(usuarios as PromiseSettledResult<{ data: { total?: number } }>) },
    ];
  } catch {
    return [
      { label: 'Pedidos Pendientes',  value: 0 },
      { label: 'En Producción',       value: 0 },
      { label: 'Pedidos Completados', value: 0 },
      { label: 'Usuarios por Validar', value: 0 },
    ];
  }
};

export const getRecentOrders = async (): Promise<RecentOrder[]> => {
  const res = await api.get('/api/v1/admin/orders', { params: { page: 1, page_size: 5 } });
  const items: Array<{
    id: string;
    customer_name?: string | null;
    customer_last_name?: string | null;
    customer_id: string;
    total_pairs: number;
    state: RecentOrder['status'];
    created_at: string;
  }> = res.data.items ?? [];
  return items.map((o) => ({
    orderId: o.id,
    clientName:
      o.customer_name && o.customer_last_name
        ? `${o.customer_name} ${o.customer_last_name}`
        : `#${o.customer_id.substring(0, 8)}`,
    quantity: o.total_pairs,
    status: o.state,
    date: new Date(o.created_at).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }));
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const res = await api.get('/api/v1/dashboard/admin/alerts');
    return res.data.alerts.map((a: { id: string; type: Alert['type']; title: string; description: string; timestamp: string }) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      timestamp: a.timestamp,
    }));
  } catch {
    return [];
  }
};
