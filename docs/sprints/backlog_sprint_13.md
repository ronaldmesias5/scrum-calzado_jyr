# Backlog Sprint 13 — Alertas y Reportes del Sistema

**Sprint:** 13  
**Duración:** 2 semanas  
**SP Total:** 21  
**Fecha:** Junio 2026  
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-030 | Alertas al Jefe | 8 | ✅ COMPLETADO |
| HU-031 | Reportes de Pedidos e Inventario | 13 | ✅ COMPLETADO |

## HU-030: Alertas al Jefe

**Descripción:** Como jefe, quiero ver alertas del sistema en mi dashboard para monitorear eventos críticos como incidencias reportadas por empleados.

### Criterios de Aceptación

1. El endpoint retorna alertas basadas en incidencias abiertas con información del empleado reportero
2. Las alertas se muestran con íconos y colores según su tipo: warning (naranja), info (azul), success (verde), error (rojo)
3. Cada alerta muestra tipo de incidencia, quién la reportó y descripción
4. Las alertas se ordenan de más reciente a más antigua
5. Solo las incidencias activas (no eliminadas) aparecen como alertas

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/dashboard/admin/alerts` | `dashboard_jefe/router.py:117-155` | Retorna alertas basadas en incidencias abiertas, con información del empleado (obtenida a través de la tarea asociada) |

### Implementación

**Backend — `be/app/modules/dashboard_jefe/router.py`:**
- Endpoint `GET /alerts` (líneas 117-155): consulta incidencias con estado `abierta` y `deleted_at == None`, obtiene el nombre del empleado reportero mediante join con `Task` → `User`, y retorna objetos `AlertSchema` con tipo `"error"`, título, mensaje y hora
- Dependencia: `_require_jefe` para restringir acceso solo al jefe
- Modelos implicados: `Incidence`, `IncidenceStatus`, `Task`, `User`

**Frontend — `fe/src/modules/dashboard-jefe/pages/AlertsPage.tsx`:**
- 125 líneas, página completa "Centro de Alertas"
- Renderiza tarjetas con 4 variantes de color según `type`: `warning` (naranja), `info` (azul), `success` (verde), `error` (rojo)
- Íconos: `AlertTriangle`, `Info`, `CheckCircle2` según el tipo
- Botón "Actualizar" para recargar alertas manualmente
- Estado vacío con mensaje "No hay alertas activas"
- Loading spinner mientras se cargan los datos

### Tareas

- [x] Implementar endpoint `GET /alerts` en `dashboard_jefe/router.py`
- [x] Crear schemas `AlertSchema` y `AlertsResponse` en `dashboard_jefe/schemas.py`
- [x] Crear `AlertsPage.tsx` con diseño de tarjetas por tipo de alerta
- [x] Integrar `AlertsPage` en el sistema de rutas del dashboard del jefe

## HU-031: Reportes de Pedidos e Inventario

**Descripción:** Como jefe, quiero acceder a reportes detallados de pedidos, inventario y rendimiento del negocio para tomar decisiones informadas.

### Criterios de Aceptación

1. Dashboard de KPIs: pedidos totales, pares vendidos, tareas completadas, pares en producción, filtrados por rango de días (7/30/90)
2. Ventas por categoría con porcentajes
3. Top 5 productos más vendidos
4. Top 5 clientes con más pedidos
5. Mejor empleado por cargo (eficiencia)
6. Reporte de producción semanal con métricas (pares fabricados, tareas completadas, pedidos creados, pares ordenados) agrupados por semana ISO
7. Reporte de ventas semanales
8. Reporte de todos los pedidos de clientes (con filtros por fecha y estado)
9. Reporte de pedidos por cliente individual
10. Exportación de reportes por email (PDF encodeado en base64)
11. Compartir reportes internamente (aparece en dashboard del empleado destino)
12. Exportar reportes a PDF descargable

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/reports/dashboard` | `reports_router.py:76-259` | KPIs, ventas por categoría, top productos, top clientes, top empleados |
| GET | `/api/v1/admin/reports/global/production` | `reports_router.py:705-814` | Métricas semanales de producción con pares fabricados, tareas completadas, pedidos creados y pares ordenados |
| GET | `/api/v1/admin/reports/global/sales` | `reports_router.py:816-859` | Ventas semanales con total de pedidos y pares vendidos |
| GET | `/api/v1/admin/reports/customer/all/orders` | `reports_router.py:575-620` | Todos los pedidos de todos los clientes con filtros opcionales |
| GET | `/api/v1/admin/reports/customer/{user_id}` | `reports_router.py:656-703` | Pedidos de un cliente específico |
| POST | `/api/v1/admin/reports/send-email` | `reports_router.py:862-879` | Envía reporte PDF por email usando `send_report_email` |
| POST | `/api/v1/admin/reports/share-internal` | `reports_router.py:882-907` | Comparte reporte internamente (crea `ReportShare` en BD) |

### Implementación

