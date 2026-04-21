export interface Metric {
  label: string;
  value: number | string;
  change?: string;
  changePositive?: boolean;
}

export type OrderStatusKey = 'pendiente' | 'en_progreso' | 'completado' | 'entregado' | 'cancelado';

export interface RecentOrder {
  orderId: string;
  clientName: string;
  quantity: number;
  status: OrderStatusKey;
  date: string;
}

export type AlertType = 'warning' | 'error' | 'info' | 'success';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
}
