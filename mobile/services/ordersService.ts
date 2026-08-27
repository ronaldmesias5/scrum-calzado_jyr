import { apiClient } from '@/services/apiClient';
import type {
  Order,
  OrderCreateRequest,
  OrderDetail,
  OrderListResponse,
  OrderUpdateDetailsRequest,
  OrderUpdateStatusRequest,
  ProductionTask,
} from '@/types/orders';

export const ordersService = {
  async list(
    page = 1,
    pageSize = 10,
    state?: string,
    customerName?: string,
  ): Promise<OrderListResponse> {
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (state) params.state = state;
    if (customerName) params.customer_name = customerName;
    const { data } = await apiClient.get<OrderListResponse>('/admin/orders', { params });
    return data;
  },

  async getCountByStatus(state: string): Promise<number> {
    const { data } = await apiClient.get<OrderListResponse>('/admin/orders', {
      params: { page: 1, page_size: 1, state },
    });
    return data.total ?? 0;
  },

  async detail(orderId: string): Promise<OrderDetail> {
    const { data } = await apiClient.get<OrderDetail>(`/admin/orders/${orderId}`);
    return data;
  },

  async create(order: OrderCreateRequest): Promise<OrderDetail> {
    const { data } = await apiClient.post<OrderDetail>('/admin/orders', order);
    return data;
  },

  async updateStatus(orderId: string, body: OrderUpdateStatusRequest): Promise<OrderDetail> {
    const { data } = await apiClient.patch<OrderDetail>(
      `/admin/orders/${orderId}/status`,
      body,
    );
    return data;
  },

  async updateDetails(orderId: string, body: OrderUpdateDetailsRequest): Promise<OrderDetail> {
    const { data } = await apiClient.put<OrderDetail>(`/admin/orders/${orderId}`, body);
    return data;
  },

  async remove(orderId: string): Promise<void> {
    await apiClient.delete(`/admin/orders/${orderId}`);
  },

  async getOrderTasks(orderId: string, productId?: string): Promise<ProductionTask[]> {
    const params: Record<string, string> = {};
    if (productId) params.product_id = productId;
    const { data } = await apiClient.get<ProductionTask[]>(
      `/admin/orders/${orderId}/tasks`,
      { params },
    );
    return data;
  },

  async getAllTasks(filters?: {
    status?: string;
    type?: string;
    assigned_to?: string;
  }): Promise<ProductionTask[]> {
    const { data } = await apiClient.get<ProductionTask[]>('/admin/orders/tasks/all', {
      params: filters,
    });
    return data;
  },

  async updateTaskStatus(
    taskId: string,
    status: string,
  ): Promise<ProductionTask> {
    const { data } = await apiClient.patch<ProductionTask>(
      `/admin/orders/tasks/${taskId}/status`,
      { status },
    );
    return data;
  },

  async assignTask(taskId: string, assignedTo: string): Promise<ProductionTask> {
    const { data } = await apiClient.patch<ProductionTask>(
      `/admin/orders/tasks/${taskId}/assign`,
      { assigned_to: assignedTo },
    );
    return data;
  },

  async createProductionTasks(
    orderId: string,
    tasks: Array<{
      product_id: string;
      assigned_to?: string | null;
      type: string;
      description?: string;
      priority?: string;
      amount: number;
      line_group?: number;
    }>,
  ): Promise<ProductionTask[]> {
    const { data } = await apiClient.post<ProductionTask[]>(
      `/admin/orders/${orderId}/tasks`,
      { tasks },
    );
    return data;
  },
};
