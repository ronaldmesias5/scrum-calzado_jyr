export type IncidenceCategory = 'producto' | 'maquinaria' | 'insumo';
export type IncidentType =
  | 'perdida'
  | 'en_reparacion'
  | 'reparado'
  | 'devuelto'
  | 'falla'
  | 'faltante'
  | 'solucionado'
  | 'rechazado';
export type PendingIncidenceStatus = 'pending' | 'approved' | 'rejected';

export interface DefectCode {
  id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface LossRecord {
  id: string;
  incidence_category: IncidenceCategory;
  product_id: string | null;
  product: {
    id: string;
    name_product: string;
    image_url: string | null;
  } | null;
  size: string | null;
  colour: string | null;
  quantity: number;
  machinery_name: string | null;
  supply_id: string | null;
  supply: { id: string; name_supplies: string } | null;
  custom_supply_name: string | null;
  incident_type: IncidentType;
  defect_code: DefectCode | null;
  description: string;
  reason: string | null;
  observations: string | null;
  registered_by_id: string;
  registered_by: { id: string; name_user: string; last_name: string } | null;
  approved_by_id: string | null;
  approved_at: string | null;
  order_id: string | null;
  order: { id: string; customer_id: string } | null;
  order_detail_id: string | null;
  line_group: number | null;
  repaired_at: string | null;
  repaired_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentListResponse {
  items: LossRecord[];
  total: number;
}

export interface ScrapStock {
  id: string;
  product_id: string;
  size: string;
  colour: string | null;
  quantity: number;
  defect_code: DefectCode | null;
  loss_record_id: string;
  created_at: string;
  updated_at: string;
}

export interface PendingIncidence {
  id: string;
  task_id: string | null;
  task_type: string | null;
  product_id: string | null;
  product_name: string | null;
  size: string | null;
  colour: string | null;
  defect_code_id: string | null;
  defect_code: string | null;
  defect_name: string | null;
  description: string;
  quantity: number;
  observations: string | null;
  status: PendingIncidenceStatus;
  approved_type: IncidentType | null;
  rejection_reason: string | null;
  evidence_image_url: string | null;
  employee_name: string | null;
  customer_name: string | null;
  order_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ProductIncidenceListResponse {
  incidences: PendingIncidence[];
  total: number;
}

export interface CreateIncidentRequest {
  incidence_category: IncidenceCategory;
  product_id?: string;
  size?: string;
  colour?: string;
  quantity?: number;
  machinery_name?: string;
  supply_id?: string;
  custom_supply_name?: string;
  incident_type: IncidentType;
  defect_code_id?: string;
  description: string;
  reason?: string;
  observations?: string;
  order_id?: string;
  order_detail_id?: string;
  line_group?: number;
}

export interface RepairRequest {
  repair_destination: 'stock' | 'reserva' | 'customer_return';
}

export interface ApprovePendingRequest {
  incident_type: IncidentType;
}
