import axios from "axios";
import { API_CONFIG } from "../config/api";

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: API_CONFIG.timeout,
  withCredentials: true,
});

// ─── Estado para refresh token ─────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

function forceLogout() {
  if (!sessionStorage.getItem("access_token")) return;
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

function handleHttpError(error: unknown) {
  const err = error as { response?: { status: number; data: { detail: unknown } }; request?: unknown; message?: string };
  if (err.response) {
    const data = err.response.data;
    if (err.response.status === 422 && Array.isArray(data.detail)) {
      err.message = data.detail.map((e: { msg: string }) => e.msg).join(". ");
    } else if (typeof data.detail === "string") {
      err.message = data.detail;
    }
  } else if (err.request) {
    err.message = "No se pudo conectar con el servidor";
  }
  return Promise.reject(error);
}

// ─── Request: inyecta token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response: refresh automático en 401 ──────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return handleHttpError(error);
    }

    // No reintentar si falló el propio refresh
    if (typeof originalRequest.url === "string" && originalRequest.url.includes("/auth/refresh")) {
      forceLogout();
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    // Iniciar refresh
    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = sessionStorage.getItem("refresh_token");
    if (!storedRefreshToken) {
      isRefreshing = false;
      return handleHttpError(error);
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/v1/auth/refresh`,
        { refresh_token: storedRefreshToken },
      );

      const { access_token, refresh_token } = response.data;
      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("refresh_token", refresh_token);
      window.dispatchEvent(new CustomEvent("auth:token-refreshed"));

      processQueue(null, access_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
