/**
 * Archivo: fe/src/context/AuthContext.tsx
 * Descripción: Provider de React Context para gestionar estado de autenticación global.
 * 
 * ¿Qué?
 *   Provee AuthContext con:
 *   - Estado: user (UserResponse), accessToken, refreshToken, isLoading
 *   - Acciones: login(), register(), logout(), changePassword(), forgotPassword(), resetPassword()
 *   - Persistencia: sessionStorage para tokens, verificación automática al montar
 * 
 * ¿Para qué?
 *   - Centralizar lógica de autenticación (DRY, evitar prop drilling)
 *   - Proveer acceso global al usuario autenticado (useAuth() hook)
 *   - Manejar ciclo completo: login → sessionStorage → verificar → logout
 *   - Auto-redirigir según estado (ProtectedRoute depende de isAuthenticated)
 * 
 * ¿Impacto?
 *   CRÍTICO — Sin este contexto, NO hay autenticación funcional en frontend.
 *   Modificar métodos rompe: LoginPage, RegisterPage, AdminHeader,
 *   ProtectedRoute, Dashboard, cualquier componente que use useAuth().
 *   Dependencias: types/auth.ts (interfaces), modules/auth/services/api.ts,
 *                App.tsx (wrap con <AuthProvider>), hooks/useAuth.ts
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "@/modules/auth/services/api";
import { AuthContext } from "@/context/authContextDef";
import type {
  AuthContextType,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
} from "@/types/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(
    () => sessionStorage.getItem("access_token")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => sessionStorage.getItem("refresh_token")
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!accessToken;

  const saveTokens = useCallback((access: string, refresh: string) => {
    sessionStorage.setItem("access_token", access);
    sessionStorage.setItem("refresh_token", refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
  }, []);

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = sessionStorage.getItem("access_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [clearAuth]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const tokens = await authApi.loginUser(data);
      saveTokens(tokens.access_token, tokens.refresh_token);
      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    },
    [saveTokens]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      await authApi.registerUser(data);
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    await authApi.changePassword(data);
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    await authApi.forgotPassword(data);
  }, []);

  const resetPasswordAction = useCallback(async (data: ResetPasswordRequest) => {
    await authApi.resetPassword(data);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      changePassword,
      forgotPassword,
      resetPassword: resetPasswordAction,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      changePassword,
      forgotPassword,
      resetPasswordAction,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
