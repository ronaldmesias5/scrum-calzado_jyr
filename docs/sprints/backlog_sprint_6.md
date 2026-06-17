# Backlog Sprint 6 — Búsqueda e Inventario

**Sprint:** 6
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-011 | Búsqueda y Filtrado | 8 | ✅ COMPLETADO |
| HU-016 | Gestión de Inventario | 13 | ✅ COMPLETADO |

## HU-011: Búsqueda y Filtrado

**Descripción:** Como visitante, quiero buscar y filtrar productos en el catálogo para encontrar rápidamente lo que necesito.

### Criterios de Aceptación

1. **Filtro por categoría**: Filtrar productos por `category_id`.
2. **Filtro por marca**: Filtrar productos por `brand_id`.
3. **Filtro por estilo**: Filtrar productos por `style_id`.
4. **Filtro por color**: Filtrar productos por `color`.
5. **Búsqueda por texto**: Búsqueda `ILIKE` sobre nombre del producto, nombre de marca y nombre de estilo.
6. **Multi-filtro en cascada**: Los filtros se combinan (AND) — aplicar múltiples filtros reduce resultados progresivamente.
7. **Sin paginación**: Retorna todos los resultados en una sola respuesta.

### Endpoints Modificados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/catalog/products` | 237-293 | Filtros: `category_id`, `brand_id`, `style_id`, `color`, `search` |

### Detalle de Implementación (líneas 242-273)

```python
def get_products(
    category_id: str | None = None,
    brand_id: str | None = None,
    style_id: str | None = None,
    color: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
) -> ProductsListResponse:
```

- Filtros aplicados secuencialmente con `.where()` sobre la consulta base
- Búsqueda `ILIKE` con joins a `Brand` y `Style` (líneas 268-273):
  ```python
  Product.name_product.ilike(f"%{search}%") |
  Brand.name_brand.ilike(f"%{search}%") |
  Style.name_style.ilike(f"%{search}%")
  ```
- Productos inactivos (`state == False`) excluidos automáticamente
- Productos eliminados (`deleted_at != None`) excluidos

### Archivos Clave Modificados

- `be/app/modules/catalog/router.py` — Endpoint GET /products con parámetros de filtro (líneas 237-293)

## HU-016: Gestión de Inventario

**Descripción:** Como administrador/jefe, quiero gestionar el inventario de productos para controlar el stock disponible, las reservas y los movimientos.

### Criterios de Aceptación

1. **Listar inventario**: Ver todo el inventario con filtros opcionales por producto, talla.
2. **Crear/actualizar inventario**: Agregar o modificar stock de un producto/talla.
3. **Eliminar inventario**: Eliminar un registro de inventario específico.
4. **Actualización bulk**: Actualizar múltiples tallas de un producto en una sola solicitud.
5. **Inventario por talla**: Consultar inventario agrupado por talla para un producto específico.
6. **Movimientos de inventario**: Registrar movimientos (entrada/salida) con razón y fecha.
7. **Interfaz visual**: Página `InventoryPage.tsx` en el dashboard del jefe para gestionar stock.

### Endpoints Creados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/catalog/inventory` | 871-903 | Listar inventario con filtros opcionales |
| POST | `/api/v1/admin/catalog/inventory` | 905-1009 | Crear o actualizar inventario |
| DELETE | `/api/v1/admin/catalog/inventory/{inventory_id}` | 1011-1035 | Eliminar inventario |
| POST | `/api/v1/admin/catalog/inventory/bulk` | 1037-1176 | Actualizar inventario de múltiples tallas |
| GET | `/api/v1/admin/catalog/products/{product_id}/inventory-by-size` | 1233-1280 | Obtener inventario por talla |
| POST | `/api/v1/admin/catalog/inventory/movements` | 1282-1347 | Registrar movimiento de inventario |

### Archivos Clave Modificados

- `be/app/modules/admin/catalog_router.py` — Endpoints CRUD inventario (líneas 871-1347)
- `be/app/modules/admin/catalog_schemas.py` — Schemas: `InventoryCreateRequest`, `InventoryResponse`, `BulkInventoryUpdateRequest`, `InventoryMovementCreateRequest`
- `be/app/models/inventory.py` — Modelo `Inventory` con campos `amount`, `reserved`, `minimum_stock`, `size`, `colour`
- `be/app/models/inventory_movement.py` — Modelo `InventoryMovement` con `type_of_movement` (entrada/salida)
- `fe/src/modules/dashboard-jefe/pages/InventoryPage.tsx` — Página de gestión de inventario

### ⚠️ Nota Técnica: Error de Color en Inventario

Existe una inconsistencia conocida entre el almacenamiento de colores en inventario vs. detalles de pedido:

- **Inventory**: almacena `colour = ""` (cadena vacía) para muchos registros
- **OrderDetail**: almacena colores completos como `"negro x blanco"`, `"rojo"`, etc.

Esto causa que las búsquedas de inventario que filtran por `colour` fallen al no encontrar coincidencias con los detalles del pedido. Como workaround, varias búsquedas en `orders/router.py` ya no filtran por colour (eliminaron el filtro en líneas 497, 540, 572, 730, 1212). **Pendiente**: Normalizar los valores de colour en inventario o eliminar el filtro de colour permanentemente.

## Cambios Técnicos

- El endpoint `GET /catalog/products` amplió sus parámetros de consulta para soportar todos los filtros
- Los filtros se aplican como condiciones `AND` sobre la misma consulta base
- La búsqueda por texto usa `ILIKE` de PostgreSQL (case-insensitive)
- El inventario bulk permite actualizar múltiples tallas en una transacción
- Los movimientos de inventario quedan registrados con tipo, cantidad, fecha y usuario responsable

## Logros

- Búsqueda funcional con 5 criterios de filtrado combinables
- Sistema completo de gestión de inventario con 6 endpoints
- Trazabilidad de movimientos de stock (entradas y salidas)
- Interfaz de usuario para administrar stock desde el dashboard

## Resumen

Sprint 6 completó dos funcionalidades clave: la capacidad de buscar y filtrar productos en el catálogo público (HU-011) y la gestión completa del inventario con stock, reservas y movimientos (HU-016). Queda como deuda técnica la normalización del colour en inventario para evitar discrepancias con los pedidos.
