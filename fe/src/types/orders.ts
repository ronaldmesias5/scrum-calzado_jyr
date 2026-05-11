/**
 * Archivo: fe/src/types/orders.ts
 * Descripción: Tipos centralizados para órdenes y pedidos.
 */

export type OrderStatus =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'entregado'
  | 'cancelado';

export interface OrderDetailItem {
  id: string;
  product_id: string;
  product_name?: string | null;
  style_name?: string | null;
  category_name?: string | null;
  brand_name?: string | null;
  image_url?: string | null;
  size: string;
  colour?: string | null;
  amount: number;
  stock_available?: number;
  state?: OrderStatus;
  order_date?: string;
  observations?: string | null;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  customer_last_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total_pairs: number;
  state: OrderStatus;
  creation_date?: string;
  created_at: string;
}

export interface OrderDetail extends Order {
  delivery_date?: string | null;
  updated_at?: string;
  deleted_at?: string | null;
  details: OrderDetailItem[];
}

export interface OrderCreateRequest {
  customer_id: string;
  details: Array<{
    product_id: string;
    size: string;
    colour?: string;
    amount: number;
  }>;
}

export interface OrderUpdateStatusRequest {
  state: OrderStatus;
}

export interface OrderUpdateDetailsRequest {
  details: Array<{
    id?: string;
    product_id: string;
    size: string;
    colour?: string;
    amount: number;
  }>;
}
