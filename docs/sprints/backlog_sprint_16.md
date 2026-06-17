# Backlog Sprint 16 — Pedidos Cliente e Incidencias Empleado

**Sprint:** 16  
**Duración:** 2 semanas  
**SP Total:** 21  
**Fecha:** Junio 2026  
**Estado:** ⚠️ PARCIAL (HU-028 incompleta)

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-014 | Consulta Estado Pedidos Cliente | 13 | ✅ COMPLETADO |
| HU-028 | Registro Incidencias Maquinaria | 8 | ⚠️ PARCIAL |

## HU-014: Consulta Estado Pedidos Cliente

**Descripción:** Como cliente, quiero consultar el estado de mis pedidos de calzado para hacer seguimiento a mi solicitud.

### Criterios de Aceptación

1. Listar todos los pedidos del cliente autenticado con su estado actual
2. Ver detalle de un pedido específico incluyendo: nombre del producto, estilo, categoría, marca, imagen, talla, color, cantidad y estado del detalle
3. Tabla con búsqueda por ID de pedido
4. Paginación de 10 resultados por página
5. Badges de estado con colores: Pendiente (gris), En Progreso (ámbar), Completado (azul), Entregado (verde), Cancelado (rojo)
6. Modal de detalle con información completa del pedido
7. Los pedidos se ordenan del más reciente al más antiguo
8. Eager loading de detalles, productos e inventario para evitar N+1 queries

### Endpoints

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/client/orders` | `client/router.py:53-76` | Lista pedidos del cliente autenticado |
| GET | `/api/v1/client/orders/{order_id}` | `client/router.py:79-99` | Detalle de un pedido específico |

### Implementación

**Backend — `be/app/modules/client/router.py`:**

- `GET /orders` (líneas 53-76):
  - Consulta `Order` con `selectinload(Order.details).selectinload(OrderDetail.product).selectinload(Product.inventory)` para eager loading completo
  - Filtra por `customer_id == current_user.id`
  - Ordena por `created_at` descendente
  - Cuenta total de pedidos con `func.count`
  - Convierte cada orden a `ClientOrderResponse` usando `_order_to_client_response()`

- `GET /orders/{order_id}` (líneas 79-99):
  - Misma eager loading que el listado
  - Filtra por `order_id` Y `customer_id` (seguridad: cliente solo ve sus propios pedidos)
  - Retorna 404 si no se encuentra el pedido

- Función `_order_to_client_response()` (líneas 24-50):
  - Convierte `Order` a `ClientOrderResponse`
  - Mapea cada `OrderDetail` a `ClientOrderDetailItem` incluyendo:
    - `product_name` (de `Product.name_product`)
    - `style_name` (de `Style.name_style`)
    - `category_name` (de `Category.name_category`)
    - `brand_name` (de `Brand.name_brand`)
    - `image_url`, `size`, `colour`, `amount`, `state`

**Frontend — `fe/src/modules/dashboard-cliente/pages/OrdersPage.tsx`:**
- 232 líneas, página completa "Mis Pedidos"
- Tabla responsive con columnas: N° Pedido, Fecha, Total Pares, Estado, Acción
- Búsqueda por ID de pedido con campo de texto e ícono de lupa
- Paginación: 10 resultados por página con controles Anterior/Siguiente
- Badges de estado con 5 colores (STATUS_MAP)
- Modal de detalle (`<Modal>` con `createPortal`) que muestra:
  - Productos del pedido con imagen, nombre, talla, color, cantidad, estado del detalle
  - Información de estilo, categoría y marca
- Loading spinner mientras carga
- Estado vacío cuando no hay pedidos

**Esquemas (`be/app/modules/client/schemas.py`):**
- `ClientOrderListResponse`: `total` (int) + `items` (list[ClientOrderResponse])
- `ClientOrderResponse`: id, customer_id, total_pairs, state, creation_date, delivery_date, created_at, updated_at, details (list[ClientOrderDetailItem])
- `ClientOrderDetailItem`: id, product_id, product_name, style_name, category_name, brand_name, image_url, size, colour, amount, state

### Tareas

- [x] Implementar `GET /client/orders` con eager loading
- [x] Implementar `GET /client/orders/{order_id}` con validación de propiedad
- [x] Crear función `_order_to_client_response()` con mapeo completo de detalles
- [x] Crear esquemas de respuesta: `ClientOrderListResponse`, `ClientOrderResponse`, `ClientOrderDetailItem`
- [x] Crear `OrdersPage.tsx` con tabla, búsqueda y paginación
- [x] Implementar modal de detalle con información completa del producto
- [x] Implementar badges de estado con 5 colores
- [x] Paginación cliente-side de 10 elementos

## HU-028: Registro Incidencias Maquinaria ⚠️ PARCIAL

**Descripción:** Como empleado, quiero registrar y consultar incidencias relacionadas con mis tareas de producción para reportar problemas con maquinaria o materiales.

### Criterios de Aceptación

1. ✅ Listar incidencias del empleado autenticado
2. ✅ Filtrar incidencias por estado (pendiente, en_progreso, resuelto, cancelado)
3. ✅ Vista de tarjetas con tipo de incidencia, descripción, estado y fechas
4. ✅ Badges de estado con colores: Pendiente (amarillo), En Progreso (azul), Resuelto (verde), Cancelado (rojo)
5. ❌ **NO implementado:** Crear nuevas incidencias (POST endpoint faltante)
6. ❌ **NO implementado:** Formulario de creación de incidencias en el frontend

### Endpoints Implementados

| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/dashboard/employee/incidences` | `dashboard_empleado/router.py:208-258` | Lista incidencias del empleado con filtro por estado |

