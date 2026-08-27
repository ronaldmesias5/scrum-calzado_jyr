/** Tipos para el dashboard del empleado */

export interface EmployeeMetric {
  label: string;
  value: number;
  icon: string;
}

export interface EmployeeMetricsResponse {
  metrics: EmployeeMetric[];
}

export interface EmployeeTask {
  id: string;
  order_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_image?: string | null;
  product_category?: string | null;
  line_group?: number;
  assigned_to?: string | null;
  assigned_user_name?: string | null;
  assigned_user_occupation?: string | null;
  type: string;
  status: string;
  priority?: string;
  vale_number?: number | null;
  amount: number;
  description?: string | null;
  observation?: string | null;
  created_at?: string | null;
  deadline?: string | null;
  task_prices?: Record<string, number>;
}

export interface EmployeeTaskListResponse {
  tasks: EmployeeTask[];
  total: number;
}

export interface EmployeeIncidence {
  id: string;
  task_id: string;
  type_incidence: string;
  description?: string | null;
  state: string;
  report_date?: string | null;
  created_at?: string | null;
}

export interface EmployeeIncidenceListResponse {
  incidences: EmployeeIncidence[];
  total: number;
}

export interface AvailableTask {
  id: string;
  order_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_image?: string | null;
  product_category?: string | null;
  line_group?: number;
  type: string;
  status: string;
  priority?: string;
  vale_number?: number | null;
  amount: number;
  description?: string | null;
  created_at?: string | null;
  deadline?: string | null;
  task_prices?: Record<string, number>;
}

export interface AvailableTaskListResponse {
  tasks: AvailableTask[];
  total: number;
}

// ──────────────────────────────────────
// Vale de producción (vista empleado)
// ──────────────────────────────────────

export interface ValeTaskInfo {
  id: string;
  type: string;
  status: string;
  amount: number;
  assigned_user_name: string | null;
  assigned_user_occupation: string | null;
  observation: string | null;
  is_mine: boolean;
  price_per_dozen: number;
  total_cost: number;
}

export interface ValeDetailItem {
  size: string;
  amount: number;
}

export interface ValeResponse {
  order_id: string;
  customer_name: string | null;
  customer_last_name: string | null;
  product_id: string;
  product_name: string | null;
  product_image: string | null;
  product_category: string | null;
  vale_number: number | null;
  line_group: number;
  total_pairs: number;
  details: ValeDetailItem[];
  tasks: ValeTaskInfo[];
}

// ──────────────────────────────────────
// Incidencias generales (maquinaria/insumo)
// ──────────────────────────────────────

export interface GeneralIncidence {
  id: string;
  incidence_category: string;
  machinery_name: string | null;
  supply_id: string | null;
  supply_name: string | null;
  custom_supply_name: string | null;
  observations: string | null;
  incident_type: string;
  registered_by_name: string | null;
  created_at: string | null;
}

export interface GeneralIncidenceListResponse {
  incidences: GeneralIncidence[];
  total: number;
}

export interface GeneralIncidenceCreateRequest {
  incidence_category: string;
  machinery_name?: string;
  supply_id?: string;
  custom_supply_name?: string;
  observations?: string;
}

// ──────────────────────────────────────
// Incidencias de producto (pendientes de aprobación)
// ──────────────────────────────────────

export interface ProductIncidence {
  id: string;
  task_id: string;
  task_type?: string | null;
  product_id: string;
  product_name?: string | null;
  size: string;
  colour?: string | null;
  defect_code_id?: string | null;  // Ahora opcional — puede usar description en su lugar
  defect_code?: string | null;
  defect_name?: string | null;
  description?: string | null;  // Descripción libre del defecto
  quantity: number;
  observations?: string | null;
  status: string; // pending, approved, rejected
  approved_type?: string | null;
  employee_name?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
}

export interface ProductIncidenceListResponse {
  incidences: ProductIncidence[];
  total: number;
}

export interface ProductIncidenceCreateRequest {
  task_id: string;
  size: string;
  colour?: string;
  defect_code_id?: string;  // Opcional — ahora se usa description como alternativa
  description?: string;  // Descripción libre del defecto
  quantity: number;
  observations?: string;
}

export interface ApproveProductIncidenceRequest {
  incident_type: string; // perdida, en_reparacion, devuelto
}
