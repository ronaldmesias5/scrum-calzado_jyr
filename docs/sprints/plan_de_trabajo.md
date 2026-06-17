# Plan de Trabajo — Sistema de Gestión y Producción de Calzado J&R

**Proyecto:** CALZADO J&R  
**Equipo:** Ronald (Arquitecto) | Andrés (Scrum Master) | Santiago (Bases de Datos)  
**Última Actualización:** 16 de Junio de 2026  
**Metodología:** 2 HU por sprint, organizadas por orden de implementación real

> **Nota:** Los sprints están ordenados según lo que se construyó realmente en el sistema, no por dependencias teóricas. Cada sprint representa un entregable funcional de 2 historias de usuario.

---

## Resumen Global

| Sprint | Fase | HUs | SP | Estado |
|--------|------|-----|----|--------|
| Sprint 1 | 🔐 Fundación | HU-001 + HU-003 | 21 | ✅ COMPLETADO |
| Sprint 2 | 🔐 Cuentas | HU-002 + HU-004 | 21 | ✅ COMPLETADO |
| Sprint 3 | 🔐 Ciclo de Vida | HU-005 + HU-029 | 21 | ✅ COMPLETADO |
| Sprint 4 | 📦 Catálogo Base | HU-006 + HU-007 | 18 | ✅⚠️ COMPLETADO |
| Sprint 5 | 📦 Visibilidad | HU-008 + HU-009 | 21 | ✅ COMPLETADO |
| Sprint 6 | 🔍 Búsqueda + Stock | HU-011 + HU-016 | 21 | ✅ COMPLETADO |
| Sprint 7 | 📋 Motor Pedidos | HU-013 + HU-015 | 21 | ✅ COMPLETADO |
| Sprint 8 | 🏭 Movimientos | HU-017 + HU-018 | 13 | ✅⚠️ COMPLETADO |
| Sprint 9 | 🏭 Defectos | HU-019 + HU-020 | 13 | ✅ COMPLETADO |
| Sprint 10 | 🔧 Planificación | HU-021 + HU-022 | 13 | ✅ COMPLETADO |
| Sprint 11 | 🔧 Ejecución | HU-023 + HU-025 | 16 | ✅ COMPLETADO |
| Sprint 12 | 🔧 Seguimiento | HU-024 + HU-027 | 16 | ✅⚠️ COMPLETADO |
| Sprint 13 | 🔔 Alertas + Reportes | HU-030 + HU-031 | 21 | ✅ COMPLETADO |
| Sprint 14 | 📊 Reportes RRHH | HU-032 + HU-033 | 16 | ✅ COMPLETADO |
| Sprint 15 | 📊 Reportes Periódicos | HU-034 + HU-035 | 16 | ✅⚠️ COMPLETADO |
| Sprint 16 | 👤 Tracking + Incidencias | HU-014 + HU-028 | 21 | ✅⚠️ COMPLETADO |

**Leyenda:** ✅ Completado | ⚠️ Parcial (funcionalidad core existe, detalles pendientes)

**HU excluidas (cliente):** HU-010 (Catálogo cliente) y HU-012 (Pedido por cliente) — pendientes de desarrollo futuro.

---

## Sprint 1 — Fundación del Sistema ✅
**HUs:** HU-001 (Creación de Cuentas) + HU-003 (Inicio de Sesión)
**SP:** 13 + 8 = 21

Registro público de clientes y autenticación JWT. La base sobre la que se construye todo el sistema.

---

## Sprint 2 — Gestión de Cuentas ✅
**HUs:** HU-002 (Validación y Activación) + HU-004 (Recuperación de Cuentas)
**SP:** 13 + 8 = 21

El jefe valida/activa cuentas de nuevos registros. Los usuarios recuperan acceso mediante token por email.

---

## Sprint 3 — Ciclo de Vida de Cuentas ✅
**HUs:** HU-005 (Reactivación) + HU-029 (Módulo de Notificaciones)
**SP:** 13 + 8 = 21

Cierre del ciclo de cuentas (creación → validación → suspensión → reactivación). Sistema central de notificaciones REST + WebSocket.

---

## Sprint 4 — Catálogo Base ✅⚠️
**HUs:** HU-006 (Creación de Catálogo) + HU-007 (Clasificación por Categorías)
**SP:** 13 + 5 = 18

CRUD de productos con imágenes. Categorías existen como modelo seed pero **falta CRUD administrativo** (solo consulta pública).

---

## Sprint 5 — Estructura y Visibilidad ✅
**HUs:** HU-008 (Marcas y Estilos) + HU-009 (Catálogo Visitante)
**SP:** 8 + 13 = 21

Gestión de marcas y estilos. Catálogo público con 7 endpoints para visitantes sin autenticación.

---

## Sprint 6 — Búsqueda e Inventario ✅
**HUs:** HU-011 (Búsqueda y Filtrado) + HU-016 (Gestión de Inventario)
**SP:** 8 + 13 = 21

