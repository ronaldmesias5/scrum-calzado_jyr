/**
 * Archivo: modules/dashboard-jefe/services/adminApi.ts
 * Descripción: Servicio API para endpoints de administración de usuarios.
 * ¿Para qué? Aprobar cuentas pendientes y crear empleados/clientes desde el dashboard.
 */

import api from "@/api/axios";
import type { UserResponse } from "@/types/auth";

const ADMIN_PREFIX = "/api/v1/admin";

// ────────────────────────────────────────────────
// Tipos de request
// ────────────────────────────────────────────────

export interface CreateEmployeeRequest {
  email: string;
  name: string;
  last_name: string;
  phone?: string;
  identity_document?: string;
  identity_document_type_id?: string;
  occupation: "cortador" | "guarnecedor" | "solador" | "emplantillador" | "jefe";
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
  occupation?: string;
  business_name?: string;
  is_active?: boolean;
}

// ────────────────────────────────────────────────
// Funciones de API
// ────────────────────────────────────────────────

/** Obtiene todos los usuarios. Filtro opcional por rol: 'client' | 'employee' | 'admin' */
export async function getAllUsers(role?: string): Promise<UserResponse[]> {
  const params = role ? { role } : {};
  const response = await api.get<UserResponse[]>(`${ADMIN_PREFIX}/users`, { params });
  return response.data;
}

/** Obtiene el detalle de un usuario específico */
export async function getUserDetail(userId: string): Promise<UserResponse> {
  const response = await api.get<UserResponse>(`${ADMIN_PREFIX}/users/${userId}`);
  return response.data;
}

/** Actualiza los datos de un usuario */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`${ADMIN_PREFIX}/users/${userId}`, data);
  return response.data;
}

/** Obtiene usuarios pendientes de validación */
export async function getPendingUsers(): Promise<UserResponse[]> {
  const response = await api.get<UserResponse[]>(`${ADMIN_PREFIX}/users/pending-validation`);
  return response.data;
}

/** Aprueba la cuenta de un usuario pendiente */
export async function validateUser(userId: string): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`${ADMIN_PREFIX}/users/${userId}/validate`);
  return response.data;
}

/** Rechaza una solicitud de registro con motivo */
export async function rejectUser(userId: string, reason: string): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`${ADMIN_PREFIX}/users/${userId}/reject`, { reason });
  return response.data;
}

/** Elimina un usuario (hard delete) */
export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`${ADMIN_PREFIX}/users/${userId}`);
  return response.data;
}

/** Crea una cuenta de empleado (activa de inmediato, must_change_password=true) */
export async function createEmployee(data: CreateEmployeeRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>(`${ADMIN_PREFIX}/users/create-employee`, data);
  return response.data;
}

/** Crea una cuenta de cliente (activa y validada de inmediato) */
export async function createClient(data: CreateClientRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>(`${ADMIN_PREFIX}/users/create-client`, data);
  return response.data;
}

// ────────────────────────────────────────────────
// Reactivación de cuentas (RF-005)
// ────────────────────────────────────────────────

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

/** Obtiene todos los tickets de reactivación (filtro opcional por status) */
export async function getReactivationTickets(status?: string): Promise<ReactivationTicket[]> {
  const params = status ? { status_filter: status } : {};
  const response = await api.get<ReactivationTicket[]>(`${ADMIN_PREFIX}/reactivation-tickets`, { params });
  return response.data;
}

/** Aprueba un ticket de reactivación */
export async function approveReactivation(ticketId: string, comment: string): Promise<ReactivationTicket> {
  const response = await api.patch<ReactivationTicket>(
    `${ADMIN_PREFIX}/reactivation-tickets/${ticketId}/approve`,
    { comment }
  );
  return response.data;
}

/** Rechaza un ticket de reactivación */
export async function rejectReactivation(ticketId: string, comment: string): Promise<ReactivationTicket> {
  const response = await api.patch<ReactivationTicket>(
    `${ADMIN_PREFIX}/reactivation-tickets/${ticketId}/reject`,
    { comment }
  );
  return response.data;
}

// ────────────────────────────────────────────────
// Renovación de invitación
// ────────────────────────────────────────────────

/** Renueva la invitación de un usuario (genera nueva contraseña temporal) */
export async function renewInvitation(userId: string): Promise<UserResponse> {
  const response = await api.post<UserResponse>(`${ADMIN_PREFIX}/users/${userId}/renew-invitation`);
  return response.data;
}