**Backend — `be/app/modules/admin/reports_router.py`:**
- 908 líneas total, router completo de reportes
- Función auxiliar `_build_order_items()` (líneas 49-73): agrupa `OrderDetails` por `(product_id, colour)` para incluir categoría y color
- Endpoints protegidos con `_require_admin_or_jefe`
- Cálculos: sumas con `func.sum`, conteos con `func.count`, agrupaciones con `GROUP BY`, ordenamiento con `desc`
- Filtro temporal con parámetro `days` o `start_date`/`end_date` opcionales
- KPIs combinan datos de `Order`, `Task`, `Inventory` y `Incidence`

**Frontend — `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx`:**
- 1485 líneas, página con 2 tabs: "Dashboard General" y "Generador de Reportes"
- Dashboard General: KPIs, ventas por categoría (barras de progreso), top productos (con imagen), top empleados por cargo, top clientes
- Generador de Reportes: selector por tipo (empleado, cliente, producción, ventas)
- Exportación PDF con `jspdf` + `jspdf-autotable`
- Funciones exportadoras: `exportDashboardPDF`, `exportEmployeePDF`, `exportCustomerPDF`, `exportOrdersPDF`, `exportTasksPDF`, `exportProductionPDF`
- Modal para email/share con formularios

### Tareas

- [x] Implementar endpoint `GET /dashboard` con KPIs completos
- [x] Implementar endpoint `GET /global/production` con métricas semanales
- [x] Implementar endpoint `GET /global/sales` con ventas semanales
- [x] Implementar endpoint `GET /customer/all/orders` para todos los clientes
- [x] Implementar endpoint `GET /customer/{user_id}` para cliente individual
- [x] Implementar endpoint `POST /send-email` para envío por correo
- [x] Implementar endpoint `POST /share-internal` para compartir internamente
- [x] Crear `ReportsPage.tsx` con dashboard y generador de reportes
- [x] Implementar exportación PDF para cada tipo de reporte
- [x] Implementar modal de envío por email con formulario
- [x] Implementar modal de compartir internamente

## Cambios Técnicos

**Archivos creados/modificados en el backend:**
- `be/app/modules/admin/reports_router.py` — Nuevo router con 7 endpoints (908 líneas)
- `be/app/modules/admin/reports_schemas.py` — Schemas: `DashboardReportResponse`, `KPIResponse`, `CategorySalesResponse`, `TopProductResponse`, `TopCustomerResponse`, `TopEmployeeResponse`, `ProductionGlobalReport`, `ProductionWeeklyMetric`, `SalesGlobalReport`, `SalesWeeklyMetric`, `CustomerReportResponse`, `EmployeeReportResponse`, `TaskBreakdown`, `TaskDetail`, `TaskPriceDetail`, `SendReportEmailRequest`, `ShareInternalRequest`
- `be/app/modules/dashboard_jefe/router.py` — Endpoint `GET /alerts` (líneas 117-155)
- `be/app/modules/dashboard_jefe/schemas.py` — Schemas `AlertSchema`, `AlertsResponse`
- `be/app/utils/email.py` — Función `send_report_email` para envío de PDFs
- `be/app/models/report_share.py` — Modelo `ReportShare` para reportes compartidos

**Archivos creados/modificados en el frontend:**
- `fe/src/modules/dashboard-jefe/pages/AlertsPage.tsx` — Página de alertas (125 líneas)
- `fe/src/modules/dashboard-jefe/pages/ReportsPage.tsx` — Página de reportes (1485 líneas)
- `fe/src/modules/dashboard-jefe/services/dashboardService.ts` — Llamada `getAlerts()`
- `fe/src/modules/dashboard-jefe/services/reportsApi.ts` — Llamadas a todos los endpoints de reportes
- `fe/src/modules/dashboard-jefe/utils/reportsUtils.ts` — Funciones de exportación PDF
- `fe/src/modules/dashboard-jefe/types/dashboard.ts` — Tipo `Alert`
- `fe/src/modules/dashboard-jefe/components/TaskCard.tsx` — Componente de tarjeta de tarea para reportes

## Logros

- Sistema completo de reportes con 7 endpoints backend
- Dashboard de KPIs con 4 métricas clave y filtro temporal
- Visualización de ventas por categoría y top productos
- Ranking de clientes y empleados por rendimiento
- Producción semanal y ventas semanales agrupadas por ISO week
- Exportación PDF funcional para todos los tipos de reporte
- Envío de reportes por email con PDF adjunto
- Reportes compartidos internamente con persistencia en BD
- Alertas en tiempo real desde incidencias abiertas
- Más de 900 líneas de backend y 1600+ líneas de frontend

## Resumen

El Sprint 13 entregó un sistema robusto de alertas y reportes. Se implementaron 9 endpoints backend (incluyendo 7 de reportes y 1 de alertas) y 2 páginas frontend completas. La funcionalidad cubre desde KPIs de alto nivel hasta exportación PDF, envío por email y uso compartido interno, proporcionando al jefe todas las herramientas necesarias para monitorear y analizar el negocio.
