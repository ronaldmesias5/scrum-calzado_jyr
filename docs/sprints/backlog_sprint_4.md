# Backlog Sprint 4 — Catálogo y Clasificación de Productos

**Sprint:** 4
**Duración:** 2 semanas
**SP Total:** 18
**Fecha:** Mayo–Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-006 | Creación de Catálogo de Productos | 13 | ✅ COMPLETADO |
| HU-007 | Clasificación por Categorías | 5 | ✅ COMPLETADO |

---

## HU-006: Creación de Catálogo de Productos (13 SP)

### Descripción
El administrador/jefe puede gestionar el catálogo completo de productos: crear, editar, listar, eliminar (soft-delete) y cambiar estado (activo/inactivo) de productos. Cada producto incluye referencia, imágenes, tallas, colores, material, marca, estilo y categoría.

### Implementación Backend

**Archivo principal:** `be/app/routers/catalog_products.py` (~467-864 líneas)

Este archivo concentra toda la lógica de catálogo en un solo lugar (actualmente ~1365 líneas totales, considerado un "god file" que mezcla CRUD de productos, brands, inventario y lógica de producción).

| Archivo | Rol |
|---------|-----|
| `be/app/routers/catalog_products.py` | CRUD completo de productos, marcas, categorías, estilos. Endpoints de administración del catálogo. |
| `be/app/routers/catalog.py` | Rutas públicas de catálogo (GET /catalog/products, GET /catalog/products/{reference}) |
| `be/app/models/product.py` | Modelo `Product` con campos: `id`, `reference` (unique), `name`, `description`, `id_brand` (FK), `id_category` (FK), `id_style` (FK), `material`, `image_url`, `additional_images` (JSON), `is_active`, `deleted_at`, `created_at`, `updated_at` |
| `be/app/models/inventory.py` | Modelo `Inventory`: `id`, `product_id` (FK), `size`, `colour`, `amount`, `reserved`, `created_at`, `updated_at`. **Problema conocido**: sin unique constraint en `(product_id, size, colour)`, permitiendo duplicados. |
| `be/app/schemas/catalog_admin.py` | Schemas de producto: `ProductCreate`, `ProductUpdate`, `ProductResponse`, `InventoryItemCreate`, `InventoryItemResponse` |
| `be/app/routers/catalog_products.py` | `catalog_service.py` — lógica de negocio para creación/actualización de productos con validaciones |

### Endpoints de Administración
| Método | Ruta | Líneas (aprox) | Descripción |
|--------|------|----------------|-------------|
| GET | `/api/v1/admin/catalog/products` | ~470 | Lista productos con filtros (activos/inactivos/todos), paginación, búsqueda por referencia/nombre |
| POST | `/api/v1/admin/catalog/products` | ~510 | Crea producto con referencia, nombre, descripción, marca, categoría, estilo, material. Genera referencia si no se provee. |
| GET | `/api/v1/admin/catalog/products/{id}` | ~560 | Obtiene detalle de producto por ID |
| PUT | `/api/v1/admin/catalog/products/{id}` | ~590 | Actualiza producto completo. Reemplaza todos los campos. |
| DELETE | `/api/v1/admin/catalog/products/{id}` | ~640 | Soft-delete: setea `deleted_at` |
| PUT | `/api/v1/admin/catalog/products/{id}/toggle-state` | ~670 | Cambia entre activo/inactivo |
| POST | `/api/v1/admin/catalog/products/{id}/image` | ~700 | Sube imagen principal del producto. Almacena en `/uploads/`. |
| POST | `/api/v1/admin/catalog/products/{id}/images/additional` | ~740 | Sube imágenes adicionales (JSON array de URLs). |
| GET | `/api/v1/admin/catalog/brands` | ~780 | Lista marcas |
| POST | `/api/v1/admin/catalog/brands` | ~800 | Crea marca |
| GET | `/api/v1/admin/catalog/styles` | ~820 | Lista estilos |
| POST | `/api/v1/admin/catalog/styles` | ~840 | Crea estilo |

