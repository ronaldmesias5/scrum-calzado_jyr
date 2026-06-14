# Sprint 7 - Backlog Scrum
## Asignación de Tareas, Dashboard Empleado y Dashboard Cliente

**Scrum Master:** Andrés Gil  
**Sprint:** 7  
**Duración:** 15 días  
**Equipo:** Ronald (Arquitecto), Santiago (Bases de Datos), Andrés (Scrum Master)  
**Estado:** ✅ **COMPLETADO**  
**Fecha Cierre:** 13 de Junio de 2026

---

## 📊 Estado de las Historias - Sprint 7

| Historia Completada |
|:---|
| ✅ HU-022 - Asignación de Tareas de Producción |
| ✅ HU-024 - Reporte de Avances |

| Historia Pendiente | Historia en Desarrollo | Historia Terminada |
|:---|:---|:---|
| HU-029 - Módulo de Notificaciones | | HU-022 - Asignación de Tareas de Producción |
| HU-030 - Alertas al Jefe | | HU-024 - Reporte de Avances |
| HU-025 - Confirmación de Finalización de Tareas | | |
| HU-026 - Notificación al Jefe de Tareas Completadas | | |
| HU-031 - Reportes de Pedidos | | |
| HU-033 - Suma de Producción | | |

---

## 📋 Historias de Usuario - Sprint 7

### HU-022: Asignación de Tareas de Producción
**Prioridad:** Alta | **Story Points:** 13 | **Estado:** ✅ COMPLETADO

Como jefe de producción,
Quiero asignar tareas de producción a los empleados,
Para distribuir el trabajo según su ocupación y disponibilidad.

**Criterios de Aceptación:**
- [x] Puedo ver listado de empleados disponibles con su ocupación
- [x] Puedo crear tareas asignadas a un empleado específico
- [x] Puedo definir tipo de tarea (corte, guarnición, soladura, emplantillado)
- [x] Las tareas asignadas aparecen en el dashboard del empleado
- [x] El empleado puede ver sus tareas pendientes y en progreso
- [x] Se registra quién asignó cada tarea y cuándo

**Tareas Completadas:**
- [x] Backend: Endpoints CRUD de tareas con asignación a empleados
- [x] Backend: Filtro de tareas por empleado, estado y tipo
- [x] Backend: Migración 026 (report_shares) para reportes compartidos
- [x] Frontend: EmployeeSidebar con navegación
- [x] Frontend: EmployeeLayout con header y avatar
- [x] Frontend: EmployeeTasksPage para ver tareas asignadas
- [x] Frontend: AvailableTasksPage para tareas disponibles
- [x] Frontend: IncidencesPage para reportar problemas

---

### HU-024: Reporte de Avances
**Prioridad:** Alta | **Story Points:** 8 | **Estado:** ✅ COMPLETADO

Como jefe,
Quiero ver reportes de avance de producción y rendimiento de empleados,
Para tomar decisiones informadas sobre la planificación.

**Criterios de Aceptación:**
- [x] Puedo ver reporte general del dashboard con métricas clave
- [x] Puedo ver reporte de producción con filtros por fechas
- [x] Puedo ver reporte de rendimiento individual de empleados
- [x] Los reportes se pueden exportar a PDF
- [x] Los reportes tienen selectores de fecha predefinidos (Hoy, Semana, Mes)
- [x] Los nombres de archivos PDF son legibles (sin caracteres prohibidos en Windows)

**Tareas Completadas:**
- [x] Frontend: ReportsPage con Dashboard General y Producción (jefe)
- [x] Frontend: EmployeeReportsPage con Mi Rendimiento (empleado)
- [x] Frontend: exportDashboardPDF, exportProductionPDF (jefe reportsUtils)
- [x] Frontend: exportPerformancePDF (empleado reportsUtils)
- [x] Frontend: sanitizeFilename() para compatibilidad Windows
- [x] Frontend: Selectores de fecha (Hoy/Semana/Mes/Personalizado)
- [x] Backend: Endpoints de métricas del dashboard_jefe

---

## 🧩 Features Adicionales Implementadas en Sprint 7

