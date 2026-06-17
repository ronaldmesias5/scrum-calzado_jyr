# Backlog Sprint 14 — Reportes de Empleados y Producción Individual

**Sprint:** 14  
**Duración:** 2 semanas  
**SP Total:** 16  
**Fecha:** Junio 2026  
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-032 | Reportes de Tareas de Empleados | 8 | ✅ COMPLETADO |
| HU-033 | Producción por Empleado | 8 | ✅ COMPLETADO |

## HU-032: Reportes de Tareas de Empleados

**Descripción:** Como jefe, quiero consultar reportes detallados del rendimiento de empleados individuales y por cargo, incluyendo tareas completadas, pares producidos, ingresos generados y desglose por tipo de proceso.

### Criterios de Aceptación

1. Reporte por empleado individual: muestra nombre, ocupación, tareas completadas, pares producidos, ganancias totales
2. Desglose por tipo de proceso (corte, guarnición, soladura, emplantillado) con conteo de tareas
3. Cada tarea detallada muestra: vale number, producto, proceso, cantidad, estado, color, fechas, precio por docena y valor total de la tarea
4. Cálculo de ganancia por tarea: `(pairs / 12) * price_per_dozen`
5. El `task_prices` del producto se consulta dinámicamente para obtener `price_per_dozen` según el tipo de proceso
6. Reporte consolidado por cargo: agrupa todos los empleados con una ocupación específica
7. Filtros por rango de fechas (start_date/end_date) en ambos endpoints
8. Marcado de tareas como pagadas (PATCH) para control de liquidación

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/reports/employee/{user_id}` | `reports_router.py:261-394` | Reporte individual de empleado: pares, tareas completadas, ganancias, desglose por proceso |
| GET | `/api/v1/admin/reports/role/{role_name}` | `reports_router.py:397-572` | Reporte consolidado por cargo (todos los empleados de una ocupación) |
| PATCH | `/api/v1/admin/reports/tasks/mark-paid` | `reports_router.py:627-653` | Marca una lista de tareas como pagadas |

### Implementación

**Backend — `be/app/modules/admin/reports_router.py`:**

- `GET /employee/{user_id}` (líneas 261-394):
  - Subconsulta `order_pairs_sub`: suma de `OrderDetail.amount` agrupado por `(order_id, product_id)` para obtener pares totales por pedido/producto
  - Subconsulta `colour_sub`: obtiene color único por `(order, product, line_group)` evitando duplicados por talla
  - Join de `Task` con `Product`, `Category` y las subconsultas
  - Filtro: tareas con status `completado` o `pagado`, `deleted_at == None`
  - Cálculo de `price_per_dozen` desde `Product.task_prices` (campo JSONB)
  - Devuelve `EmployeeReportResponse` con breakdown y lista detallada de tareas

- `GET /role/{role_name}` (líneas 397-572):
  - Busca usuarios por `occupation` usando `cast(User.occupation, String) == role_name.lower()`
  - Consulta similar a employee pero agrupando por todos los usuarios del cargo
  - Soportes filtros adicionales por `status` de tarea
  - Consolidación de tareas de todos los empleados del cargo

- `PATCH /tasks/mark-paid` (líneas 627-653):
  - Recibe lista de `task_ids`
  - Actualiza `Task.status = 'pagado'` y `Task.updated_by = current_user.id`
  - Solo afecta tareas con status `completado`
  - Retorna conteo de tareas actualizadas

**Frontend — `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx`:**

- Sección "Generador de Reportes" con opción "Empleado"
- Selector de cargo seguido de selector de empleado
- Visualización de KPIs del empleado: tareas, pares, ganancias
- Tabla detallada de tareas con columnas: Vale, Proceso, Producto, Color, Cant., Estado, Fecha, Valor
- Desglose por proceso con tarjetas de color
- Botón "Marcar como Pagados" para tareas seleccionables
- Modal de confirmación antes de marcar como pagado
- Exportación PDF con `exportEmployeePDF`
- Filtro de fechas para todos los reportes

### Tareas

- [x] Implementar `GET /employee/{user_id}` con subconsultas de pares y color
- [x] Implementar `GET /role/{role_name}` con consolidación por cargo
- [x] Implementar `PATCH /tasks/mark-paid` para liquidación
- [x] Agregar sección de empleados en ReportsPage.tsx
- [x] Implementar selección de tareas y marcado como pagado
- [x] Exportación PDF de reporte de empleado

## HU-033: Producción por Empleado

**Descripción:** Como empleado, quiero consultar mi propio rendimiento de producción, incluyendo tareas completadas, pares producidos, ingresos generados y desglose por tipo de proceso.

### Criterios de Aceptación

1. KPIs de rendimiento: tareas completadas, pares producidos, ganancias totales
2. Desglose por tipo de proceso con conteo de tareas
3. Reporte detallado con cada tarea individual: vale number, producto, proceso, cantidad, estado, color, fechas, precio por docena, valor total
4. Cálculo de ganancia por tarea: `(pairs / 12) * price_per_dozen` usando `task_prices` del producto
5. Filtros de fecha: Hoy, Semana, Mes, Personalizado
6. Exportación a PDF del reporte detallado
7. Visualización de reportes compartidos por el jefe

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/dashboard/employee/report/my-performance` | `dashboard_empleado/router.py:518-571` | KPIs del empleado autenticado |
| GET | `/api/v1/dashboard/employee/report/my-tasks` | `dashboard_empleado/router.py:574-748` | Reporte detallado con valores calculados por tarea |

