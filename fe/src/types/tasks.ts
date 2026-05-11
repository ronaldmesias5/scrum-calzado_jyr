/**
 * Archivo: fe/src/types/tasks.ts
 * Descripción: Tipos centralizados para tareas de producción.
 */

export type TaskPriority = 'baja' | 'media' | 'alta';
export type TaskType = 'corte' | 'guarnicion' | 'soladura' | 'emplantillado';
export type TaskStatus = 'pendiente' | 'por_liquidar' | 'en_progreso' | 'completado' | 'pagado' | 'cancelado';

export interface ProductionTask {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  amount: number;
  price_per_pair?: number;
  total_price?: number;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
}

export interface ProductionBatchTasksRequest {
  product_id: string;
  option: 'A' | 'B';
  tasks: Array<{
    task_type: TaskType;
    assigned_to?: string;
    amount: number;
  }>;
}
