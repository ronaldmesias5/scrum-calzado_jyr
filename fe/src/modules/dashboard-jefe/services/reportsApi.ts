import axios from '@/api/axios';

export interface KPIResponse {
  total_orders: number;
  total_pairs_sold: number;
  total_tasks_completed: number;
  pairs_in_production: number;
}

export interface CategorySalesResponse {
  category_name: string;
  pairs_sold: number;
  percentage: number;
}

export interface TopProductResponse {
  product_id: string;
  product_name: string;
  sales: number;
  image_url?: string | null;
}

export interface TopCustomerResponse {
  user_id: string;
  name: string;
  total_orders: number;
  total_pairs: number;
}

export interface TopEmployeeResponse {
  user_id: string;
  name: string;
  occupation: string;
  completed_tasks: number;
}

export interface DashboardReportResponse {
  kpis: KPIResponse;
  sales_by_category: CategorySalesResponse[];
  top_products: TopProductResponse[];
  top_customers: TopCustomerResponse[];
  top_employees: TopEmployeeResponse[];
}

export interface TaskDetail {
  id: string;
  order_id: string;
  product_name: string;
  process_name: string;
  amount: number;
  status: string;
  created_at: string;
  price_per_dozen?: number;
  task_total_price?: number;
  vale_number?: number;
}

export interface TaskBreakdown {
  process_name: string;
  count: number;
}

export interface EmployeeReportResponse {
  user_id: string;
  name: string;
  total_tasks_completed: number;
  total_pairs_produced: number;
  total_earnings?: number;
  tasks_breakdown: TaskBreakdown[];
  tasks_list: TaskDetail[];
}

export interface OrderItemSummary {
  product_id: string;
  product_name: string;
  image_url?: string | null;
  amount: number;
}

export interface OrderSummary {
  id: string;
  total_pairs: number;
  total_price: number;
  state: string;
  created_at: string;
  items: OrderItemSummary[];
}

export interface CustomerReportResponse {
  user_id: string;
  name: string;
  total_orders: number;
  total_pairs: number;
  total_spent: number;
  orders: OrderSummary[];
}

export interface ProductionWeeklyMetric {
  week: string;
  tasks_completed: number;
  pairs_manufactured: number;
  orders_created: number;
  pairs_ordered: number;
}

export interface ProductionGlobalReport {
  total_pairs_period: number;
  total_tasks_period: number;
  total_orders_period: number;
  total_orders_created: number;
  total_pairs_ordered: number;
  weekly_metrics: ProductionWeeklyMetric[];
  orders: OrderSummary[];
}

export interface SalesWeeklyMetric {
  week: string;
  orders_created: number;
  pairs_ordered: number;
}

export interface SalesGlobalReport {
  total_orders_period: number;
  total_pairs_period: number;
  weekly_metrics: SalesWeeklyMetric[];
}

export async function getDashboardReports(days: number = 30): Promise<DashboardReportResponse> {
  const response = await axios.get<DashboardReportResponse>('/api/v1/admin/reports/dashboard', {
    params: { days }
  });
  return response.data;
}

export async function getEmployeeReport(userId: string, startDate?: string, endDate?: string, status?: string): Promise<EmployeeReportResponse> {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (status && status !== 'all') params.status = status;
  const response = await axios.get<EmployeeReportResponse>(`/api/v1/admin/reports/employee/${userId}`, { params });
  return response.data;
}

export async function getCustomerReport(userId: string, startDate?: string, endDate?: string): Promise<CustomerReportResponse> {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await axios.get<CustomerReportResponse>(`/api/v1/admin/reports/customer/${userId}`, { params });
  return response.data;
}

export async function getGlobalProduction(days: number = 30, startDate?: string, endDate?: string, state?: string): Promise<ProductionGlobalReport> {
  const params: any = { days };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (state && state !== 'all') params.state = state;
  const response = await axios.get<ProductionGlobalReport>('/api/v1/admin/reports/global/production', { params });
  return response.data;
}

export async function getRoleReport(roleName: string, startDate?: string, endDate?: string, status?: string): Promise<EmployeeReportResponse> {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (status && status !== 'all') params.status = status;
  const response = await axios.get<EmployeeReportResponse>(`/api/v1/admin/reports/role/${roleName}`, { params });
  return response.data;
}

export async function getAllCustomersReport(startDate?: string, endDate?: string, state?: string): Promise<CustomerReportResponse> {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (state && state !== 'all') params.state = state;
  const response = await axios.get<CustomerReportResponse>('/api/v1/admin/reports/customer/all/orders', { params });
  return response.data;
}

export async function getGlobalSales(days: number = 30, startDate?: string, endDate?: string): Promise<SalesGlobalReport> {
  const params: any = { days };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await axios.get<SalesGlobalReport>('/api/v1/admin/reports/global/sales', { params });
  return response.data;
}

export async function markTasksAsPaid(taskIds: string[]): Promise<{ message: string; updated_count: number }> {
  const response = await axios.patch('/api/v1/admin/reports/tasks/mark-paid', { task_ids: taskIds });
  return response.data;
}
