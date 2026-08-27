import type { Role } from './auth';

export type OccupationType = 'jefe' | 'cortador' | 'guarnecedor' | 'solador' | 'emplantillador';

export interface AdminUser extends Omit<import('./auth').UserResponse, 'role_name'> {
  role_name: Role | null;
}

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  phone: string | null;
  identity_document: string | null;
  is_active: boolean;
  is_validated: boolean;
  must_change_password: boolean;
  role_name: Role | null;
  occupation: string | null;
  created_at: string;
}

export interface CreateEmployeeRequest {
  email: string;
  name: string;
  last_name: string;
  phone?: string;
  identity_document?: string;
  identity_document_type_id?: string;
  occupation: OccupationType;
  password?: string;
}

export interface CreateClientRequest {
  email: string;
  name: string;
  last_name: string;
  phone?: string;
  identity_document?: string;
  identity_document_type_id?: string;
  business_name?: string;
  password?: string;
}

export interface UpdateUserRequest {
  name?: string;
  last_name?: string;
  phone?: string;
  identity_document?: string;
  identity_document_type_id?: string;
  occupation?: OccupationType;
  business_name?: string;
  is_active?: boolean;
}

export interface RejectUserRequest {
  reason: string;
}

export interface ReactivationTicket {
  id: string;
  user_id: string;
  email: string;
  reason: string;
  phone: string;
  identity_document: string;
  evidence_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
