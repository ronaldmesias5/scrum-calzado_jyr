# Backlog Sprint 12 — Seguimiento y Control

**Sprint:** 12  
**Duración:** 2 semanas  
**SP Total:** 16  
**Fecha:** Junio 2026  
**Estado:** ✅⚠️ COMPLETADO (HU-027 PARCIAL)

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-024 | Reporte de Avances e Incidencias | 8 | ✅ COMPLETADO |
| HU-027 | Modificación y Eliminación de Tareas | 8 | ⚠️ PARCIAL |

## HU-024: Reporte de Avances e Incidencias

El empleado puede registrar observaciones en sus tareas y consultar las incidencias asociadas a las mismas.

**Criterios de Aceptación:**
- El empleado puede actualizar la observación de una tarea asignada a él
- Solo el empleado asignado a la tarea puede modificar la observación
- El empleado puede ver una lista de incidencias relacionadas con sus tareas
- La lista de incidencias se puede filtrar por estado (`abierta`, `en_progreso`, `resuelta`)
- Por defecto, se muestran solo incidencias abiertas y en progreso (no resueltas)
- Cada incidencia muestra: tipo, descripción, estado, fecha de reporte
- El frontend `IncidencesPage.tsx` muestra las incidencias con filtro de estado

**Tareas:**
1. Implementar `PATCH /dashboard/employee/tasks/{id}/observation` (líneas 369-396) en `dashboard_empleado/router.py`
2. Implementar `GET /dashboard/employee/incidences` (líneas 208-258) con filtro `state`
3. Validar que solo el empleado asignado pueda modificar la observación
4. Crear frontend `IncidencesPage.tsx` en dashboard-empleado con tabla de incidencias y filtro
5. Integrar actualización de observación en la vista de tareas del empleado

## HU-027: Modificación y Eliminación de Tareas ⚠️ PARCIAL

El jefe/admin puede modificar el estado y la asignación de las tareas, pero faltan endpoints para editar detalles y eliminar tareas.

**Criterios de Aceptación (implementados):**
- El jefe/admin puede cambiar el estado de una tarea a `pendiente`, `en_progreso`, `completado`, `cancelado`
- El jefe/admin puede cambiar la asignación de una tarea a otro empleado
- El empleado puede auto-asignarse tareas disponibles (HU-022)

**Criterios de Aceptación (NO implementados — ⚠️ PARCIAL):**
- ❌ **No existe endpoint DELETE** para eliminar tareas
- ❌ **No existe endpoint PUT/PATCH** para modificar detalles de la tarea (tipo, cantidad, descripción, fecha límite)
- ❌ **El frontend `TasksPage.tsx`** no tiene UI para editar detalles ni eliminar tareas

**Tareas implementadas:**
1. `PATCH /admin/orders/tasks/{task_id}/status` (líneas 1121-1289) — cambiar estado de tarea
2. `PATCH /admin/orders/tasks/{id}/assign` (líneas 1017-1063) — cambiar asignación
3. Frontend `TasksPage.tsx` con acciones de cambio de estado y asignación

**Tareas pendientes (no implementadas):**
1. ❌ Endpoint `DELETE /admin/orders/tasks/{task_id}` — eliminar tarea lógica o físicamente
2. ❌ Endpoint `PUT /admin/orders/tasks/{task_id}` o `PATCH /admin/orders/tasks/{task_id}` — modificar `type`, `amount`, `description`, `deadline`, `line_group`
3. ❌ Frontend: botón de eliminar tarea con confirmación en `TasksPage.tsx`
4. ❌ Frontend: modal de edición de detalles de tarea en `TasksPage.tsx`

## Cambios Técnicos

### Endpoints creados/modificados

