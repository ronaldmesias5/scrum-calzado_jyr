export type Role = 'admin' | 'employee' | 'client';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  last_name: string;
  phone: string | null;
  identity_document: string | null;
  identity_document_type_id: string | null;
  identity_document_type_name: string | null;
  is_active: boolean;
  is_validated: boolean;
  must_change_password: boolean;
  invitation_expires_at: string | null;
  role_name: Role | null;
  business_name: string | null;
  occupation: string | null;
  avatar_url: string | null;
  accepted_terms: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  temporary_password: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}