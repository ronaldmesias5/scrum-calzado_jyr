import api from '@/api/axios';

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
  items: ClientOrder[];
}

export async function getMyOrders(): Promise<ClientOrderListResponse> {
  const res = await api.get('/api/v1/client/orders');
  return res.data;
}

export async function getMyOrderDetail(orderId: string): Promise<ClientOrder> {
  const res = await api.get(`/api/v1/client/orders/${orderId}`);
  return res.data;
}
