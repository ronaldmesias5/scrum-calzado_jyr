/**
 * Service: lossService.ts
 * Endpoints para gestión de incidencias por calzado defectuoso (scrap/incidents module)
 */

import api from '@/api/axios';

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export type IncidenceCategory = 'producto' | 'maquinaria' | 'insumo';

export interface DefectCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export type IncidentType = 'perdida' | 'en_reparacion' | 'reparado' | 'devuelto' | 'falla' | 'faltante' | 'solucionado';

export interface SupplyInfo {
  id: string;
  name_supplies: string;
}

export interface IncidentRecord {
  id: string;
  incidence_category: IncidenceCategory;
  product_id?: string | null;
  product?: { id: string; name_product: string; image_url?: string };
  size?: string | null;
  colour?: string;
  quantity: number;
  machinery_name?: string | null;
  supply_id?: string | null;
  supply?: SupplyInfo | null;
  custom_supply_name?: string | null;
  incident_type: IncidentType;
  defect_code?: DefectCode;
  description?: string;  // Descripción libre del defecto
  reason?: string;
  observations?: string;
  registered_by_id: string;
  registered_by?: { id: string; name_user: string; last_name: string };
  approved_by_id?: string;
  approved_at?: string;
  order_id?: string;
  order?: { id: string; customer_id?: string };
  order_detail_id?: string;
  line_group?: number;
  repaired_at?: string;
  repaired_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreateRequest {
  incidence_category?: IncidenceCategory;
  product_id?: string;
  size?: string;
  colour?: string;
  quantity?: number;
  machinery_name?: string;
  supply_id?: string;
  custom_supply_name?: string;
  incident_type?: IncidentType;
  defect_code_id?: string;
  description?: string;  // Descripción libre del defecto (reemplaza defect_code_id)
  reason?: string;
  observations?: string;
  order_id?: string;
  order_detail_id?: string;
  line_group?: number;
}

export interface IncidentListResponse {
  items: IncidentRecord[];
  total: number;
}

export interface ScrapStockItem {
  id: string;
  product_id: string;
  size: string;
  colour?: string;
  quantity: number;
  description?: string;
  defect_code?: DefectCode;
  loss_record_id?: string;
  created_at: string;
}

// ─────────────────────────────────────────
// CÓDIGOS DE DEFECTO
// ─────────────────────────────────────────

export const getDefectCodes = () =>
  api.get<DefectCode[]>('/api/v1/scrap/defect-codes').then(r => r.data);

export const createDefectCode = (data: { code: string; name: string; description?: string }) =>
  api.post<DefectCode>('/api/v1/scrap/defect-codes', data).then(r => r.data);

// ─────────────────────────────────────────
// REGISTROS DE INCIDENCIAS
// ─────────────────────────────────────────

export const getIncidents = (params: {
  incident_type?: string;
  product_id?: string;
  date_from?: string;
  date_to?: string;
  incidence_category?: string;
  limit?: number;
  offset?: number;
}) =>
  api
    .get<IncidentListResponse>('/api/v1/scrap/losses', { params })
    .then(r => r.data);

export const createIncident = (data: IncidentCreateRequest) =>
  api.post<IncidentRecord>('/api/v1/scrap/losses', data).then(r => r.data);

export const approveIncident = (id: string) =>
  api.patch<IncidentRecord>(`/api/v1/scrap/losses/${id}/approve`).then(r => r.data);

export const rejectIncident = (id: string) =>
  api.patch<IncidentRecord>(`/api/v1/scrap/losses/${id}/reject`).then(r => r.data);

export const repairIncident = (id: string, repairDestination: string = 'stock') =>
  api.patch<IncidentRecord>(`/api/v1/scrap/losses/${id}/repair`, { repair_destination: repairDestination }).then(r => r.data);

export const solveIncident = (id: string) =>
  api.patch<IncidentRecord>(`/api/v1/scrap/losses/${id}/solve`).then(r => r.data);

// ─────────────────────────────────────────
// STOCK DE RECUPERABLES
// ─────────────────────────────────────────

export const getScrapStock = () =>
  api.get<ScrapStockItem[]>('/api/v1/scrap/stock').then(r => r.data);

// ─────────────────────────────────────────
// INSUMOS (para dropdown en formulario)
// ─────────────────────────────────────────

export interface SupplyItem {
  id: string;
  name: string;
  stock_quantity: number;
  unit?: string;
  color?: string;
}

export interface SuppliesListResponse {
  items: SupplyItem[];
  total: number;
}

export const getSupplies = () =>
  api.get<SuppliesListResponse>('/api/v1/supplies').then(r => r.data.items);
