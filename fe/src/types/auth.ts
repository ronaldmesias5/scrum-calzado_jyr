/**
 * Archivo: fe/src/types/auth.ts
 * Descripción: Tipos e interfaces TypeScript para sistema de autenticación.
 * 
 * ¿Qué?
 *   Define 15+ interfaces TypeScript que espeja backend schemas:
 *   - Request: LoginRequest, RegisterRequest, ChangePasswordRequest, etc.
 *   - Response: UserResponse, TokenResponse, MessageResponse
 *   - Enums: OccupationType (jefe, cortador, etc.)
 *   - Context: AuthContextType (para AuthContext)
 * 
 * ¿Para qué?
 *   - Type safety en todo el flujo de autenticación
 *   - Contrato explícito entre frontend y backend (evitar errores de API)
 *   - Autocompletado en IDE (developer experience)
 *   - Validación en tiempo de compilación (TypeScript)
 * 
 * ¿Impacto?
 *   CRÍTICO — Modificar interfaces rompe TODO el sistema si no coincide con backend.
 *   Añadir campo en UserResponse requiere: backend UserResponse schema + BD migration.
 *   Cambiar OccupationType rompe: formularios admin, validaciones, dashboards.
 *   Dependencias: modules/auth/services/api.ts (consume estas interfaces),
 *                context/AuthContext.tsx, todos los componentes de auth
 */

// ════════════════════════════════════════
// � Tipos de Documento
// ════════════════════════════════════════

export interface TypeDocument {
  id: string;
  name: string;
}

// ════════════════════════════════════════
// 📥 Tipos de REQUEST
// ════════════════════════════════════════

export interface RegisterRequest {
  email: string;
  name: string;
  last_name: string;
  phone?: string;
  identity_document?: string;
  identity_document_type_id?: string;
  business_name?: string;
  password: string;
  accepted_terms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ════════════════════════════════════════
// 📤 Tipos de RESPONSE
// ════════════════════════════════════════

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
  role_name: string | null;
  business_name: string | null;
  occupation: string | null;
  accepted_terms: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

// ════════════════════════════════════════
// 🔧 Tipos internos del frontend
// ════════════════════════════════════════

export interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<UserResponse>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  logoutAllDevices: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
}

export interface ApiError {
  detail: string | ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
