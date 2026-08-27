import { apiClient } from '@/services/apiClient';
import type {
  AlertsResponse,
  DashboardMetricsResponse,
  RecentOrdersResponse,
} from '@/types/dashboard';

const BASE = '/dashboard/admin';

export async function getMetrics(): Promise<DashboardMetricsResponse> {
  const { data } = await apiClient.get<DashboardMetricsResponse>(`${BASE}/metrics`);
  return data;
}

export async function getRecentOrders(): Promise<RecentOrdersResponse> {
  const { data } = await apiClient.get<RecentOrdersResponse>(`${BASE}/recent-orders`);
  return data;
}

export async function getAlerts(): Promise<AlertsResponse> {
  const { data } = await apiClient.get<AlertsResponse>(`${BASE}/alerts`);
  return data;
}
