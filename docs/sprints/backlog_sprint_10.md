# Backlog Sprint 10 — Planificación de Producción

**Sprint:** 10  
**Duración:** 2 semanas  
**SP Total:** 13  
**Fecha:** Junio 2026  
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-021 | Creación de Tareas | 8 | ✅ COMPLETADO |
| HU-022 | Asignación de Tareas | 5 | ✅ COMPLETADO |

## HU-021: Creación de Tareas

El jefe/admin puede crear tareas de producción en lote para un pedido, con 4 tipos de tarea y soporte para productos duplicados mediante `line_group`.

**Criterios de Aceptación:**
- Desde un pedido existente, el jefe/admin puede iniciar la producción creando tareas en lote
- Las tareas se crean automáticamente para los 4 tipos: `corte`, `guarnicion`, `soladura`, `emplantillado`
- Se puede especificar cantidad, línea de producción y fecha límite
- Soporte para productos duplicados con el mismo `product_id` (usando `line_group`)
- Cada tarea recibe un número de vale (`vale_number`) auto-incremental global
- Si ya existe una tarea para el mismo `(order_id, product_id, line_group, type)`, se actualiza el `assigned_to` en lugar de crear duplicado
- Para tareas de tipo `corte`, los insumos se descuentan automáticamente del inventario de insumos
- El frontend `OrdersPage.tsx` tiene un botón "Iniciar Producción" que gatilla la creación

**Tareas:**
1. Implementar `POST /api/v1/admin/orders/{order_id}/tasks` en `orders/router.py` (líneas 871-1015)
2. Lógica de creación batch con 4 tipos de tarea por cada `(product_id, line_group)`
3. Generación de número de vale auto-incremental (`GET /tasks/next-number`)
4. Detección de duplicados: si existe `(order_id, product_id, line_group, type)`, actualizar `assigned_to`
5. Descuento automático de insumos para tareas de tipo `corte`
6. Frontend: botón "Iniciar Producción" en `OrdersPage.tsx` que abre modal de producción
7. Frontend: `TasksPage.tsx` en dashboard-jefe para listar y gestionar tareas

## HU-022: Asignación de Tareas

El jefe puede asignar tareas a empleados específicos, y los empleados pueden auto-asignarse tareas disponibles según su ocupación.

**Criterios de Aceptación:**
- El jefe/admin puede asignar una tarea a un empleado específico mediante `PATCH /admin/orders/tasks/{id}/assign`
- El empleado puede ver tareas disponibles no asignadas que coincidan con su ocupación
- El empleado puede auto-asignarse (reclamar) una tarea disponible mediante `POST /dashboard/employee/tasks/{id}/claim`
- Al reclamar, la tarea pasa a estado `en_progreso` y se registra la fecha de asignación
- La ocupación del empleado determina qué tipo de tarea puede reclamar:
  - `cortador` → `corte`
  - `guarnecedor` → `guarnicion`
  - `solador` → `soladura`
  - `emplantillador` → `emplantillado`
- Una tarea ya asignada no puede ser reclamada por otro empleado
- El frontend `AvailableTasksPage.tsx` muestra tareas disponibles con botón "Reclamar"

**Tareas:**
1. Implementar `PATCH /admin/orders/tasks/{id}/assign` (líneas 1017-1063) en `orders/router.py`
2. Implementar `POST /dashboard/employee/tasks/{id}/claim` (líneas 326-366) en `dashboard_empleado/router.py`
3. Implementar `GET /dashboard/employee/available-tasks` (líneas 272-323) filtrado por ocupación
4. Mapa `OCCUPATION_TO_TASK_TYPE` para validar ocupación vs tipo de tarea
5. Frontend `AvailableTasksPage.tsx` con tabla de tareas y botón "Reclamar"
6. Validación de que la ocupación del empleado coincida con el tipo de tarea

## Cambios Técnicos

### Endpoints creados/modificados

