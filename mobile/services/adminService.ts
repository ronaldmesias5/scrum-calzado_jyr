import { apiClient } from '@/services/apiClient';
import type {
  AdminUser,
  CreateEmployeeRequest,
  CreateClientRequest,
  UpdateUserRequest,
  RejectUserRequest,
  ReactivationTicket,
} from '@/types/users';

export type { AdminUser } from '@/types/users';

export async function listAllUsers(role?: string): Promise<AdminUser[]> {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  const { data } = await apiClient.get<AdminUser[]>('/admin/users', { params });
  return data ?? [];
}

export async function listClients(): Promise<AdminUser[]> {
  return listAllUsers('client');
}

export async function listPendingValidation(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/admin/users/pending-validation');
  return data ?? [];
}

export async function getUserDetail(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUser>(`/admin/users/${userId}`);
  return data;
}

export async function validateUser(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${userId}/validate`);
  return data;
}

export async function rejectUser(
  userId: string,
  body: RejectUserRequest,
): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(
    `/admin/users/${userId}/reject`,
    body,
  );
  return data;
}

export async function updateUser(
  userId: string,
  body: UpdateUserRequest,
): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${userId}`, body);
  return data;
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/admin/users/${userId}`,
  );
  return data;
}

export async function createEmployee(body: CreateEmployeeRequest): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>('/admin/users/create-employee', body);
  return data;
}

export async function createClient(body: CreateClientRequest): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>('/admin/users/create-client', body);
  return data;
}

export async function renewInvitation(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>(
    `/admin/users/${userId}/renew-invitation`,
  );
  return data;
}

export async function forcePasswordChange(
  userId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    `/admin/users/${userId}/force-password-change`,
  );
  return data;
}

export async function listReactivationTickets(
  status?: string,
): Promise<ReactivationTicket[]> {
  const params: Record<string, string> = {};
  if (status) params.status_filter = status;
  const { data } = await apiClient.get<ReactivationTicket[]>(
    '/admin/reactivation-tickets',
    { params },
  );
  return data ?? [];
}

export async function approveReactivationTicket(
  ticketId: string,
  comment: string,
): Promise<ReactivationTicket> {
  const { data } = await apiClient.patch<ReactivationTicket>(
    `/admin/reactivation-tickets/${ticketId}/approve`,
    { comment },
  );
  return data;
}

export async function rejectReactivationTicket(
  ticketId: string,
  comment: string,
): Promise<ReactivationTicket> {
  const { data } = await apiClient.patch<ReactivationTicket>(
    `/admin/reactivation-tickets/${ticketId}/reject`,
    { comment },
  );
  return data;
}