### Endpoints Públicos
| Método | Ruta | Archivo | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/catalog/products` | `be/app/routers/catalog.py` | Lista productos activos para clientes. Filtros por categoría, marca, estilo. |
| GET | `/api/v1/catalog/products/{reference}` | `be/app/routers/catalog.py` | Detalle de producto por referencia (público) |
| GET | `/api/v1/catalog/categories` | `be/app/routers/catalog.py` | Lista categorías (público) |

### Inventario
El inventario se gestiona dentro del producto: cada producto tiene múltiples registros de inventario (talla + color + cantidad). Los endpoints de producto incluyen manejo de inventario anidado.

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/pages/admin/CatalogPage.tsx` | Página principal de gestión de catálogo. Tabla de productos con búsqueda y filtros. Modal de creación/edición. |
| `fe/src/features/admin/components/molecules/ProductFormModal.tsx` | Modal con formulario completo: datos generales, tallas, colores, cantidades, imágenes. |
| `fe/src/services/adminApi.ts` | `getProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `toggleProductState()`, `uploadProductImage()` |
| `fe/src/pages/public/CatalogPage.tsx` | Catálogo público visible para clientes no autenticados |

### Datos Semilla
El catálogo se siembra automáticamente al iniciar el backend con **65 productos** de calzado (zapatillas, botas, sandalias, etc.) con marcas, categorías y estilos predefinidos.

---

## HU-007: Clasificación por Categorías (5 SP) — ✅ COMPLETADO

### Estado: ✅ COMPLETADO

### Lo que SÍ está implementado
- **Modelo `Category`** en `be/app/models/category.py`: `id`, `name`, `description`, `is_active`, `deleted_at`
- **Endpoint público**: `GET /api/v1/catalog/categories` — lista categorías activas (consumido por el catálogo público y filtros)
- **CRUD Admin** en `be/app/routers/catalog_categories.py` (registrado en `main.py`):
  | Método | Ruta | Estado |
  |--------|------|--------|
  | `GET` | `/api/v1/admin/categories` | ✅ IMPLEMENTADO |
  | `POST` | `/api/v1/admin/categories` | ✅ IMPLEMENTADO (valida nombre único → 409) |
  | `PUT` | `/api/v1/admin/categories/{id}` | ✅ IMPLEMENTADO |
  | `DELETE` | `/api/v1/admin/categories/{id}` | ✅ IMPLEMENTADO |
- **Página admin**: `fe/src/pages/admin/CategoriesPage.tsx` con listado, modal de formulario y confirmación de borrado, integrada en el sidebar y rutas del dashboard
- **Filtro frontend**: `isRealCategory()` excluye nombres de etapas de producción usados como categorías falsas
- **Seed data**: 7 categorías sembradas automáticamente (Zapatillas, Botas, Sandalias, Zapatos, Tacones, Deportivos, Accesorios)
- **Asignación a productos**: `Product.id_category` (FK) ya se usa en la creación de productos
- **Validación de categoría existente** al crear/editar productos

### Lo que NO está implementado (por diseño / fuera de alcance)
- Ocultamiento de productos por categoría inactiva (el endpoint público filtra solo por `deleted_at`)
- Registro de auditoría en tabla (los eventos van a `audit.log`)

### Dependencia con HU-006
HU-007 es parcialmente dependiente de HU-006 porque las categorías son un atributo del producto. La gestión CRUD independiente de categorías ya existe.

---

## Cambios Técnicos

- **Nuevos modelos**: `Product`, `Inventory`, `Category`, `Brand`, `Style` con sus migraciones Alembic
- **Catálogo público**: Módulo `be/app/routers/catalog.py` con router público
- **Catálogo admin**: Endpoints en `be/app/routers/catalog_products.py`
- **Upload de imágenes**: Almacenamiento en `/uploads/` con serving estático
- **Seed data**: 65 productos, 7 categorías, marcas y estilos precargados
- **Frontend**: `CatalogPage.tsx` con tabla, filtros, búsqueda, modal de creación/edición

## Problemas Conocidos

1. **God file**: `catalog_router.py` (~1365 líneas) concentra CRUD de productos, marcas, inventario. Debería dividirse en `router → controller → service → repository`.
2. **Unique constraint en Inventory**: ✅ Resuelto — restricción única en `(product_id, size, colour)` agregada (migración 039).
3. **Color mismatch**: Inventory almacena `colour = ""` (string vacío) mientras que `order_details` usa nombres completos ("negro x blanco"). Esto causa fallos en lookups de inventario desde pedidos.

## Logros

- Catálogo completo con 65 productos de calzado pre-cargados
- CRUD completo de productos con imágenes, tallas, colores
- Catálogo público visible para clientes
- Sistema de marcas y estilos asociados a productos
- Soft-delete y toggle de estado activo/inactivo
- CRUD completo de categorías (backend + frontend)

## Resumen

El Sprint 4 implementó la gestión completa del catálogo de productos (HU-006) con CRUD administrativo y vista pública. La clasificación por categorías (HU-007) está completa: modelo, seed data, asignación a productos, CRUD administrativo (`catalog_categories.py`) y página `CategoriesPage.tsx`. Se identificaron problemas técnicos (god file, color mismatch); el unique constraint de inventario ya fue resuelto.
