import { apiClient } from '@/services/apiClient';
import type {
  DashboardReport,
  EmployeeReport,
  CustomerReport,
  ProductionReport,
  SalesReport,
} from '@/types/reports';

export async function getDashboardReport(days = 30): Promise<DashboardReport> {
  const { data } = await apiClient.get<DashboardReport>('/admin/reports/dashboard', {
    params: { days },
  });
  return data;
}

export async function getEmployeeReport(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<EmployeeReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<EmployeeReport>(
    `/admin/reports/employee/${userId}`,
    { params },
  );
  return data;
}

export async function getRoleReport(
  roleName: string,
  startDate?: string,
  endDate?: string,
): Promise<EmployeeReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<EmployeeReport>(
    `/admin/reports/role/${roleName}`,
    { params },
  );
  return data;
}

export async function getCustomerReport(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<CustomerReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<CustomerReport>(
    `/admin/reports/customer/${userId}`,
    { params },
  );
  return data;
}

export async function getAllCustomersReport(
  startDate?: string,
  endDate?: string,
  state?: string,
): Promise<CustomerReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (state) params.state = state;
  const { data } = await apiClient.get<CustomerReport>(
    '/admin/reports/customer/all/orders',
    { params },
  );
  return data;
}

export async function getGlobalProduction(
  days = 30,
  startDate?: string,
  endDate?: string,
): Promise<ProductionReport> {
  const params: Record<string, string | number> = { days };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<ProductionReport>(
    '/admin/reports/global/production',
    { params },
  );
  return data;
}

export async function getGlobalSales(
  days = 30,
  startDate?: string,
  endDate?: string,
): Promise<SalesReport> {
  const params: Record<string, string | number> = { days };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<SalesReport>(
    '/admin/reports/global/sales',
    { params },
  );
  return data;
}

export async function markTasksAsPaid(
  taskIds: string[],
): Promise<{ message: string; updated_count: number }> {
  const { data } = await apiClient.patch<{ message: string; updated_count: number }>(
    '/admin/reports/tasks/mark-paid',
    { task_ids: taskIds },
  );
  return data;
}

export async function sendReportEmail(body: {
  to_email: string;
  to_name: string;
  subject: string;
  body_html: string;
  pdf_base64: string;
  pdf_filename: string;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string }>(
    '/admin/reports/send-email',
    body,
  );
  return data;
}
