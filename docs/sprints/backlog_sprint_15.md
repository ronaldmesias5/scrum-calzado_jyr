# Backlog Sprint 15 — Producción Semanal y Pedidos por Cliente

**Sprint:** 15  
**Duración:** 2 semanas  
**SP Total:** 16  
**Fecha:** Junio 2026  
**Estado:** ⚠️ PARCIAL (HU-035 incompleta)

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-034 | Producción Semanal | 8 | ✅ COMPLETADO |
| HU-035 | Pedidos Mensuales Clientes | 8 | ⚠️ PARCIAL |

## HU-034: Producción Semanal

**Descripción:** Como jefe, quiero visualizar la producción semanal del taller para monitorear el rendimiento operativo semana a semana.

### Criterios de Aceptación

1. Métricas semanales agrupadas por semana ISO: pares fabricados, tareas completadas, pedidos creados, pares ordenados
2. Totales del período: total pares período, total tareas período, total órdenes período, total pares ordenados
3. Filtro por número de días hacia atrás (parámetro `days`, default 30)
4. Filtros opcionales `start_date` y `end_date` para rango personalizado
5. Filtro opcional por estado de pedido (`state`)
6. Listado de pedidos detallado incluyendo items agrupados por producto
7. Exportación PDF del reporte semanal
8. Visualización en gráficos semanales

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/reports/global/production` | `reports_router.py:705-814` | Reporte de producción semanal con métricas agrupadas por ISO week |

### Implementación

**Backend — `be/app/modules/admin/reports_router.py`:**

- `GET /global/production` (líneas 705-814):
  - Si no se especifica `start_date`, calcula `now - days` (default 30)
  - **Métricas de ventas:** consulta `Order` en el rango, calcula `total_orders_created` y `total_pairs_ordered`
  - **Métricas de producción:** consulta `Task` con status `completado`, calcula:
    - `total_tasks_period` (conteo)
    - `total_pairs_period` (suma de `Task.amount`)
    - `total_orders_period` (pedidos únicos con tareas completadas, usando `count(distinct Task.order_id)`)
  - **Agrupación semanal:** usa `o.created_at.isocalendar()` para obtener `(year, week, day)` y construir clave `"YYYY-Www"`
  - Para cada semana: acumula `pairs_manufactured`, `tasks_completed`, `orders_created`, `pairs_ordered`
  - Retorna `ProductionGlobalReport` con:
    - `total_pairs_period`, `total_tasks_period`, `total_orders_period`, `total_orders_created`, `total_pairs_ordered`
    - `weekly_metrics`: lista de `ProductionWeeklyMetric` ordenada descendente por semana
    - `orders`: listado detallado de pedidos con items agrupados

**Frontend — `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx`:**

- Tab "Generador de Reportes" → opción "Producción"
- Gráfico semanal con métricas por semana ISO
- KPIs de período: total pares fabricados, tareas completadas, pedidos en producción
- Tabla de pedidos detallados
- Exportación PDF con `exportProductionPDF()`
- Filtro de días (7/30/90)

### Tareas

- [x] Implementar `GET /global/production` con agrupación semanal
- [x] Calcular métricas de producción desde tareas completadas
- [x] Calcular métricas de ventas desde pedidos creados
- [x] Agrupación por ISO week con 4 métricas semanales
- [x] Soportar filtros: days, start_date, end_date, state
- [x] Agregar sección de producción en ReportsPage.tsx
- [x] Implementar `exportProductionPDF()` con jspdf
- [x] Visualización de métricas semanales

## HU-035: Pedidos Mensuales Clientes ⚠️ PARCIAL

**Descripción:** Como jefe, quiero visualizar los pedidos de clientes agregados por mes para analizar tendencias de compra mensuales.

### Criterios de Aceptación

1. ✅ Listar todos los pedidos de un cliente específico
2. ✅ Ver ventas semanales agregadas
3. ❌ **NO implementado:** Agregación mensual de pedidos por cliente
4. ❌ **NO implementado:** Gráfico mensual en ReportsPage.tsx

### Endpoints Implementados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/reports/customer/{user_id}` | `reports_router.py:656-703` | Lista pedidos de un cliente (sin agregación mensual) |
| GET | `/api/v1/admin/reports/global/sales` | `reports_router.py:816-859` | Ventas semanales (no mensuales) |