### Implementación

**Backend — `be/app/modules/dashboard_empleado/router.py`:**

- `GET /report/my-performance` (líneas 518-571):
  - Consulta tareas del empleado con status `completado` o `pagado`
  - Calcula `total_tasks`, `total_pairs` (suma de `Task.amount`)
  - Calcula `total_earnings`: itera cada tarea, obtiene `task_prices` del producto, calcula `(amount / 12) * price_per_dozen`
  - Agrupa por tipo de proceso para el breakdown
  - Filtros opcionales `start_date` y `end_date`

- `GET /report/my-tasks` (líneas 574-748):
  - Subconsultas: `order_pairs_sub` (total pares por order/product) y `colour_sub` (color único por order/product/line_group)
  - Join con `Product` para obtener `task_prices`, `name_product`
  - Calcula por tarea: pairs (prioriza `Task.amount`, fallback a `total_pairs`), `price_per_dozen` de `task_prices`, `task_price = (pairs/12) * price_per_dozen`
  - Filtros de fecha con `func.coalesce(Task.completed_at, Task.created_at)`
  - Retorna `MyTasksReportResponse` con breakdown y lista detallada

- `GET /reports/shared` (líneas 751+): reportes compartidos por el jefe

**Frontend — `fe/src/modules/dashboard-jefe/pages/EmployeeReportsPage.tsx`:**
- 555 líneas, página completa "Reportes"
- Sección "Mi Rendimiento" con KPIs en tarjetas de colores (verde/azul/ámbar)
- Desglose por proceso con tarjetas por tipo (corte, guarnición, soladura, emplantillado)
- Sección "Reporte Detallado de Tareas" con:
  - Filtros de fecha: Hoy, Semana, Mes, Personalizado
  - Tabla con columnas: Nº Vale, Proceso, Producto, Color, Cant., Estado, Fecha, Valor
  - Total general de ganancias
  - Botón "Descargar PDF"
- Sección "Compartidos por el Jefe" con lista de reportes y modal de detalle
- Exportación PDF usando `jspdf` + `jspdf-autotable`:
  - `exportMyTasksPDF()`: reporte detallado de tareas con tabla
  - `exportPerformancePDF()`: resumen de rendimiento
- Polling cada 30s para reportes compartidos

### Tareas

- [x] Implementar `GET /report/my-performance` con KPIs
- [x] Implementar `GET /report/my-tasks` con detalle y valores calculados
- [x] Implementar `GET /reports/shared` para reportes compartidos
- [x] Crear `EmployeeReportsPage.tsx` con KPIs, tabla detallada y filtros
- [x] Implementar `exportMyTasksPDF()` y `exportPerformancePDF()` con jspdf
- [x] Implementar filtros de fecha (Hoy, Semana, Mes, Personalizado)
- [x] Implementar polling de reportes compartidos cada 30s
- [x] Modal de detalle para reportes compartidos

## Cambios Técnicos

**Archivos modificados en el backend:**
- `be/app/modules/admin/reports_router.py` — Endpoints `GET /employee/{user_id}`, `GET /role/{role_name}`, `PATCH /tasks/mark-paid`
- `be/app/modules/admin/reports_schemas.py` — Schemas: `EmployeeReportResponse`, `TaskBreakdown`, `TaskDetail`, `TaskPriceDetail`
- `be/app/modules/dashboard_empleado/router.py` — Endpoints `GET /report/my-performance`, `GET /report/my-tasks`, `GET /reports/shared`
- `be/app/modules/dashboard_empleado/schemas.py` — Schemas: `MyPerformanceResponse`, `MyPerformanceTaskBreakdown`, `MyTasksReportResponse`, `MyTaskDetail`

**Archivos modificados en el frontend:**
- `fe/src/modules/dashboard-empleado/pages/EmployeeReportsPage.tsx` — Nueva página (555 líneas)
- `fe/src/modules/dashboard-empleado/services/employeeApi.ts` — Llamadas `getMyPerformance()`, `getMyTasksReport()`, `getSharedReports()`, `getSharedReportDetail()`
- `fe/src/modules/dashboard-empleado/utils/reportsUtils.ts` — Funciones `exportMyTasksPDF()`, `exportPerformancePDF()`
- `fe/src/modules/dashboard-empleado/types/employee.ts` — Tipos para reportes
- `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx` — Sección empleados en generador de reportes
- `fe/src/modules/dashboard-jefe/utils/reportsUtils.ts` — `exportEmployeePDF()`

## Logros

- Sistema dual de reportes de empleados: vista jefe (todos los empleados) y vista empleado (auto-servicio)
- Cálculo preciso de ganancias basado en `task_prices` por producto y tipo de proceso
- Desglose por proceso para identificar eficiencia por tipo de tarea
- Filtros temporales avanzados con período personalizado
- Control de pagos con marcado de tareas como pagadas
- Exportación PDF completa con formato profesional
- Reportes compartidos por el jefe con polling en tiempo real
- Más de 280 líneas de endpoints backend y 555 líneas de frontend solo para HU-033

## Resumen

El Sprint 14 integró la funcionalidad de reportes de rendimiento de empleados desde dos perspectivas complementarias: la del jefe (HU-032) que puede ver y gestionar el rendimiento de cualquier empleado o cargo, y la del empleado (HU-033) que puede consultar su propia producción y ganancias. Los cálculos de ingresos se basan en los precios por docena configurados por producto y tipo de proceso (`task_prices`), con exportación PDF completa.
