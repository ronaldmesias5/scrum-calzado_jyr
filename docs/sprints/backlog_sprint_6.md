# Sprint 6 - Backlog Scrum
## Producción e Inventario

**Scrum Master:** Andrés Gil  
**Sprint:** 6  
**Duración:** 15 días  
**Equipo:** Ronald (Arquitecto), Santiago (Bases de Datos), Andrés (Scrum Master)  
**Estado:** ✅ **COMPLETADO**  
**Fecha Cierre:** 13 de Junio de 2026

---

## 📊 Estado de las Historias - Sprint 6

| Historia Completada |
|:---|
| ✅ HU-015 - Actualización de Estado de Producción |
| ✅ HU-016 - Gestión de Inventario |

| Historia Pendiente | Historia en Desarrollo | Historia Terminada |
|:---|:---|:---|
| HU-022 - Asignación de Tareas de Producción | | HU-015 - Actualización de Estado de Producción |
| HU-024 - Reporte de Avances | | HU-016 - Gestión de Inventario |
| HU-029 - Módulo de Notificaciones | | |
| HU-030 - Alertas al Jefe | | |
| HU-025 - Confirmación de Finalización de Tareas | | |
| HU-026 - Notificación al Jefe de Tareas Completadas | | |
| HU-031 - Reportes de Pedidos | | |
| HU-033 - Suma de Producción | | |

---

## 📋 Historias de Usuario - Sprint 6

### HU-015: Actualización de Estado de Producción
**Prioridad:** Alta | **Story Points:** 13 | **Estado:** ✅ COMPLETADO

Como jefe de producción,
Quiero actualizar el estado de las órdenes de producción,
Para hacer seguimiento en tiempo real del avance de fabricación.

**Criterios de Aceptación:**
- [x] Puedo ver el listado de órdenes de producción con su estado actual
- [x] Puedo cambiar el estado individual de cada etapa (Corte, Armado, Empaque, Entregado)
- [x] El sistema registra quién hizo cada cambio y cuándo
- [x] Los cambios se reflejan en tiempo real en el dashboard del jefe
- [x] Se notifica a los empleados asignados cuando su tarea cambia de estado
- [x] El historial de cambios queda disponible para auditoría

**Tareas Completadas:**
- [x] Backend: Endpoint PUT /api/v1/admin/tasks/{task_id}/status
- [x] Backend: Lógica de transición de estados (pendiente → en_progreso → completado)
- [x] Backend: Validación de permisos (solo jefe puede cambiar estados)
- [x] Backend: Registro de auditoría (updated_by, updated_at)
- [x] Backend: Migraciones 024-025 (nullable assigned_to, observation en tasks)
- [x] Frontend: Componente de tabla de tareas con estados
- [x] Frontend: Selector de estado con colores por etapa
- [x] Frontend: Integración con API en tiempo real
- [x] Testing: Flujo completo de cambio de estado

---

### HU-016: Gestión de Inventario
**Prioridad:** Alta | **Story Points:** 8 | **Estado:** ✅ COMPLETADO

Como jefe de bodega,
Quiero gestionar el inventario de productos terminados,
Para mantener un control preciso del stock disponible.

**Criterios de Aceptación:**
- [x] Puedo ver el inventario completo con producto, talla, color y cantidad
- [x] Puedo registrar entradas, salidas y ajustes de inventario
- [x] El sistema valida que no haya salidas negativas sin stock suficiente
- [x] Veo el nivel de stock reservado para pedidos activos
- [x] Recibo alertas visuales cuando el stock está por debajo del mínimo
- [x] Todos los movimientos quedan registrados en el historial de auditoría

**Tareas Completadas:**
- [x] Backend: Endpoint GET /api/v1/admin/inventory (listar inventario)
- [x] Backend: Endpoint POST /api/v1/admin/inventory/movement (entrada/salida/ajuste)
- [x] Backend: Validación de stock suficiente antes de salidas
- [x] Backend: Columna reserved en inventory para pedidos activos
- [x] Frontend: InventoryPage con tabla de inventario
- [x] Frontend: Modal de movimiento de inventario
- [x] Frontend: Badge de alerta para stock bajo
- [x] Testing: Validación de movimientos de inventario

---

## 🔧 Cambios Técnicos Realizados en Sprint 6

### Backend
- ✅ Migración 024: `assigned_to` nullable en tasks (permite tareas sin empleado asignado)
- ✅ Migración 025: Columna `observation` en tasks (observaciones del operario)
- ✅ Endpoints de actualización de estado de tareas
- ✅ Endpoints de gestión de inventario con movimientos
- ✅ Validación de stock antes de movimientos de salida

### Frontend
- ✅ TasksPage con tabla de tareas y selector de estado
- ✅ InventoryPage con tabla de inventario y modal de movimientos
- ✅ Alertas visuales de stock mínimo
- ✅ Integración completa con API

---

## 🎯 Logros del Sprint 6

✅ Flujo completo de actualización de estado de producción  
✅ Gestión de inventario con movimientos (entrada, salida, ajuste)  
✅ Alertas de stock mínimo  
✅ Tareas pueden crearse sin empleado asignado (pendientes)  
✅ Observaciones del operario en tareas  
✅ Validación de stock end-to-end  

---

## 📊 Resumen de Sprint 6

- [x] HU-015: Actualización de estado de producción completada
- [x] HU-016: Gestión de inventario funcional
- [x] Documentación y pruebas realizadas
- [x] Total de Story Points: 21/21 ✅

**Creado por:** Andrés Gil (Scrum Master)  
**Última Actualización:** 13 de Junio de 2026
