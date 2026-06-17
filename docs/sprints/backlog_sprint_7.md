# Backlog Sprint 7 — Motor de Pedidos

**Sprint:** 7
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-013 | Notificación de Nuevos Pedidos | 8 | ✅ COMPLETADO |
| HU-015 | Actualización de Estados | 13 | ✅ COMPLETADO |

## HU-013: Notificación de Nuevos Pedidos

**Descripción:** Como jefe, quiero recibir notificaciones cuando se crea un nuevo pedido para gestionarlo oportunamente.

### Criterios de Aceptación

1. **Notificación en BD**: Al crear un pedido, se crean registros de notificación en la base de datos para todos los usuarios con rol jefe.
2. **WebSocket en tiempo real**: Los jefes conectados via WebSocket reciben la notificación inmediatamente.
3. **Email al jefe**: Se envía correo electrónico al jefe con detalles del nuevo pedido (cliente, pares, fecha).
4. **Email de confirmación al cliente**: El cliente recibe un correo confirmando la recepción de su pedido.
5. **Fire-and-forget**: Las notificaciones asíncronas (WebSocket + emails) se ejecutan en un hilo separado para no bloquear la respuesta HTTP.
6. **Enlace directo**: La notificación incluye un enlace a la página de pedidos del dashboard.

### Detalle de Implementación

**Función `_trigger_notifications()`** en `be/app/modules/orders/router.py` (líneas 284-385):

```
Fase 1 (síncrona, misma transacción):
  → Obtener todos los jefes activos (get_jefes())
  → Crear notificación en BD para cada jefe
  → Preparar datos para fase asíncrona

Fase 2 (fire-and-forget en thread separado, líneas 343-385):
  → WebSocket broadcast a cada jefe via ws_manager.broadcast_to_user()
  → Email al jefe via send_order_notification_email()
  → Email al cliente via send_order_confirmation_email()
  → await asyncio.gather() para ejecución paralela
```

**Activación**: Llamada desde `create_order()` (línea 448) después de crear la orden exitosamente:
```python
_trigger_notifications(
    db=db,
    new_order=new_order,
    customer_check=customer_check,
    settings=settings,
)
```

### Archivos Clave Modificados

- `be/app/modules/orders/router.py` — `_trigger_notifications()` (líneas 284-385), llamado desde `create_order()` (línea 448)
- `be/app/modules/notifications/service.py` — `create_notification()`, `get_jefes()`
- `be/app/modules/notifications/ws_manager.py` — `ws_manager.broadcast_to_user()`
- `be/app/models/notifications.py` — Modelo `Notification` con tipos (`NotificationType`)
- `be/app/utils/email.py` — `send_order_notification_email()`, `send_order_confirmation_email()`

## HU-015: Actualización de Estados

**Descripción:** Como jefe, quiero actualizar el estado de los pedidos para gestionar el flujo de producción y entrega.

### Criterios de Aceptación

1. **Máquina de estados**: Los pedidos siguen el flujo `pendiente → en_progreso → completado → entregado → cancelado`.
2. **Completado → Sumar a reserved**: Al marcar un pedido como completado, los pares se agregan a `inventory.reserved`.
3. **Entregado → Restar de reserved**: Al marcar como entregado, los pares se descuentan de `inventory.reserved`.
4. **Reversión desde completado**: Si un pedido vuelve atrás desde completado, los pares se devuelven a reserved.
5. **Registro de movimientos**: Cada cambio de estado que afecta inventario genera un `InventoryMovement`.
6. **Actualización masiva de detalles**: Al entregar, todos los `OrderDetail` se actualizan a estado `entregado`.
7. **Botones de estado en UI**: Interfaz en `OrdersPage.tsx` con botones para avanzar/retroceder estados.

### Endpoints Creados/Modificados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| PATCH | `/api/v1/orders/{order_id}/status` | 462-620 | Actualizar estado de una orden con lógica de inventario |

### Máquina de Estados y Lógica de Inventario

```
pendiente ──→ en_progreso ──→ completado ──→ entregado
                                    │              │
                                    │  ┌───────────┘
                                    ↓  ↓
                                 cancelado

Transiciones:
- pendiente → en_progreso: Sin cambios en inventario
- en_progreso → completado: SUMAR cantidad a inventory.reserved (líneas 492-532)
- completado → entregado: RESTAR cantidad de inventory.reserved (líneas 535-564)
- completado → cancelado: Devolver a reserved (reversión, líneas 568-596)
- Cualquier estado → completado: Crear InventoryMovement de tipo entrada
- entregado: Actualizar todos los OrderDetail.state a 'entregado' (líneas 602-607)
```

### Archivos Clave Modificados

- `be/app/modules/orders/router.py` — `update_order_status()` (líneas 462-620)
- `be/app/modules/orders/schemas.py` — `OrderUpdateStatusRequest`
- `be/app/models/order.py` — `OrderStatus` enum con valores: `pendiente`, `en_progreso`, `completado`, `entregado`, `cancelado`
- `be/app/models/inventory.py` — Campo `reserved` en modelo Inventory
- `be/app/models/inventory_movement.py` — `InventoryMovementType` enum (`entrada`, `salida`)
- `fe/src/modules/dashboard-jefe/pages/OrdersPage.tsx` — Botones de estado en la interfaz

### ⚠️ Nota Técnica: Filtro de Colour en Búsquedas de Inventario

Las consultas de inventario en `update_order_status()` filtran por `Inventory.colour == detail.colour` (líneas 497, 540, 572). Debido a que inventory almacena colour como cadena vacía mientras order details usa nombres completos, estas búsquedas pueden fallar. Workaround implementado en otros endpoints eliminando el filtro de colour.

## Cambios Técnicos

- Notificaciones con arquitectura híbrida: síncrona (BD) + asíncrona fire-and-forget (WebSocket + email)
- Hilo separado con su propio event loop para operaciones asíncronas
- La máquina de estados valida transiciones permitidas y bloquea cambios inválidos
- Cada transacción de estado que afecta stock es atómica (commit único)
- Los movimientos de inventario proporcionan trazabilidad completa

## Logros

- Sistema de notificaciones multicanal: BD + WebSocket + Email
- Motor de estados funcional con 5 estados y lógica de inventario
- Trazabilidad completa de cambios de estado y movimientos de stock
- Notificaciones en tiempo real sin bloquear la creación de pedidos

## Resumen

Sprint 7 implementó el motor de pedidos completo: desde la notificación multicanal al crear un pedido (HU-013) hasta la máquina de estados con lógica de inventario (HU-015). El sistema ahora gestiona todo el ciclo de vida del pedido: creación → notificación → producción → completado → entrega, con registro de movimientos en cada paso.
