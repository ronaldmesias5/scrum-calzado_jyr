import api from '@/api/axios';
import type { EmployeeMetricsResponse, EmployeeTaskListResponse, EmployeeIncidenceListResponse, AvailableTaskListResponse, ValeResponse, GeneralIncidenceListResponse, GeneralIncidenceCreateRequest, ProductIncidenceListResponse, ProductIncidenceCreateRequest } from '../types/employee';

/**
 * Obtener métricas del dashboard del empleado actual.
 * GET /api/v1/dashboard/employee/metrics
 */
export const getEmployeeMetrics = async (): Promise<EmployeeMetricsResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/metrics');
  return res.data;
};

/**
 * Obtener tareas asignadas al empleado actual.
 * GET /api/v1/dashboard/employee/tasks
 */
export const getEmployeeTasks = async (params?: {
  status?: string;
  type?: string;
}): Promise<EmployeeTaskListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/tasks', {
    params: { ...params, _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return res.data;
};

/**
 * Obtener incidencias de las tareas del empleado actual.
 * GET /api/v1/dashboard/employee/incidences
 */
export const getEmployeeIncidences = async (params?: {
  state?: string;
}): Promise<EmployeeIncidenceListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/incidences', { params });
  return res.data;
};

/**
 * Obtener tareas disponibles para reclamar según la ocupación del empleado.
 * GET /api/v1/dashboard/employee/available-tasks
 */
export const getAvailableTasks = async (): Promise<AvailableTaskListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/available-tasks', {
    params: { _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return res.data;
};

/**
 * Reclamar una tarea disponible (asignarla al empleado actual).
 * POST /api/v1/dashboard/employee/tasks/{taskId}/claim
 */
export const claimTask = async (taskId: string): Promise<{ success: boolean; message: string; task_id: string }> => {
  const res = await api.post(`/api/v1/dashboard/employee/tasks/${taskId}/claim`);
  return res.data;
};

/**
 * Actualizar el estado de una tarea (el empleado puede marcar su propia tarea como completada).
 * PATCH /api/v1/orders/tasks/{taskId}/status
 */
export const updateEmployeeTaskStatus = async (taskId: string, status: string, observation?: string): Promise<void> => {
  const body: Record<string, unknown> = { status };
  if (observation !== undefined && observation !== '') body.observation = observation;
  await api.patch(`/api/v1/dashboard/employee/tasks/${taskId}/status`, body);
};

/**
 * Actualizar observación de una tarea.
 * PATCH /api/v1/dashboard/employee/tasks/{taskId}/observation
 */
export const updateTaskObservation = async (taskId: string, observation: string): Promise<void> => {
  await api.patch(`/api/v1/dashboard/employee/tasks/${taskId}/observation`, { observation });
};

/**
 * Obtener vale de producción completo para el empleado.
 * GET /api/v1/dashboard/employee/tasks/{taskId}/vale
 */
export const getTaskVale = async (taskId: string): Promise<ValeResponse> => {
  const res = await api.get(`/api/v1/dashboard/employee/tasks/${taskId}/vale`);
  return res.data;
};


// ─── Reportes del empleado ─────────────────────────────────────────────────────


export interface MyPerformanceResponse {
  total_tasks_completed: number;
  total_pairs_produced: number;
  total_earnings: number;
  tasks_breakdown: { process_name: string; count: number }[];
  name: string;
}

export interface SharedReportItem {
  id: string;
  report_type: string;
  report_title: string;
  shared_by_name: string;
  message: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface SharedReportListResponse {
  reports: SharedReportItem[];
  total: number;
}

export interface SharedReportDetailResponse {
  id: string;
  report_type: string;
  report_title: string;
  shared_by_name: string;
  message: string | null;
  is_read: boolean;
  created_at: string | null;
  parameters: Record<string, unknown>;
}

export const getMyPerformance = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<MyPerformanceResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/report/my-performance', { params });
  return res.data;
};

export const getSharedReports = async (): Promise<SharedReportListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/reports/shared');
  return res.data;
};

export const getSharedReportDetail = async (shareId: string): Promise<SharedReportDetailResponse> => {
  const res = await api.get(`/api/v1/dashboard/employee/reports/shared/${shareId}`);
  return res.data;
};


// ─── Reporte detallado de tareas del empleado ──────────────────────────────────


export interface MyTaskDetail {
  id: string;
  order_id: string | null;
  product_name: string;
  process_name: string;
  amount: number;
  status: string;
  colour: string | null;
  vale_number: number | null;
  created_at: string;
  completed_at: string | null;
  price_per_dozen: number;
  task_total_price: number;
}

export interface MyTasksReportResponse {
  total_tasks_completed: number;
  total_pairs_produced: number;
  total_earnings: number;
  tasks_breakdown: { process_name: string; count: number }[];
  tasks_list: MyTaskDetail[];
  name: string;
}

export const getMyTasksReport = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<MyTasksReportResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/report/my-tasks', { params });
  return res.data;
};


// ─── Incidencias generales (maquinaria/insumo) ────────────────────────────────


export const createGeneralIncidence = async (data: GeneralIncidenceCreateRequest): Promise<void> => {
  await api.post('/api/v1/dashboard/employee/general-incidences', data);
};

export const getGeneralIncidences = async (): Promise<GeneralIncidenceListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/general-incidences');
  return res.data;
};


// ─── Incidencias de producto (pendientes de aprobación) ────────────────────────


export const createProductIncidence = async (data: ProductIncidenceCreateRequest): Promise<void> => {
  await api.post('/api/v1/dashboard/employee/product-incidences', data);
};

export const getProductIncidences = async (): Promise<ProductIncidenceListResponse> => {
  const res = await api.get('/api/v1/dashboard/employee/product-incidences');
  return res.data;
};
