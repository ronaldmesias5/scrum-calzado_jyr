import api from '@/api/axios';
import type { EmployeeMetricsResponse, EmployeeTaskListResponse, EmployeeIncidenceListResponse, AvailableTaskListResponse, ValeResponse } from '../types/employee';

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
export const updateEmployeeTaskStatus = async (taskId: string, status: string): Promise<void> => {
  await api.patch(`/api/v1/orders/tasks/${taskId}/status`, { status });
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
