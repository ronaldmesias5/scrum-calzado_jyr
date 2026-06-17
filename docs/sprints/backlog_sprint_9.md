# Backlog Sprint 9 — Defectos y Reparaciones

**Sprint:** 9  
**Duración:** 2 semanas  
**SP Total:** 13  
**Fecha:** Junio 2026  
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-019 | Pérdidas Defectuosas | 5 | ✅ COMPLETADO |
| HU-020 | Restauración de Calzado | 8 | ✅ COMPLETADO |

## HU-019: Pérdidas Defectuosas

Registro de pérdidas de calzado por defectos de fabricación con códigos de defecto categorizados.

**Criterios de Aceptación:**
- El jefe/admin puede crear códigos de defecto (código, nombre, descripción)
- El jefe/admin puede registrar una pérdida seleccionando: producto, talla, color, cantidad, código de defecto y motivo
- Al registrar una pérdida, el inventario se descuenta automáticamente
- Los incidentes se clasifican en 3 tipos: `perdida`, `en_reparacion`, `devuelto`
- El jefe/admin puede ver la lista de pérdidas con filtros (tipo, producto, fechas)
- El jefe/admin puede ver el detalle de una pérdida individual
- El jefe/admin puede aprobar o rechazar un registro de pérdida
- Existe un endpoint para consultar el stock de scrap acumulado

**Tareas:**
1. Crear modelo `Scrap` (incidentes de scrap) y `DefectCode` en la base de datos
2. Implementar `be/app/modules/scrap/service.py` con lógica de negocio:
   - `register_incident()`: descuenta del inventario al registrar
   - `repair_incident()`, `approve_loss()`, `reject_loss()` para máquina de estados
   - `get_scrap_stock()` para consultar stock de scrap
3. Implementar `be/app/modules/scrap/router.py` con 9 endpoints REST (ver cambios técnicos)
4. Crear frontend `LossesPage.tsx` con tabla de pérdidas y acciones de aprobar/rechazar
5. Integrar filtros por tipo de incidente, producto y rango de fechas

## HU-020: Restauración de Calzado

Máquina de estados para reparar calzado defectuoso y reincorporarlo al inventario o al pedido original.

**Criterios de Aceptación:**
- El jefe/admin puede marcar una incidencia como reparada indicando el destino (`repair_destination`)
- Si la incidencia es tipo `en_reparacion`:
  - Destino `restore_order`: restaura al `OrderDetail` original y añade a `inventory.reserved` (para pedidos completados)
  - Destino `restore_inventory`: restaura al inventario general (para pedidos entregados o en progreso)
- Si la incidencia es tipo `devuelto`:
  - Destino `customer_return`: maneja devolución al cliente sin restaurar stock
  - Destino `restore_inventory`: restaura al inventario general
- El endpoint `PATCH /losses/{loss_id}/repair` transiciona el estado a `reparado`
- La interfaz `LossesPage.tsx` muestra opciones de reparación según el tipo de incidente

**Tareas:**
1. Implementar `repair_incident()` en `service.py` con la máquina de estados completa
2. Lógica de reincorporación: restaurar a `OrderDetail.inventory.reserved` o `inventory.amount`
3. Manejar el caso `devuelto` con retorno al cliente o restauración a inventario
4. Agregar acción de reparación en `LossesPage.tsx` con selector de destino
5. Validar que no se pueda reparar una incidencia ya reparada

## Cambios Técnicos

### Endpoints creados (`be/app/modules/scrap/router.py`, 228 líneas total)

| Endpoint | Líneas | Descripción |
|----------|--------|-------------|
| `GET /api/v1/scrap/defect-codes` | 59-67 | Listar códigos de defecto activos |
| `POST /api/v1/scrap/defect-codes` | 70-82 | Crear nuevo código de defecto |
| `GET /api/v1/scrap/losses` | 90-115 | Listar incidencias con filtros (tipo, producto_id, fechas, paginación) |
| `POST /api/v1/scrap/losses` | 118-144 | Registrar incidencia con descuento de inventario |
| `GET /api/v1/scrap/losses/{loss_id}` | 147-161 | Detalle de una incidencia |
| `PATCH /api/v1/scrap/losses/{loss_id}/repair` | 164-177 | Marcar como reparada con `repair_destination` |
| `PATCH /api/v1/scrap/losses/{loss_id}/approve` | 185-196 | Aprobar pérdida (backwards compat) |
| `PATCH /api/v1/scrap/losses/{loss_id}/reject` | 200-212 | Rechazar pérdida (backwards compat) |
| `GET /api/v1/scrap/stock` | 220-228 | Listar stock de scrap acumulado |

### Archivos clave modificados/creados

| Archivo | Cambio |
|---------|--------|
| `be/app/modules/scrap/__init__.py` | Nuevo módulo scrap |
| `be/app/modules/scrap/router.py` | 9 endpoints REST |
| `be/app/modules/scrap/service.py` | Lógica de negocio: registro, reparación, aprobación, rechazo |
| `be/app/modules/scrap/schemas.py` | Schemas: DefectCode, Incident, RepairRequest, ScrapStock |
| `be/app/models/scrap.py` | Modelos: `Scrap`, `DefectCode` |
| `be/alembic/versions/XXX_scrap_tables.py` | Migración para tablas de scrap |
| `fe/src/modules/dashboard-jefe/pages/LossesPage.tsx` | Frontend con tabla, filtros y acciones |

### Tipos de incidente

| Tipo | Descripción | Acciones disponibles |
|------|-------------|---------------------|
| `perdida` | Pérdida total | approve, reject |
| `en_reparacion` | Pendiente de reparación | repair → restore_order / restore_inventory |
| `devuelto` | Devolución de cliente | repair → customer_return / restore_inventory |

### Lógica de inventario

- **Registro de pérdida**: `inventory.amount -= quantity`
- **Reparación `restore_order`**: `order_detail.reserved += quantity`
- **Reparación `restore_inventory`**: `inventory.amount += quantity`
- **Devolución `customer_return`**: Sin cambio de inventario (el cliente se queda con el producto)

## Logros

- Sistema completo de trazabilidad de pérdidas con 3 tipos de incidente
- Códigos de defecto categorizados para análisis de calidad
- Descuento automático de inventario al registrar pérdidas
- Máquina de estados para reparación con reincorporación inteligente al pedido original o al inventario general
- Manejo de devoluciones de cliente con dos modalidades
- Backwards compatibility con endpoints approve/reject para integraciones existentes

## Resumen

El Sprint 9 implementa el módulo completo de gestión de defectos y reparaciones (scrap). Se crearon 9 endpoints REST que permiten registrar pérdidas con códigos de defecto, reparar calzado defectuoso reincorporándolo al inventario o pedido original, y consultar el stock de scrap acumulado. El inventario se descuenta automáticamente al registrar una pérdida, y la máquina de estados de reparación maneja 3 tipos de incidente con destinos diferenciados. El frontend `LossesPage.tsx` proporciona una interfaz completa con tabla de incidencias, filtros y acciones de aprobar/rechazar/reparar.
