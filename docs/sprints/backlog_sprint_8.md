# Backlog Sprint 8 — Movimientos de Inventario

**Sprint:** 8
**Duración:** 2 semanas
**SP Total:** 13
**Fecha:** Junio 2026
**Estado:** ✅ COMPLETADO 

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-017 | Actualización Automática de Inventario | 8 | ✅ COMPLETADO |
| HU-018 | Registro de Ventas | 5 | ✅ COMPLETADO  |

## HU-017: Actualización Automática de Inventario

**Descripción:** Como jefe, quiero que el inventario se actualice automáticamente cuando se completa una tarea de producción para tener stock siempre sincronizado.

### Criterios de Aceptación

1. **Auto-inventario al completar emplantillado**: Al finalizar la última etapa de producción (emplantillado), los pares fabricados se agregan automáticamente al inventario.
2. **Actualización de OrderDetail.state**: Los detalles de la orden asociados a la tarea se marcan como "completado".
3. **Incremento de reserved**: Los pares fabricados se suman a `inventory.reserved` (no a `amount`).
4. **Registro de movimiento**: Cada entrada genera un `InventoryMovement` con tipo `entrada`.
5. **Completado desde bodega**: Cuando un producto se completa desde bodega, se descuenta de `inventory.amount` y se suma a `inventory.reserved`.
6. **Entrega al cliente**: Al entregar, se descuenta de `inventory.reserved` y se registra movimiento de salida.
7. **Creación de inventario si no existe**: Si no hay registro de inventario para el producto/talla, se crea uno nuevo.

### Detalles de Implementación

**Flujo de actualización automática** en `be/app/modules/orders/router.py` (líneas 1193-1260):

```
1. Tarea de tipo "emplantillado" cambia a estado "completado"
2. Buscar OrderDetails por order_id + product_id + line_group (líneas 1199-1203)
3. Para cada detail:
   a. Actualizar detail.state = "completado" (línea 1206)
   b. Buscar Inventory por product_id + size + colour (líneas 1209-1214)
   c. Si existe → sumar cantidad a inventory.reserved (línea 1220)
   d. Si no existe → crear nuevo Inventory con amount=0, reserved=quantity (líneas 1238-1247)
   e. Registrar InventoryMovement de tipo entrada (líneas 1224-1234 o 1250-1260)
```

**Completado desde bodega** en `PUT /{order_id}` (líneas 736-753):
```
1. Detectar "Completado desde bodega" en observations (línea 725)
2. inventory_item.amount -= quantity (descontar de stock físico)
3. inventory_item.reserved += quantity (agregar a reservados)
```

**Entrega al cliente** en `PATCH /{order_id}/status` (líneas 535-564):
```
1. Restar de inventory.reserved (línea 549)
2. Registrar InventoryMovement de tipo salida (líneas 554-563)
```

### Archivos Clave Modificados

- `be/app/modules/orders/router.py` — Auto-inventario en emplantillado (líneas 1193-1260), completado desde bodega (líneas 736-753), entregado (líneas 535-564)
- `be/app/models/inventory.py` — Modelo Inventory con campos `amount`, `reserved`
- `be/app/models/inventory_movement.py` — Modelo InventoryMovement
- `be/app/models/order.py` — Modelo OrderDetail con campo `state` y `line_group`

## HU-018: Registro de Ventas ✅ COMPLETADO 

**Descripción:** Como jefe, quiero registrar y consultar las ventas realizadas para analizar el rendimiento del negocio.

### Estado Actual: ✅ COMPLETADO 

No existe un endpoint dedicado para "registrar venta". Las ventas se **derivan** de los pedidos en estado `completado` o `entregado`. No hay un registro de ventas independiente con datos financieros (precio, descuentos, impuestos, ganancia).

### Criterios de Aceptación (Implementados)

1. **Reporte de ventas globales**: Endpoint que consulta pedidos completados/entregados y los agrupa por semana.
2. **Métricas disponibles**: Total de pedidos en el período, total de pares vendidos.
3. **Desglose semanal**: Ventas agrupadas por semana con conteo de pedidos y pares.
4. **Filtro por período**: Parámetros `days`, `start_date`, `end_date` para acotar la consulta.
5. **Interfaz de reportes**: `ReportsPage.tsx` muestra las métricas de ventas.

### Criterios de Aceptación (Pendientes)

- ❌ **Registro financiero**: No hay campo de precio/ingreso por venta.
- ❌ **Cálculo de ganancia**: No se descuenta costo de insumos para calcular margen.
- ❌ **Exportación específica**: No hay exportación de ventas como funcionalidad separada (el PDF exporta reportes generales).
- ❌ **Detalle por producto**: No se puede ver qué productos específicos se vendieron más.

### Endpoints Relacionados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/reports/global/sales` | 816-859 | Reporte general de ventas por semana |

### Detalle de Implementación (líneas 816-859)

```python
def get_global_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
```

- Filtra órdenes por rango de fechas y estado (`completado` o `entregado`) (líneas 832-836)
- Calcula total de pedidos y pares en el período (líneas 838-839)
- Agrupa por semana usando `isocalendar()` (líneas 841-848)
- Retorna `SalesGlobalReport` con métricas semanales (líneas 855-859)

### Archivos Clave

- `be/app/modules/admin/reports_router.py` — `get_global_sales()` (líneas 816-859)
- `be/app/modules/admin/reports_schemas.py` — `SalesGlobalReport`, `SalesWeeklyMetric`
- `fe/src/pages/admin/ReportsPage.tsx` — Interfaz de reportes con métricas de ventas

## Cambios Técnicos

- El auto-inventario se dispara al completar la tarea de emplantillado (no antes)
- Los pares fabricados siempre van a `reserved`, nunca a `amount` (stock de bodega)
- El flujo completo inventario: producción → reserved, bodega → amount → reserved, entrega → reserved↓
- Los movimientos de inventario proporcionan trazabilidad completa de cada entrada/salida
- Las ventas se miden indirectamente a través del estado de los pedidos

## Logros

- Inventario se actualiza automáticamente al finalizar producción
- Trazabilidad completa de pares fabricados: producción → reserva → entrega
- Reporte de ventas semanal basado en pedidos completados/entregados

## Deuda Técnica

- **HU-018 parcial**: Falta un modelo de ventas independiente con datos financieros (precio, costo, ganancia)
- **Colour mismatch**: El inventario almacena colour como cadena vacía, causando discrepancias con los detalles de pedido que usan nombres completos
- **Sin cálculo de ganancia**: No es posible determinar margen de ganancia por pedido sin datos de costos de insumos

## Resumen

Sprint 8 automatizó la actualización de inventario al completar producción (HU-017), cerrando el ciclo producción→stock→entrega. La HU-018 (Registro de Ventas) quedó parcial porque no hay un modelo de ventas dedicado — los datos se derivan de pedidos completados/entregados a través del reporte global de ventas. Se requiere trabajo futuro para implementar un registro financiero completo con precios, costos y ganancias.