| Endpoint | Líneas | Archivo | Descripción |
|----------|--------|---------|-------------|
| `PATCH /api/v1/dashboard/employee/tasks/{task_id}/observation` | 369-396 | `dashboard_empleado/router.py` | Actualizar observación de tarea |
| `GET /api/v1/dashboard/employee/incidences` | 208-258 | `dashboard_empleado/router.py` | Listar incidencias del empleado |
| `PATCH /api/v1/admin/orders/tasks/{task_id}/status` | 1121-1289 | `orders/router.py` | Cambiar estado de tarea |
| `PATCH /api/v1/admin/orders/tasks/{id}/assign` | 1017-1063 | `orders/router.py` | Cambiar asignación de tarea |

### Endpoints faltantes (HU-027 PARCIAL)

| Endpoint | Método | Propósito | Estado |
|----------|--------|-----------|--------|
| `/api/v1/admin/orders/tasks/{task_id}` | DELETE | Eliminar tarea | ❌ NO IMPLEMENTADO |
| `/api/v1/admin/orders/tasks/{task_id}` | PUT | Modificar detalles completos de tarea | ❌ NO IMPLEMENTADO |
| `/api/v1/admin/orders/tasks/{task_id}` | PATCH | Modificar campos específicos de tarea | ❌ NO IMPLEMENTADO |

### Archivos clave modificados/creados

| Archivo | Cambio |
|---------|--------|
| `be/app/modules/dashboard_empleado/router.py` | +2 endpoints (observación, incidencias) |
| `be/app/modules/orders/router.py` | Endpoints PATCH status y PATCH assign existentes |
| `be/app/modules/dashboard_empleado/schemas.py` | Schemas: `TaskObservationUpdate`, `EmployeeIncidenceSchema` |
| `be/app/models/incidence.py` | Modelo `Incidence` con campos de incidencia |
| `fe/src/modules/dashboard-empleado/pages/IncidencesPage.tsx` | Lista de incidencias con filtro de estado |
| `fe/src/modules/dashboard-empleado/pages/TasksPage.tsx` | Vista de tareas con observación y estado |
| `fe/src/modules/dashboard-empleado/services/employeeApi.ts` | API calls: `updateTaskObservation()`, `getIncidences()` |
| `fe/src/modules/dashboard-jefe/pages/TasksPage.tsx` | Cambio de estado y asignación (sin delete/edit) |

### Estados de incidencia

| Estado | Descripción |
|--------|-------------|
| `abierta` | Incidencia reportada, pendiente de acción |
| `en_progreso` | Incidencia siendo atendida |
| `resuelta` | Incidencia solucionada |

## Logros

- Observaciones en tareas: el empleado puede documentar avances y novedades
- Visibilidad de incidencias por empleado con filtro inteligente (oculta resueltas por defecto)
- Cambio de estado de tareas por parte del jefe/admin
- Reasignación flexible de tareas entre empleados
- `IncidencesPage.tsx` en dashboard-empleado para monitoreo de incidencias

## Pendientes (HU-027)

- **DELETE de tareas**: No hay forma de eliminar una tarea mal creada. El workaround actual es cancelarla (cambiar estado a `cancelado`), pero el registro persiste.
- **Edición de detalles**: No se puede cambiar el tipo (`corte` → `guarnicion`), cantidad, descripción ni fecha límite de una tarea ya creada. Para corregir errores, la tarea debe cancelarse y crearse una nueva.
- **Frontend**: La `TasksPage.tsx` del dashboard-jefe permite cambiar estado y asignación, pero no tiene botones de eliminar ni modal de edición.

## Resumen

El Sprint 12 implementa funcionalidades de seguimiento y control de producción. El empleado puede registrar observaciones en sus tareas y consultar las incidencias asociadas, con filtro por estado. Para el jefe, existe la capacidad de cambiar el estado y la asignación de las tareas. Sin embargo, la HU-027 queda parcialmente implementada: **faltan los endpoints DELETE y PUT/PATCH para modificar y eliminar tareas**, así como la interfaz de usuario correspondiente. El workaround actual es cancelar tareas en lugar de eliminarlas, y crear nuevas tareas para corregir errores en los detalles.
