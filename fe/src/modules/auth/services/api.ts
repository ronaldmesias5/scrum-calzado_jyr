/**
 * Archivo: fe/src/modules/auth/services/api.ts
 * Descripción: Cliente HTTP para endpoints de autenticación del backend.
 * 
 * ¿Qué?
 *   Exporta 7 funciones async que llaman endpoints de backend:
 *   - registerUser(): POST /api/v1/auth/register
 *   - loginUser(): POST /api/v1/auth/login → retorna tokens
 *   - refreshToken(): POST /api/v1/auth/refresh
 *   - changePassword(): POST /api/v1/auth/change-password
 *   - forgotPassword(): POST /api/v1/auth/forgot-password
 *   - resetPassword(): POST /api/v1/auth/reset-password
 *   - getMe(): GET /api/v1/users/me
 * 
 * ¿Para qué?
 *   - Encapsular lógica HTTP de auth (separación de capas)
 *   - Type safety con interfaces TypeScript (Request/Response)
 *   - Reutilizar en AuthContext, LoginPage, RegisterPage, etc.
 *   - Facilitar testing (mockear estas funciones)
 * 
 * ¿Impacto?
 *   CRÍTICO — AuthContext depende 100% de estas funciones.
 *   Modificar firmas rompe: context/AuthContext.tsx, hooks/useAuth.ts,
 *   todas las páginas de autenticación (LoginPage, RegisterPage, etc.).
 *   Dependencias: api/axios.ts (instancia configurada), types/auth.ts
 */

import api from "@/api/axios";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
  UserResponse,
} from "@/types/auth";

const AUTH_PREFIX = "/api/v1/auth";
const USERS_PREFIX = "/api/v1/users";

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>(`${AUTH_PREFIX}/register`, data);
  return response.data;
}

export async function loginUser(data: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>(`${AUTH_PREFIX}/login`, data);
  return response.data;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>(`${AUTH_PREFIX}/refresh`, data);
  return response.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>(`${AUTH_PREFIX}/change-password`, data);
  return response.data;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>(`${AUTH_PREFIX}/forgot-password`, data);
  return response.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>(`${AUTH_PREFIX}/reset-password`, data);
  return response.data;
}

export async function getMe(): Promise<UserResponse> {
  const response = await api.get<UserResponse>(`${USERS_PREFIX}/me`);
  return response.data;
}
