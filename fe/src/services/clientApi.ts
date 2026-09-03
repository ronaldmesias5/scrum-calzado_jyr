import api from '@/services/axios';

export interface ClientOrderDetailItem {
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
  state: string;
  observations?: string | null;
}

export interface ClientOrder {
  id: string;
  customer_id: string;
  total_pairs: number;
  state: string;
  creation_date: string;
  delivery_date: string | null;
  created_at: string;
  updated_at: string | null;
  details: ClientOrderDetailItem[];
}

export interface ClientOrderListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ClientOrder[];
}

export interface OrderDetailItemCreateRequest {
  product_id: string;
  size: string;
  colour?: string | null;
  amount: number;
  observations?: string;
  line_group?: number;
}

export interface OrderCreateRequest {
  customer_id: string;
  total_pairs: number;
  delivery_date?: string | null;
  details: OrderDetailItemCreateRequest[];
}

export interface ClientOrderSummaryResponse {
  total: number;
  by_state: Record<string, number>;
}

export interface ClientIncidence {
  id: string;
  order_id: string | null;
  order_number: string | null;
  product_id: string;
  product_name: string | null;
  size: string;
  colour: string | null;
  defect_code: string | null;
  defect_name: string | null;
  description: string | null;
  quantity: number;
  observations: string | null;
  status: string;
  approved_type: string | null;
  rejection_reason: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string | null;
}

export interface ClientIncidenceListResponse {
  incidences: ClientIncidence[];
  total: number;
}

export interface ClientIncidenceCreateRequest {
  order_id: string;
  order_detail_id: string;
  size: string;
  colour?: string | null;
  defect_code_id?: string | null;
  description?: string | null;
  quantity: number;
  observations?: string | null;
}

export async function getMyOrders(
  page: number = 1,
  pageSize: number = 10
): Promise<ClientOrderListResponse> {
  const res = await api.get(
    `/api/v1/client/orders?page=${page}&page_size=${pageSize}`
  );
  return res.data;
}

export async function getMyOrderDetail(orderId: string): Promise<ClientOrder> {
  const res = await api.get(`/api/v1/client/orders/${orderId}`);
  return res.data;
}

export async function createMyOrder(
  orderData: OrderCreateRequest
): Promise<ClientOrder> {
  const res = await api.post('/api/v1/client/orders', orderData);
  return res.data;
}

export async function getMyOrdersSummary(): Promise<ClientOrderSummaryResponse> {
  const res = await api.get('/api/v1/client/orders/summary');
  return res.data;
}

export interface ClientOrderItemSummary {
  product_id: string;
  product_name: string;
  image_url: string | null;
  amount: number;
  category_name: string | null;
  colour: string | null;
}

export interface ClientOrderSummary {
  id: string;
  total_pairs: number;
  total_price: number;
  state: string;
  created_at: string;
  items: ClientOrderItemSummary[];
}

export interface ClientAllOrdersReport {
  user_id: string;
  name: string;
  total_orders: number;
  total_pairs: number;
  total_spent: number;
  orders: ClientOrderSummary[];
}

export async function getAllMyOrders(
  startDate?: string,
  endDate?: string
): Promise<ClientAllOrdersReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await api.get<ClientAllOrdersReport>(
    '/api/v1/client/orders/all',
    { params }
  );
  return res.data;
}

export async function getMyIncidences(): Promise<ClientIncidenceListResponse> {
  const res = await api.get('/api/v1/client/incidences');
  return res.data;
}

export async function createMyIncidence(
  data: ClientIncidenceCreateRequest
): Promise<ClientIncidence> {
  const res = await api.post('/api/v1/client/incidences', data);
  return res.data;
}

export interface ClientSharedIncidence {
  id: string;
  title: string;
  message: string | null;
  product_name: string | null;
  size: string | null;
  colour: string | null;
  quantity: number | null;
  incident_type: string | null;
  defect: string | null;
  order_id: string | null;
  shared_by_name: string | null;
  is_read: boolean;
  created_at: string | null;
}

export async function getSharedIncidences(): Promise<{
  items: ClientSharedIncidence[];
  total: number;
}> {
  const res = await api.get('/api/v1/client/incidences/shared');
  return res.data;
}
