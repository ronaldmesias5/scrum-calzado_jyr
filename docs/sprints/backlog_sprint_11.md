# Backlog Sprint 11 — Ejecución del Empleado

**Sprint:** 11  
**Duración:** 2 semanas  
**SP Total:** 16  
**Fecha:** Junio 2026  
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-023 | Consulta de Tareas por Empleado | 8 | ✅ COMPLETADO |
| HU-025 | Confirmación de Finalización | 8 | ✅ COMPLETADO |

## HU-023: Consulta de Tareas por Empleado

El empleado puede consultar sus tareas asignadas, las tareas disponibles para reclamar, y visualizar el vale de producción de cada tarea.

**Criterios de Aceptación:**
- El empleado autenticado puede ver una lista de sus tareas asignadas
- La lista se puede filtrar por estado (`pendiente`, `en_progreso`, `completado`) y por tipo (`corte`, `guarnicion`, `soladura`, `emplantillado`)
- El empleado puede ver las tareas disponibles no asignadas que coinciden con su ocupación
- El empleado puede descargar/visualizar el vale de producción (`vale_number`) de una tarea específica
- El vale de producción incluye: número de vale, producto, talla, cantidad, tipo de tarea, fecha de creación, y código QR
- El dashboard principal muestra un resumen con conteo de tareas pendientes, en progreso, completadas e incidencias abiertas
- Las rutas del dashboard empleado están protegidas por autenticación y rol

**Tareas:**
1. Implementar `GET /dashboard/employee/tasks` (líneas 137-205) con filtros `status` y `type`
2. Implementar `GET /dashboard/employee/available-tasks` (líneas 272-323) filtrado por ocupación
3. Implementar `GET /dashboard/employee/tasks/{id}/vale` (líneas 399-510) con datos completos del vale
4. Implementar `GET /dashboard/employee` (línea 53) con resumen de dashboard (conteos por estado)
5. Crear frontend `DashboardPage.tsx` en dashboard-empleado con resumen y KPIs
6. Crear frontend `TasksPage.tsx` en dashboard-empleado con tabla y filtros
7. Crear frontend `AvailableTasksPage.tsx` con tareas disponibles
8. Integrar visualización de vale de producción por tarea

## HU-025: Confirmación de Finalización

El empleado o jefe puede marcar una tarea como completada, lo que dispara la creación automática de la siguiente etapa de producción y, al completar el emplantillado, actualiza el inventario.

**Criterios de Aceptación:**
- El empleado asignado o el jefe pueden marcar una tarea como `completado`
- Al completar una tarea, se verifica que no esté ya completada o cancelada
- Al completar `corte`, se crea automáticamente la tarea de `guarnicion` (si no existe)
- Al completar `guarnicion`, se crea automáticamente la tarea de `soladura` (si no existe)
- Al completar `soladura`, se crea automáticamente la tarea de `emplantillado` (si no existe)
- Al completar `emplantillado`, el inventario de producto se actualiza automáticamente:
  - Se incrementa `inventory.amount` en la cantidad de la tarea
  - Se incrementa `inventory.reserved` en la cantidad de la tarea
  - Se registra un movimiento de inventario de tipo `produccion`
- La tarea hija (siguiente etapa) hereda: `order_id`, `product_id`, `line_group`, `amount`, `vale_number`
- El frontend tiene un botón "Completar" en la tarea que cambia el estado

**Tareas:**
1. Implementar `PATCH /admin/orders/tasks/{task_id}/status` (líneas 1121-1289) en `orders/router.py`
2. Lógica de auto-creación de siguiente etapa según el orden secuencial
3. Al completar `emplantillado`: actualizar inventario y crear movimiento
4. Implementar `employeeApi.ts` con `updateEmployeeTaskStatus()` en frontend
5. Botón "Completar" en frontend `TasksPage.tsx` y `DashboardPage.tsx`
6. Validación de permisos: solo empleado asignado o jefe pueden completar

## Cambios Técnicos

### Endpoints creados/modificados

