/**
 * Configuración centralizada de la URL del API
 * Single source of truth para todas las peticiones HTTP
 */

// En desarrollo con Vite proxy, usamos ruta relativa.
// En producción, nginx sirve ambos en el mismo dominio.
export const API_URL = import.meta.env.VITE_API_URL || "";

export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 10000,
} as const;
