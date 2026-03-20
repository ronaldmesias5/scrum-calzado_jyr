/**
 * Archivo: fe/src/api/axios.ts
 * Descripción: Instancia configurada de Axios con interceptores para toda la aplicación.
 * 
 * ¿Qué?
 *   Configura cliente HTTP con:
 *   - baseURL: VITE_API_URL (localhost:8000 por defecto)
 *   - Interceptor request: Añade Authorization: Bearer <token> automáticamente
 *   - Interceptor response: Maneja errores 422 (validación), 401, errores de red
 *   - Timeout: 10 segundos (previene esperas infinitas)
 * 
 * ¿Para qué?
 *   - Centralizar configuración HTTP (DRY, no repetir en cada archivo)
 *   - Automatizar inyección de JWT token (no pasar manualmente en cada request)
 *   - Estandarizar manejo de errores (mismo formato en toda la app)
 *   - Facilitar cambio de API URL (solo cambiar .env)
 * 
 * ¿Impacto?
 *   CRÍTICO — TODA comunicación con backend pasa por aquí.
 *   Modificar interceptors rompe: manejo de errores en TODOS los módulos.
 *   Cambiar baseURL sin actualizar VITE_API_URL rompe: conexión con backend.
 *   Dependencias: modules/auth/services/api.ts (importa esta instancia),
 *                modules/dashboard-jefe/services/*, sessionStorage (tokens)
 */

import axios from "axios";
import { API_CONFIG } from "../config/api";

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_CONFIG.timeout,
  withCredentials: true,
});

// Interceptor de request eliminado porque usamos HttpOnly cookies

// Interceptor de response — maneja errores HTTP de forma centralizada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const data = error.response.data;

      if (error.response.status === 422 && Array.isArray(data.detail)) {
        const messages = data.detail.map(
          (err: { msg: string }) => err.msg
        );
        error.message = messages.join(". ");
      } else if (typeof data.detail === "string") {
        error.message = data.detail;
      }
    } else if (error.request) {
      error.message = "No se pudo conectar con el servidor";
    }
    return Promise.reject(error);
  }
);

export default api;
