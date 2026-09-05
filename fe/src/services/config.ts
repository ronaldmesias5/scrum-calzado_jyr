/**
 * Configuración centralizada de la URL del API
 * Single source of truth para todas las peticiones HTTP
 */

// En desarrollo con Vite proxy, usamos ruta relativa.
// En producción, nginx sirve ambos en el mismo dominio.
export const API_URL = import.meta.env.VITE_API_URL || '';

// Cuando VITE_USE_PROXY=true, axios usa URLs relativas (mismo origen)
// y Vite reenvía /api al backend. Esto evita CORS/preflights y los
// cortes de conexión del port-forward hacia :8000 en Docker Desktop.
// API_URL se mantiene absoluto para <img> y WebSocket (no hacen preflight).
const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true';

export const API_CONFIG = {
  baseURL: USE_PROXY ? '' : API_URL,
  timeout: 10000
} as const;