### Dashboard Empleado (Nuevo Módulo)
- ✅ EmployeeLayout con sidebar y header (hereda animaciones PageTransition)
- ✅ EmployeeTasksPage: tareas asignadas con filtros por estado
- ✅ AvailableTasksPage: tareas disponibles para tomar
- ✅ IncidencesPage: reporte de problemas en producción
- ✅ EmployeeReportsPage: reporte de rendimiento con exportación PDF
- ✅ EmployeeSettingsPage: configuración de perfil con 5 tabs
- ✅ Ruta /dashboard/employee/settings en App.tsx

### Avatar de Perfil
- ✅ Migración 027: columna `avatar_url` en tabla users
- ✅ POST /api/v1/users/me/avatar (subir foto de perfil)
- ✅ DELETE /api/v1/users/me/avatar (eliminar foto)
- ✅ Avatar en AdminHeader y EmployeeHeader (img con fallback de iniciales)
- ✅ refreshUser() en AuthContext para sincronizar avatar
- ✅ uploadAvatar/deleteAvatar en auth services API

### Dashboard Cliente (Nuevo Módulo)
- ✅ ClientLayout con sidebar y header
- ✅ ClientDashboardPage con resumen de pedidos
- ✅ ClientOrdersPage con consulta de estados
- ✅ Ruta /dashboard/client en App.tsx

---

## 🔧 Cambios Técnicos Realizados en Sprint 7

### Backend
- ✅ Migración 026: tabla `report_shares` (reportes compartidos jefe→empleado)
- ✅ Migración 027: columna `avatar_url` en users
- ✅ Endpoint POST /api/v1/users/me/avatar (subida de imagen)
- ✅ Endpoint DELETE /api/v1/users/me/avatar (eliminación)
- ✅ Fix en /me endpoint (cambio .name → .name_type_document)
- ✅ Las imágenes de avatar se almacenan en /uploads/ (misma infraestructura que productos)

### Frontend (Nuevos Módulos)
- ✅ `fe/src/modules/dashboard-empleado/` — 6 páginas + layout + utils
- ✅ `fe/src/modules/dashboard-cliente/` — 2 páginas + layout
- ✅ EmployeeSettingsPage con 5 tabs (Mi Perfil, Notificaciones, Idioma y Región, Seguridad, Apariencia)
- ✅ Persistencia de preferencias en localStorage con prefijo `emp_`
- ✅ AdminHeader actualizado para mostrar avatar con iniciales fallback
- ✅ "Configuración" nav item en EmployeeSidebar

### PDF Export
- ✅ exportDashboardPDF() en jefe reportsUtils
- ✅ exportProductionPDF() en jefe reportsUtils
- ✅ exportPerformancePDF() en empleado reportsUtils
- ✅ sanitizeFilename() en ambos utils (elimina `<>:"/\|?*` para Windows)
- ✅ Selectores de fecha predefinidos en ambos dashboards
- ✅ Date pickers condicionales (solo visibles con "Personalizado")

---

## 🎯 Logros del Sprint 7

✅ Dashboard Empleado completo con 6 páginas funcionales  
✅ Dashboard Cliente operativo con consulta de pedidos  
✅ Avatar de perfil con subida/eliminación y sincronización en tiempo real  
✅ Exportación PDF en todas las secciones de reportes  
✅ Nombres de archivos PDF compatibles con Windows  
✅ Configuración de perfil con tabs (idioma, apariencia, seguridad)  
✅ Cache-busting de avatar con query param `?v=timestamp`  
✅ Selectores de fecha predefinidos en reportes  

---

## 📊 Resumen de Sprint 7

- [x] HU-022: Asignación de tareas completada
- [x] HU-024: Reporte de avances funcional
- [x] Dashboard Empleado operativo
- [x] Dashboard Cliente operativo
- [x] Avatar de perfil implementado
- [x] Exportación PDF en reportes
- [x] Total de Story Points: 21/21 ✅

**Creado por:** Andrés Gil (Scrum Master)  
**Última Actualización:** 13 de Junio de 2026
