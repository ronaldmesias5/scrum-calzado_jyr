/**
 * Módulo: ordersApi.ts
 * Descripción: Servicio para consumir API de órdenes del backend.
 * ¿Para qué? Centralizar llamadas API para operaciones CRUD de órdenes mayoristas.
 * ¿Impacto? Proporciona métodos reutilizables para componentes de órdenes.
 */

import axios from '@/api/axios';

// ────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────

export type OrderStatus = 'pendiente' | 'en_progreso' | 'completado' | 'entregado' | 'cancelado';

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

export interface OrderListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Order[];
}

export interface OrderDetailItemCreateRequest {
  product_id: string;
  size: string;
  colour?: string | null;
  amount: number;
  observations?: string;
}

export interface OrderCreateRequest {
  customer_id: string;
  total_pairs: number;
  delivery_date?: string | null;
  details: OrderDetailItemCreateRequest[];
}

export interface OrderUpdateStatusRequest {
  state: OrderStatus;
}

// ────────────────────────────────────────────────
// Funciones API
// ────────────────────────────────────────────────

/**
 * Obtiene listado paginado de órdenes.
 * @param page - Número de página (1-indexed)
 * @param page_size - Elementos por página
 * @param state - Filtro por estado (opcional)
 * @param customerId - Filtro por cliente ID (opcional)
 * @returns Promise<OrderListResponse>
 */
export async function getOrders(
  page: number = 1,
  page_size: number = 10,
  state?: OrderStatus | null,
  customerName?: string | null,
): Promise<OrderListResponse> {
  const params: Record<string, unknown> = { page, page_size };
  if (state) params.state = state;
  if (customerName && customerName.trim()) params.customer_name = customerName.trim();

  const response = await axios.get<OrderListResponse>('/api/v1/admin/orders', { params });
  return response.data;
}

/**
 * Obtiene detalle de una orden específica con todos sus items.
 * @param orderId - UUID de la orden
 * @returns Promise<OrderDetail>
 */
export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const response = await axios.get<OrderDetail>(`/api/v1/admin/orders/${orderId}`);
  return response.data;
}

/**
 * Crea una nueva orden mayorista.
 * @param orderData - Datos de la orden a crear
 * @returns Promise<OrderDetail>
 */
export async function createOrder(orderData: OrderCreateRequest): Promise<OrderDetail> {
  const response = await axios.post<OrderDetail>('/api/v1/admin/orders', orderData);
  return response.data;
}

/**
 * Actualiza el estado de una orden.
 * @param orderId - UUID de la orden
 * @param statusUpdate - Nuevo estado
 * @returns Promise<OrderDetail>
 */
export async function updateOrderStatus(
  orderId: string,
  statusUpdate: OrderUpdateStatusRequest,
): Promise<OrderDetail> {
  const response = await axios.patch<OrderDetail>(
    `/api/v1/admin/orders/${orderId}/status`,
    statusUpdate,
  );
  return response.data;
}

export interface OrderUpdateDetailsRequest {
  delivery_date?: string | null;
  details: OrderDetailItemCreateRequest[];
}

export async function updateOrderDetails(
  orderId: string,
  data: OrderUpdateDetailsRequest,
): Promise<OrderDetail> {
  const response = await axios.put<OrderDetail>(`/api/v1/admin/orders/${orderId}`, data);
  return response.data;
}

/**
 * Elimina permanentemente una orden cancelada.
 * @param orderId - UUID de la orden en estado 'cancelado'
 */
export async function deleteOrder(orderId: string): Promise<void> {
  await axios.delete(`/api/v1/admin/orders/${orderId}`);
}

/**
 * Obtiene lista de categorías disponibles en el catálogo.
 * @returns Promise<Category[]>
 */
export async function getCategories(): Promise<any[]> {
  const response = await axios.get('/api/v1/catalog/categories');
  return response.data?.categories || [];
}

/**
 * Obtiene listado de estilos disponibles para crear órdenes.
 * @returns Promise<Style[]>
 */
