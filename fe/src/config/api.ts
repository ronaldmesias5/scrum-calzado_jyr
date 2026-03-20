/**
 * Configuración centralizada de la URL del API
 * Single source of truth para todas las peticiones HTTP
 */

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 10000,
} as const;
