export type OrderStatus =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'entregado'
  | 'cancelado';

export type TaskPriority = 'baja' | 'alta';
export type TaskType = 'corte' | 'guarnicion' | 'soladura' | 'emplantillado';
export type TaskStatus =
  | 'pendiente'
  | 'por_liquidar'
  | 'en_progreso'
  | 'completado'
  | 'pagado'
  | 'cancelado';

export interface OrderDetailItem {
  id: string;
  product_id: string;
  product_name: string | null;
  style_name: string | null;
  category_name: string | null;
  brand_name: string | null;
  image_url: string | null;
  size: string;
  colour: string | null;
  amount: number;
  stock_available: number | null;
  state: OrderStatus | null;
  order_date: string | null;
  observations: string | null;
  line_group: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_pairs: number;
  state: OrderStatus;
  creation_date: string | null;
  created_at: string | null;
}

export interface OrderDetail extends Order {
  delivery_date: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  details: OrderDetailItem[];
}

export interface OrderListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Order[];
}

export interface OrderCreateRequest {
  customer_id: string;
  total_pairs: number;
  delivery_date?: string | null;
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
  delivery_date?: string | null;
  details: Array<{
    product_id: string;
    size: string;
    colour?: string;
    amount: number;
  }>;
}

export interface ProductionTask {
  id: string;
  order_id: string;
  product_id: string | null;
  line_group: number;
  assigned_to: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: string;
  vale_number: number | null;
  amount: number;
  description_task: string | null;
  observation: string | null;
  assigned_user_name: string | null;
  assigned_user_occupation: string | null;
  created_at: string;
  task_prices: Record<string, unknown>;
  total_pairs: number;
  product_name: string | null;
  product_category: string | null;
  product_image: string | null;
}

export interface OrderStatusCounts {
  pendiente: number;
  en_progreso: number;
  completado: number;
  entregado: number;
  cancelado: number;
}
