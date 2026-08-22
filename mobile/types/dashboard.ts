export interface Metric {
  label: string;
  value: number;
  change: string;
  change_positive: boolean;
}

export interface DashboardMetricsResponse {
  metrics: Metric[];
}

export interface RecentOrder {
  order_id: string;
  client_name: string;
  quantity: number;
  status: string;
  date: string;
}

export interface RecentOrdersResponse {
  orders: RecentOrder[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
}

export interface AlertsResponse {
  alerts: Alert[];
}