Búsqueda multicriterio (categoría, marca, estilo, color, texto). Gestión de stock con movimientos y actualización por talla.

---

## Sprint 7 — Motor de Pedidos ✅
**HUs:** HU-013 (Notificación de Pedidos) + HU-015 (Actualización de Estados)
**SP:** 8 + 13 = 21

Notificaciones WebSocket + email al crear pedidos. Máquina de estados: pendiente → en_progreso → completado → entregado → cancelado, con lógica de inventario.

---

## Sprint 8 — Movimientos de Inventario ✅⚠️
**HUs:** HU-017 (Auto Inventario) + HU-018 (Registro de Ventas)
**SP:** 8 + 5 = 13

Actualización automática al completar producción. **Ventas: no hay endpoint dedicado** — los datos se derivan de pedidos completados/entregados.

---

## Sprint 9 — Defectos y Reparaciones ✅
**HUs:** HU-019 (Pérdidas Defectuosas) + HU-020 (Restauración)
**SP:** 5 + 8 = 13

Registro de pérdidas con códigos de defecto. Flujo completo de reparación y reincorporación al inventario.

---

## Sprint 10 — Planificación de Producción ✅
**HUs:** HU-021 (Creación de Tareas) + HU-022 (Asignación de Tareas)
**SP:** 8 + 5 = 13

Creación batch de tareas de producción con 4 etapas (corte → guarnición → soladura → emplantillado). Asignación manual por jefe o auto-asignación por empleado.

---

## Sprint 11 — Ejecución del Empleado ✅
**HUs:** HU-023 (Ver Tareas) + HU-025 (Finalizar Tareas)
**SP:** 8 + 8 = 16

Dashboard empleado: lista de tareas asignadas, tareas disponibles por ocupación. Marcado de finalización con auto-creación de siguiente etapa.

---

## Sprint 12 — Seguimiento y Control ✅⚠️
**HUs:** HU-024 (Avances e Incidencias) + HU-027 (Editar/Eliminar Tareas)
**SP:** 8 + 8 = 16

Observaciones en tareas, listado de incidencias. **Edición: faltan endpoints DELETE y PUT para tareas** (solo se puede cambiar estado y asignación).

---

## Sprint 13 — Alertas y Reportes Operativos ✅
**HUs:** HU-030 (Alertas al Jefe) + HU-031 (Reportes Pedidos/Inventario)
**SP:** 8 + 13 = 21

Alertas basadas en incidencias abiertas. Dashboard con KPIs, reportes de producción global, ventas semanales, envío y uso compartido de reportes.

---

## Sprint 14 — Reportes de Personal ✅
**HUs:** HU-032 (Reportes Tareas Empleados) + HU-033 (Producción por Empleado)
**SP:** 8 + 8 = 16

Rendimiento individual y por cargo. KPIs: pares, tareas, ganancias. Auto-reporte del empleado con exportación PDF.

---

## Sprint 15 — Reportes Periódicos ✅⚠️
**HUs:** HU-034 (Producción Semanal) + HU-035 (Pedidos Mensuales Clientes)
**SP:** 8 + 8 = 16

Métricas semanales de producción. **Pedidos mensuales: no hay agrupación explícita por mes** — los datos se listan pero no se consolidan mensualmente.

---

## Sprint 16 — Tracking e Incidencias ✅⚠️
**HUs:** HU-014 (Estado Pedidos Cliente) + HU-028 (Incidencias Maquinaria)
**SP:** 13 + 8 = 21

Cliente puede ver sus pedidos y detalles. **Incidencias: faltan endpoints para crear** (solo lectura desde dashboard empleado).

---

## Mapa de Implementación Real

```
S1-S3:  🔐 Autenticación y Cuentas (001-005, 029)
          ↓
S4-S6:  📦 Catálogo e Inventario (006-009, 011, 016)
          ↓
S7-S9:  📋 Pedidos y Movimientos (013, 015, 017-020)
          ↓
S10-S12: 🔧 Producción y Tareas (021-025, 027)
          ↓
S13-S15: 📊 Reportes y Alertas (030-035)
          ↓
S16:    👤 Cliente (014, 028)
```

---

## Estado Real del Sistema

| Categoría | Cantidad | HUs |
|-----------|----------|-----|
| ✅ Completado | 20 | 001, 002, 003, 004, 005, 006, 008, 009, 011, 013, 015, 016, 017, 019, 020, 021, 022, 023, 025, 029, 030, 031, 032, 033, 034 |
| ⚠️ Parcial | 7 | 007, 014, 018, 024, 027, 028, 035 |
| ❌ Pendiente | 1 | 026 (Notificación finalización tareas) |

**Total implementado:** 32 de 35 HU (excluidas 010 y 012 por ser funcionalidad de cliente pendiente)