export async function getStyles(): Promise<any[]> {
  const response = await axios.get('/api/v1/catalog/styles');
  return response.data?.styles || [];
}

/**
 * Obtiene tallas y disponibilidad para un estilo específico.
 * @param styleId - UUID del estilo
 * @returns Promise<InventoryInfo>
 */
export async function getStyleInventory(styleId: string): Promise<any> {
  const response = await axios.get(`/api/v1/catalog/styles/${styleId}/inventory`);
  return response.data;
}

/**
 * Obtiene lista de clientes (usuarios con rol client).
 * @returns Promise<User[]>
 */
export async function getClients(): Promise<any[]> {
  const response = await axios.get('/api/v1/admin/users', { params: { role: 'client' } });
  return response.data || [];
}

/**
 * Obtiene listado de productos del catálogo (con info de estilo, categoría y marca).
 * @returns Promise<Product[]>
 */
export async function getProducts(): Promise<any[]> {
  const response = await axios.get('/api/v1/catalog/products');
  return response.data?.products || [];
}

// ────────────────────────────────────────────────
// Tareas de Producción
// ────────────────────────────────────────────────

export interface ProductionTaskCreate {
  product_id: string;
  assigned_to: string;
  type: string;
  description?: string;
  priority?: string;
  amount: number;
}

export interface ProductionTask {
  id: string;
  order_id: string;
  product_id: string;
  assigned_to?: string;
  assigned_user_name?: string;
  assigned_user_occupation?: string;
  vale_number?: number;
  amount: number;
  description_task?: string;
  status: string;
  type: string;
  created_at: string;
  task_prices?: {
    corte?: number;
    guarnicion?: number;
    soladura?: number;
    emplantillado?: number;
    [key: string]: number | undefined;
  };
  total_pairs?: number;
  product_name?: string;
  product_category?: string;
  product_image?: string;
}

/** Crea las 4 tareas de producción para una orden */
export async function createProductionTasks(orderId: string, tasks: ProductionTaskCreate[]): Promise<ProductionTask[]> {
  const response = await axios.post<ProductionTask[]>(`/api/v1/admin/orders/${orderId}/tasks`, { tasks });
  return response.data;
}

/** Obtiene las tareas de producción de una orden */
export async function getOrderTasks(order_id: string): Promise<ProductionTask[]> {
  const response = await axios.get<ProductionTask[]>(`/api/v1/admin/orders/${order_id}/tasks`, {
    params: { _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return response.data;
}

/** Obtiene el siguiente número de vale disponible */
export async function getNextValeNumber(): Promise<number> {
  const response = await axios.get<{ next_number: number }>('/api/v1/admin/orders/tasks/next-number');
  return response.data.next_number;
}

/** Cambia el estado de una tarea de producción */
export async function updateProductionTaskStatus(task_id: string, status: string): Promise<ProductionTask> {
  const response = await axios.patch<ProductionTask>(`/api/v1/admin/orders/tasks/${task_id}/status`, { status });
  return response.data;
}

/** Obtiene TODAS las tareas de producción con filtros */
export async function getAllProductionTasks(filters: {
  status?: string;
  type?: string;
  assigned_to?: string;
} = {}): Promise<ProductionTask[]> {
  const response = await axios.get<ProductionTask[]>('/api/v1/admin/orders/tasks/all', { params: filters });
  return response.data;
}

// ────────────────────────────────────────────────
// Movimientos de Inventario
// ────────────────────────────────────────────────

export interface InventoryMovementCreate {
  product_id: string;
  size: string;
  quantity: number;
  movement_type: 'entrada' | 'salida' | 'ajuste' | 'reserva';
  reference_id?: string;
  reference_type?: string;
  notes?: string;
}

/** Crea un movimiento de inventario cuando un producto se completa en producción */
export async function createInventoryMovement(movement: InventoryMovementCreate): Promise<any> {
  const response = await axios.post('/api/v1/admin/catalog/inventory/movements', movement);
  return response.data;
}