### Implementación Actual (Parcial)

**Backend — `be/app/modules/admin/reports_router.py`:**

- `GET /customer/{user_id}` (líneas 656-703):
  - Consulta `Order` por `customer_id`
  - Filtros por `start_date`/`end_date`
  - Orden descendente por `created_at`
  - Agrupa items con `_build_order_items()`
  - Retorna `CustomerReportResponse` con lista plana de pedidos (SIN agrupar por mes)
  - Totaliza: `total_orders`, `total_pairs`, `total_spent`

- `GET /global/sales` (líneas 816-859):
  - Consulta pedidos completados o entregados en el rango
  - Agrupa por semana ISO (`"YYYY-Www"`)
  - Retorna `SalesWeeklyMetric` con orders_created y pairs_ordered por semana
  - **No hay versión mensual** de esta agregación

**Frontend — `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx`:**

- En el "Generador de Reportes", opción "Cliente":
  - Selector de cliente
  - Tabla de pedidos del cliente (sin agrupar por mes)
  - Exportación PDF con `exportCustomerPDF()`

### Lo que Falta (⚠️ PARCIAL)

1. **Endpoint mensual faltante:** No existe `GET /admin/reports/customer/{user_id}/monthly` ni equivalente que agrupe pedidos por mes
2. **Agregación en `GET /customer/{user_id}`:** El endpoint actual retorna la lista plana de pedidos sin agrupar por mes
3. **Agregación mensual global:** No existe endpoint que proporcione `SalesMonthlyMetric` (solo existe semanal en `GET /global/sales`)
4. **Gráfico mensual en frontend:** ReportsPage.tsx no tiene visualización de datos mensuales ni selector de período mensual

### Tareas Completadas

- [x] Implementar `GET /customer/{user_id}` con lista de pedidos por cliente
- [x] Implementar `GET /global/sales` con ventas semanales
- [x] Agregar sección de cliente en ReportsPage.tsx

### Tareas Pendientes

- [ ] Crear endpoint `GET /admin/reports/customer/{user_id}/monthly` que agrupe pedidos por mes
- [ ] Agregar agregación `monthly_metrics` en `CustomerReportResponse` o schema similar
- [ ] Crear endpoint `GET /admin/reports/global/sales/monthly` con `SalesMonthlyMetric`
- [ ] Agregar gráfico de barras mensual en ReportsPage.tsx
- [ ] Implementar `exportCustomerMonthlyPDF()`

## Cambios Técnicos

**Archivos modificados en el backend:**
- `be/app/modules/admin/reports_router.py` — Endpoints `GET /global/production` (705-814), `GET /global/sales` (816-859), `GET /customer/{user_id}` (656-703)
- `be/app/modules/admin/reports_schemas.py` — Schemas: `ProductionGlobalReport`, `ProductionWeeklyMetric`, `SalesGlobalReport`, `SalesWeeklyMetric`, `CustomerReportResponse`, `OrderSummary`, `OrderItemSummary`

**Archivos modificados en el frontend:**
- `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx` — Secciones producción y cliente en generador de reportes
- `fe/src/modules/dashboard-jefe/utils/reportsUtils.ts` — `exportProductionPDF()`, `exportCustomerPDF()`
- `fe/src/modules/dashboard-jefe/services/reportsApi.ts` — Llamadas `getGlobalProduction()`, `getCustomerReport()`, `getAllCustomersReport()`

## Logros

- Reporte de producción semanal con 4 métricas por ISO week
- Visualización de tendencias semanales de fabricación
- Filtros temporales flexibles (días, rango personalizado)
- Consulta de pedidos por cliente individual

## Resumen

El Sprint 15 completó la HU-034 con un reporte de producción semanal robusto que agrupa pares fabricados, tareas completadas, pedidos creados y pares ordenados por semana ISO. La HU-035 quedó parcial: aunque se implementaron los endpoints para listar pedidos por cliente y ventas semanales, falta la agregación mensual (agrupación por mes calendario) tanto en backend como en frontend. Se requiere un nuevo endpoint y schema para `SalesMonthlyMetric`, y la correspondiente visualización en ReportsPage.tsx.
