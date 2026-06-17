# Backlog Sprint 5 — Estructura y Visibilidad

**Sprint:** 5
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-008 | Gestión de Marcas y Estilos | 8 | ✅ COMPLETADO |
| HU-009 | Catálogo Visitante | 13 | ✅ COMPLETADO |

## HU-008: Gestión de Marcas y Estilos

**Descripción:** Como administrador/jefe, quiero gestionar marcas y estilos del catálogo para clasificar los productos correctamente.

### Criterios de Aceptación

1. **CRUD completo de marcas**: Crear, listar, actualizar y eliminar marcas desde el panel admin.
2. **CRUD completo de estilos**: Crear, listar, actualizar y eliminar estilos desde el panel admin.
3. **Soft-delete**: Las marcas y estilos eliminados no se muestran en listados pero persisten en BD.
4. **Detección de duplicados**: El sistema rechaza marcas/estilos con nombres duplicados.
5. **Interfaz visual**: Gestión de marcas y estilos desde `CatalogPage.tsx` en el dashboard del jefe.

### Endpoints Creados

| Método | Ruta | Línea | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/admin/catalog/brands` | 51-74 | Listar todas las marcas |
| POST | `/api/v1/admin/catalog/brands` | 76-114 | Crear nueva marca |
| PUT | `/api/v1/admin/catalog/brands/{brand_id}` | 116-174 | Actualizar marca |
| DELETE | `/api/v1/admin/catalog/brands/{brand_id}` | 176-228 | Eliminar marca (soft-delete) |
| GET | `/api/v1/admin/catalog/styles` | 230-266 | Listar estilos (con filtro opcional por marca) |
| POST | `/api/v1/admin/catalog/styles` | 268-332 | Crear nuevo estilo |
| PUT | `/api/v1/admin/catalog/styles/{style_id}` | 334-411 | Actualizar estilo |
| DELETE | `/api/v1/admin/catalog/styles/{style_id}` | 413-465 | Eliminar estilo (soft-delete) |

### Archivos Clave Modificados

- `be/app/modules/admin/catalog_router.py` — Endpoints CRUD de marcas y estilos (líneas 51-465)
- `be/app/modules/admin/catalog_schemas.py` — Schemas `BrandCreateRequest`, `BrandResponse`, `StyleCreateRequest`, `StyleResponse`
- `be/app/models/brand.py` — Modelo `Brand` con `deleted_at` para soft-delete
- `be/app/models/style.py` — Modelo `Style` con `deleted_at` para soft-delete
- `fe/src/modules/dashboard-jefe/pages/CatalogPage.tsx` — Interfaz de gestión de marcas y estilos

## HU-009: Catálogo Visitante

**Descripción:** Como visitante no autenticado, quiero explorar el catálogo de productos para conocer la oferta disponible antes de registrarme.

### Criterios de Aceptación

1. **Sin autenticación**: Todos los endpoints del catálogo público son accesibles sin token JWT.
2. **Listado de categorías**: Muestra todas las categorías activas con nombre y descripción.
3. **Listado de estilos**: Muestra todos los estilos disponibles con su marca asociada.
4. **Inventario por estilo**: Al seleccionar un estilo, muestra tallas disponibles y cantidades.
5. **Listado de marcas**: Muestra todas las marcas activas.
6. **Listado de colores**: Muestra colores distintos disponibles en productos activos.
7. **Listado de productos**: Muestra todos los productos activos con información de estilo, categoría y marca.
8. **Detalle de producto**: Al seleccionar un producto, muestra información completa incluyendo inventario por talla.
9. **Página pública**: Interfaz accesible desde la landing page sin necesidad de login.

### Endpoints Creados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/catalog/categories` | 30-54 | Obtener todas las categorías |
| GET | `/api/v1/catalog/styles` | 57-81 | Obtener todos los estilos con marcas |
| GET | `/api/v1/catalog/styles/{style_id}/inventory` | 84-130 | Obtener tallas y disponibilidad de un estilo |
| GET | `/api/v1/catalog/brands` | 133-156 | Obtener todas las marcas |
| GET | `/api/v1/catalog/colors` | 159-178 | Obtener todos los colores disponibles |
| GET | `/api/v1/catalog/products/{product_id}` | 181-234 | Obtener detalles de un producto por ID |
| GET | `/api/v1/catalog/products` | 237-293 | Obtener todos los productos (con filtros opcionales) |

### Archivos Clave Modificados

- `be/app/modules/catalog/router.py` — 7 endpoints públicos del catálogo (294 líneas total)
- `be/app/modules/catalog/schemas.py` — Schemas de respuesta: `CategoriesListResponse`, `StylesListResponse`, `StyleInventoryResponse`, `BrandsListResponse`, `ProductsListResponse`, `ProductDetailResponse`
- `fe/src/modules/landing/pages/CatalogPage.tsx` — Página pública del catálogo en el módulo landing

## Cambios Técnicos

- Se creó el módulo `be/app/modules/catalog/` con router público y schemas
- Los endpoints admin de marcas/estilos usan `_require_admin_or_jefe` para autorización
- Soft-delete implementado con columna `deleted_at` en modelos `Brand` y `Style`
- Los endpoints públicos filtran por `deleted_at == None` y `state == True` (productos)
- El inventario por estilo suma cantidades de todos los productos del estilo agrupando por talla

## Logros

- Catálogo completamente funcional y navegable sin autenticación
- Separación clara entre rutas admin (protegidas) y rutas públicas
- Base estable para los sprints siguientes de búsqueda e inventario

## Resumen

Sprint 5 estableció la estructura de clasificación del catálogo (marcas y estilos) y expuso todo el catálogo al público. Con 15 endpoints creados (8 admin + 7 públicos), se sentaron las bases para la navegación de productos y la gestión administrativa del catálogo.