### Implementación Actual (Parcial)

**Backend — `be/app/modules/dashboard_empleado/router.py`:**

- `GET /incidences` (líneas 208-258):
  - Join de `Incidence` con `Task` para filtrar por `task.assigned_to == current_user.id`
  - Filtro `deleted_at == None`
  - Filtro opcional por `state`; si no se especifica, muestra `abierta` y `en_progreso`
  - Orden descendente por `created_at`
  - Retorna `EmployeeIncidenceListResponse` con lista de `EmployeeIncidenceSchema`
  - Cada incidencia incluye: id, task_id, type_incidence, description, state, report_date, created_at
  - Try/except para manejar errores silenciosamente

**Frontend — `fe/src/modules/dashboard-empleado/pages/IncidencesPage.tsx`:**
- 188 líneas, página "Incidencias"
- Filtros: selector de estado (Todos/Pendiente/En Progreso/Resuelto/Cancelado), búsqueda por texto
- Tarjetas de incidencia con:
  - Ícono `AlertCircle` con color según estado
  - Tipo de incidencia (convertido de snake_case a texto)
  - Descripción
  - Badge de estado con color: amarillo/azul/verde/rojo
  - Fechas de reporte y creación
- Botón "Actualizar" para recargar
- Estado vacío "Sin incidencias"
- **No hay botón ni formulario para crear nuevas incidencias**

### Lo que Falta (⚠️ PARCIAL)

1. **POST endpoint faltante:** No existe `POST /api/v1/dashboard/employee/incidences` para crear nuevas incidencias
2. **Schema de creación faltante:** No existe `CreateIncidenceRequest` ni validación de campos
3. **Formulario frontend:** IncidencesPage.tsx no tiene botón "Nueva Incidencia" ni modal/formulario de creación
4. **Tarea asociada:** La creación requeriría seleccionar una tarea (`task_id`) a la que asociar la incidencia

### Tareas Completadas

- [x] Implementar `GET /incidences` con filtro por estado
- [x] Crear `IncidencesPage.tsx` con tarjetas de incidencia
- [x] Implementar filtros de estado y búsqueda
- [x] Badges de estado con colores

### Tareas Pendientes

- [ ] Crear endpoint `POST /api/v1/dashboard/employee/incidences`
- [ ] Crear schema `CreateIncidenceRequest` con: task_id, type_incidence, description
- [ ] Validar que la tarea pertenezca al empleado autenticado
- [ ] Agregar `Incidence.report_date = datetime.now()` automático
- [ ] Agregar botón "Nueva Incidencia" en IncidencesPage.tsx
- [ ] Crear modal/formulario de creación con selector de tarea, tipo y descripción
- [ ] Actualizar la lista después de crear una incidencia

## Cambios Técnicos

**Archivos creados/modificados en el backend:**
- `be/app/modules/client/router.py` — Nuevo router con 2 endpoints (99 líneas)
- `be/app/modules/client/schemas.py` — Schemas de cliente: `ClientOrderListResponse`, `ClientOrderResponse`, `ClientOrderDetailItem`
- `be/app/modules/dashboard_empleado/router.py` — Endpoint `GET /incidences` (líneas 208-258)

**Archivos creados/modificados en el frontend:**
- `fe/src/modules/dashboard-cliente/pages/OrdersPage.tsx` — Nueva página (232 líneas)
- `fe/src/modules/dashboard-cliente/services/clientApi.ts` — Llamadas `getMyOrders()`, `getMyOrderDetail()`
- `fe/src/modules/dashboard-cliente/types/client.ts` — Tipos `ClientOrder`, `ClientOrderDetailItem`
- `fe/src/modules/dashboard-empleado/pages/IncidencesPage.tsx` — Nueva página (188 líneas)
- `fe/src/modules/dashboard-empleado/services/employeeApi.ts` — Llamada `getEmployeeIncidences()`
- `fe/src/modules/dashboard-empleado/types/employee.ts` — Tipo `EmployeeIncidence`

## Logros

- Consulta de pedidos para clientes con experiencia completa (búsqueda, paginación, detalle modal)
- Visualización de incidencias para empleados con filtros avanzados
- Eager loading optimizado con `selectinload` para evitar N+1 en consultas de pedidos
- Seguridad: clientes solo ven sus propios pedidos (filtro por `customer_id`)
- Badges de estado con diseño consistente

## Resumen

El Sprint 16 completó la HU-014 con un módulo completo de consulta de pedidos para clientes, incluyendo listado con búsqueda y paginación, detalle modal con información enriquecida del producto, y eager loading para rendimiento. La HU-028 quedó parcial: aunque la consulta y visualización de incidencias funciona completamente con filtros y tarjetas, falta la capacidad de crear nuevas incidencias. Se requiere un endpoint `POST /incidences` con schema de creación y un formulario/modal en IncidencesPage.tsx para completar la historia.
