export interface Metric {
  label: string;
  value: number;
  change: string;
  changePositive: boolean;
}

export interface RecentOrder {
  orderId: string;
  clientName: string;
  quantity: number;
  status: 'pending' | 'in_production' | 'ready' | 'delivered';
  date: string;
}

export type AlertType = 'warning' | 'error' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
}