| Endpoint | Líneas | Archivo | Descripción |
|----------|--------|---------|-------------|
| `GET /api/v1/dashboard/employee` | 53-134 | `dashboard_empleado/router.py` | Dashboard resumen con conteos |
| `GET /api/v1/dashboard/employee/tasks` | 137-205 | `dashboard_empleado/router.py` | Tareas asignadas con filtros |
| `GET /api/v1/dashboard/employee/available-tasks` | 272-323 | `dashboard_empleado/router.py` | Tareas disponibles por ocupación |
| `GET /api/v1/dashboard/employee/tasks/{id}/vale` | 399-510 | `dashboard_empleado/router.py` | Vale de producción de una tarea |
| `PATCH /api/v1/admin/orders/tasks/{task_id}/status` | 1121-1289 | `orders/router.py` | Marcar tarea como completada |

### Archivos clave modificados/creados

| Archivo | Cambio |
|---------|--------|
| `be/app/modules/dashboard_empleado/router.py` | 5 endpoints para dashboard, tareas, vales |
| `be/app/modules/orders/router.py` | Endpoint PATCH status con auto-creación de etapa siguiente |
| `be/app/models/task.py` | Modelo `Task` con relaciones a producto y usuario |
| `be/app/models/inventory.py` | Modelo `InventoryMovement` para registrar producción |
| `be/app/modules/orders/schemas.py` | Schemas de tareas, vale, dashboard |
| `fe/src/modules/dashboard-empleado/pages/DashboardPage.tsx` | Resumen con KPIs y últimas tareas |
| `fe/src/modules/dashboard-empleado/pages/TasksPage.tsx` | Lista de tareas con filtros y botón completar |
| `fe/src/modules/dashboard-empleado/pages/AvailableTasksPage.tsx` | Tareas disponibles con reclamar |
| `fe/src/modules/dashboard-empleado/services/employeeApi.ts` | API calls: `getMyTasks()`, `getAvailableTasks()`, `getTaskVale()`, `updateEmployeeTaskStatus()` |
| `fe/src/modules/dashboard-empleado/types/employee.ts` | Tipos `EmployeeTask`, `AvailableTask`, `ValeResponse` |

### Secuencia de etapas de producción

```
corte (1) → guarnicion (2) → soladura (3) → emplantillado (4)
   ↓             ↓               ↓                 ↓
Se crea      Se crea          Se crea          Se actualiza
guarnicion   soladura         emplantillado    inventario + movimiento
```

### Estructura del vale de producción

El vale (`GET /tasks/{id}/vale`) retorna:
- `vale_number`: Número de vale auto-incremental
- `order_id`, `product_id`, `product_name`, `product_sku`
- `type`: Tipo de tarea (corte, guarnicion, soladura, emplantillado)
- `amount`: Cantidad de pares
- `line_group`: Grupo de línea para productos duplicados
- `size`: Talla del producto
- `assigned_user_name`: Empleado asignado
- `created_at`: Fecha de creación
- `qr_code_url`: URL del código QR (opcional)

## Logros

- Dashboard empleado completo con 3 vistas: resumen, tareas asignadas, tareas disponibles
- Filtros por estado y tipo para gestión eficiente de tareas
- Vale de producción detallado por tarea con toda la información de trazabilidad
- Finalización de tareas con auto-creación de la siguiente etapa (cadena productiva)
- Al completar emplantillado: actualización automática del inventario con movimiento registrado
- El inventario se actualiza SOLO al final de la cadena (emplantillado), no en etapas intermedias
- La tarea hija hereda todos los datos relevantes de la tarea padre

## Resumen

El Sprint 11 implementa la experiencia del empleado en el sistema de producción. El empleado tiene un dashboard con resumen de KPIs, una lista de tareas asignadas con filtros por estado y tipo, y una vista de tareas disponibles para reclamar según su ocupación. Puede visualizar el vale de producción de cada tarea. La funcionalidad clave de finalización permite al empleado o jefe marcar una tarea como completada, lo que automáticamente crea la siguiente etapa de producción (corte → guarnición → soladura → emplantillado). Al completar la última etapa (emplantillado), el inventario se actualiza automáticamente, cerrando el ciclo de producción.
