/**
 * Service: lossApi.ts
 * Endpoints para gestión de pérdidas por calzado defectuoso (Scrap).
 */

import api from '@/api/axios';

const SCRAP_PREFIX = '/api/v1/admin/scrap';

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export interface DefectCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface LossRecord {
  id: string;
  product_id: string;
  size: string;
  colour: string | null;
  quantity: number;
  defect_code: DefectCode;
  defect_code_id: string;
  description?: string | null;  // Descripción libre del defecto
  reason: string | null;
  observations: string | null;
  status: string;
  registered_by_id: string;
  approved_by_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LossRecordListResponse {
  items: LossRecord[];
  total: number;
}

export interface LossCreateRequest {
  product_id: string;
  size: string;
  colour?: string;
  quantity: number;
  defect_code_id?: string;  // Opcional — ahora se usa description como alternativa
  description?: string;  // Descripción libre del defecto
  reason?: string;
  observations?: string;
}

export interface ScrapStock {
  id: string;
  product_id: string;
  size: string;
  colour: string | null;
  quantity: number;
  defect_code: DefectCode;
  defect_code_id: string;
  loss_record_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────
// FUNCIONES DE API
// ─────────────────────────────────────────

/** Obtiene todos los códigos de defecto activos */
export async function getDefectCodes(): Promise<DefectCode[]> {
  const res = await api.get<DefectCode[]>(`${SCRAP_PREFIX}/defect-codes`);
  return res.data;
}

/** Lista registros de pérdida con filtros opcionales */
export async function getLosses(params?: {
  status?: string;
  product_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}): Promise<LossRecordListResponse> {
  const res = await api.get<LossRecordListResponse>(`${SCRAP_PREFIX}/losses`, { params });
  return res.data;
}

/** Obtiene el detalle de un registro de pérdida */
export async function getLossDetail(id: string): Promise<LossRecord> {
  const res = await api.get<LossRecord>(`${SCRAP_PREFIX}/losses/${id}`);
  return res.data;
}

/** Registra una nueva pérdida */
export async function registerLoss(data: LossCreateRequest): Promise<LossRecord> {
  const res = await api.post<LossRecord>(`${SCRAP_PREFIX}/losses`, data);
  return res.data;
}

/** Aprueba un registro de pérdida pendiente */
export async function approveLoss(id: string): Promise<LossRecord> {
  const res = await api.patch<LossRecord>(`${SCRAP_PREFIX}/losses/${id}/approve`);
  return res.data;
}

/** Rechaza un registro de pérdida */
export async function rejectLoss(id: string): Promise<LossRecord> {
  const res = await api.patch<LossRecord>(`${SCRAP_PREFIX}/losses/${id}/reject`);
  return res.data;
}

/** Obtiene el stock de scrap acumulado */
export async function getScrapStock(): Promise<ScrapStock[]> {
  const res = await api.get<ScrapStock[]>(`${SCRAP_PREFIX}/stock`);
  return res.data;
}


// ─────────────────────────────────────────
// Pending Product Incidences (aprobaciones)
// ─────────────────────────────────────────

const PENDING_PREFIX = '/api/v1/scrap';

export interface PendingProductIncidence {
  id: string;
  task_id: string;
  task_type?: string | null;
  product_id: string;
  product_name?: string | null;
  size: string;
  colour?: string | null;
  defect_code_id?: string | null;
  defect_code?: string | null;
  defect_name?: string | null;
  description?: string | null;  // Descripción libre del defecto
  quantity: number;
  observations?: string | null;
  status: string;
  approved_type?: string | null;
  employee_name?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
}

export interface PendingIncidenceListResponse {
  incidences: PendingProductIncidence[];
  total: number;
}

/** Lista incidencias de producto pendientes de aprobación */
export async function getPendingIncidences(statusFilter?: string): Promise<PendingIncidenceListResponse> {
  const params = statusFilter ? { status_filter: statusFilter } : {};
  const res = await api.get<PendingIncidenceListResponse>(`${PENDING_PREFIX}/pending-incidences`, { params });
  return res.data;
}

/** Aprueba una incidencia de producto con el tipo elegido */
export async function approvePendingIncidence(id: string, incidentType: string): Promise<PendingProductIncidence> {
  const res = await api.post<PendingProductIncidence>(`${PENDING_PREFIX}/pending-incidences/${id}/approve`, {
    incident_type: incidentType,
  });
  return res.data;
}

/** Rechaza una incidencia de producto */
export async function rejectPendingIncidence(id: string): Promise<PendingProductIncidence> {
  const res = await api.post<PendingProductIncidence>(`${PENDING_PREFIX}/pending-incidences/${id}/reject`);
  return res.data;
}