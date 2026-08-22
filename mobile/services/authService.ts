import { apiClient } from '@/services/apiClient';
import type { LoginRequest, TokenResponse, UserResponse } from '@/types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const { data: response } = await apiClient.post<TokenResponse>('/auth/login', data);
    return response;
  },

  async me(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>('/users/me');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },
};