| Endpoint | Líneas | Archivo | Descripción |
|----------|--------|---------|-------------|
| `POST /api/v1/admin/orders/{order_id}/tasks` | 871-1015 | `orders/router.py` | Creación batch de tareas (4 tipos por producto) |
| `PATCH /api/v1/admin/orders/tasks/{id}/assign` | 1017-1063 | `orders/router.py` | Asignar tarea a empleado |
| `GET /api/v1/admin/orders/{order_id}/tasks` | 1066+ | `orders/router.py` | Listar tareas de un pedido |
| `GET /api/v1/orders/tasks/next-number` | 109 | `orders/router.py` | Siguiente número de vale disponible |
| `GET /api/v1/orders/tasks/all` | 122 | `orders/router.py` | Listar todas las tareas |
| `GET /api/v1/dashboard/employee/available-tasks` | 272-323 | `dashboard_empleado/router.py` | Tareas disponibles por ocupación |
| `POST /api/v1/dashboard/employee/tasks/{id}/claim` | 326-366 | `dashboard_empleado/router.py` | Auto-asignación de tarea |

### Archivos clave modificados/creados

| Archivo | Cambio |
|---------|--------|
| `be/app/modules/orders/router.py` | +3 endpoints de tareas (creación batch, asignación, listado) |
| `be/app/modules/dashboard_empleado/router.py` | +2 endpoints (tareas disponibles, reclamar) |
| `be/app/models/task.py` | Modelo `Task` con campos para producción |
| `be/app/modules/orders/schemas.py` | Schemas: `ProductionTaskResponse`, `TaskCreateRequest` |
| `be/alembic/versions/XXX_task_tables.py` | Migración para tablas de tareas |
| `fe/src/modules/dashboard-jefe/pages/OrdersPage.tsx` | Botón "Iniciar Producción" |
| `fe/src/modules/dashboard-jefe/pages/TasksPage.tsx` | Listado y gestión de tareas |
| `fe/src/modules/dashboard-empleado/pages/AvailableTasksPage.tsx` | Tareas disponibles con reclamar |

### Tipos de tarea de producción

| Tipo | Etapa | Descripción |
|------|-------|-------------|
| `corte` | 1 | Corte de materiales (descuenta insumos automáticamente) |
| `guarnicion` | 2 | Guarnición o armado |
| `soladura` | 3 | Soladura o pegado de suela |
| `emplantillado` | 4 | Emplantillado y acabado final |

### Lógica de `line_group`

- Los productos duplicados en un pedido se diferencian por `line_group`
- La creación batch crea tareas para cada `(product_id, line_group)` único
- Cada tarea se asocia a un `line_group` específico para tracking preciso
- La detección de duplicados usa `(order_id, product_id, line_group, type)`

## Logros

- Sistema completo de planificación de producción con 4 etapas secuenciales
- Creación batch eficiente: una llamada crea hasta N×4 tareas (una por tipo por producto)
- Detección inteligente de duplicados que reasigna en lugar de duplicar
- Números de vale auto-incrementales para trazabilidad de producción
- Descuento automático de insumos para la etapa de corte
- Auto-asignación por ocupación: el empleado solo ve tareas que puede realizar
- Mecanismo dual de asignación: manual (jefe) o auto-asignación (empleado)

## Resumen

El Sprint 10 implementa el motor de planificación de producción. El jefe/admin puede crear tareas en lote para un pedido, generando automáticamente 4 tareas por producto (corte → guarnición → soladura → emplantillado). El sistema soporta productos duplicados mediante `line_group`, descuenta insumos automáticamente para la etapa de corte, y detecta duplicados para evitar tareas redundantes. Para la asignación, el jefe puede asignar manualmente o los empleados pueden auto-asignarse tareas disponibles según su ocupación, con un mapa de correspondencia `cortador → corte`, `guarnecedor → guarnicion`, etc.
