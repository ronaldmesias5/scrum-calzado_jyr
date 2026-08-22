import { create } from 'zustand';

import { authService } from '@/services/authService';
import { onSessionExpired } from '@/services/sessionEvents';
import { tokenStorage } from '@/services/tokenStorage';
import type { LoginRequest, TokenResponse, UserResponse } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (data: LoginRequest) => Promise<UserResponse>;
  hydrate: () => Promise<void>;
  setTokens: (tokens: TokenResponse) => void;
  setUser: (user: UserResponse) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  setTokens: (tokens) => {
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
  },

  setUser: (user) => set({ user }),

  login: async (data) => {
    const tokens = await authService.login(data);
    await tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    const user = await authService.me();
    set({ user, isAuthenticated: true });
    return user;
  },

  hydrate: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!accessToken || !refreshToken) {
        return;
      }
      set({ accessToken, refreshToken, isAuthenticated: true });
      const user = await authService.me();
      set({ user });
    } catch {
      await get().logout();
    } finally {
      set({ isHydrating: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignorar errores de red al cerrar sesión
    }
    await tokenStorage.clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));

onSessionExpired(() => {
  void useAuthStore.getState().logout();
});