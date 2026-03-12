/**
 * Archivo: utils/routing.ts
 * Descripción: Utilidades para redirección basada en rol y ocupación del usuario.
 * ¿Para qué? Centralizar la lógica de navegación para evitar duplicados.
 */

import type { UserResponse } from "@/types/auth";

/**
 * Determina la ruta del dashboard según el rol y ocupación del usuario.
 * 
 * Lógica:
 * - Admin: /dashboard/admin
 * - Jefe (employee + occupation='jefe'): /dashboard/admin
 * - Employee (otros): /dashboard/employee (cuando esté implementado)
 * - Client: /dashboard/client (cuando esté implementado)
 * - Default: /dashboard (legacy)
 */
export function getDashboardRoute(user: UserResponse | null): string {
  if (!user || !user.role_name) {
    return "/";
  }

  const role = user.role_name;
  const occupation = user.occupation;

  // Admin siempre va al dashboard administrativo
  if (role === "admin") {
    return "/dashboard/admin";
  }

  // Jefe (employee con occupation='jefe') va al dashboard administrativo
  if (role === "employee" && occupation === "jefe") {
    return "/dashboard/admin";
  }

  // Otros empleados van a su dashboard de tareas
  if (role === "employee") {
    return "/dashboard/employee"; // TODO: Implementar en futuros sprints
  }

  // Clientes van a su dashboard de catálogo y pedidos
  if (role === "client") {
    return "/dashboard/client"; // TODO: Implementar en Sprint 4
  }

  // Fallback para roles desconocidos
  return "/dashboard";
}

/**
 * Retorna el título del dashboard según el rol/ocupación.
 */
export function getDashboardTitle(user: UserResponse | null): string {
  if (!user || !user.role_name) {
    return "Dashboard";
  }

  const role = user.role_name;
  const occupation = user.occupation;

  if (role === "admin") {
    return "Panel Administrativo";
  }

  if (role === "employee" && occupation === "jefe") {
    return "Panel de Jefe";
  }

  if (role === "employee") {
    return "Panel de Empleado";
  }

  if (role === "client") {
    return "Panel de Cliente";
  }

  return "Dashboard";
}
