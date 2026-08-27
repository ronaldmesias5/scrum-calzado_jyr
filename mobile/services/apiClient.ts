import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { API_URL } from '@/constants/api';
import { emitSessionExpired } from '@/services/sessionEvents';
import { tokenStorage } from '@/services/tokenStorage';
import type { TokenResponse } from '@/types/auth';

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

function setAuthorization(config: RetriableConfig, token: string | null): void {
  if (!config.headers) {
    config.headers = {};
  }
  (config.headers as Record<string, unknown>).Authorization = token
    ? `Bearer ${token}`
    : undefined;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    setAuthorization(config as RetriableConfig, token);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthRequest = original?.url?.startsWith('/auth/') ?? false;

    if (!original || status !== 401 || original._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          setAuthorization(original, token);
          return apiClient(original);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      emitSessionExpired();
      return Promise.reject(error);
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<TokenResponse>(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });
      await tokenStorage.setTokens(data.access_token, data.refresh_token);
      processQueue(null, data.access_token);
      setAuthorization(original, data.access_token);
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await tokenStorage.clearTokens();
      emitSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);