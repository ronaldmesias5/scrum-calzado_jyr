# Sprint 5 - Backlog Scrum
## Gestión de Pedidos Mayoristas

**Scrum Master:** Andrés Gil  
**Sprint:** 5  
**Duración:** 15 días  
**Equipo:** Ronald (Arquitecto), Santiago (Bases de Datos), Andrés (Scrum Master)  
**Estado:** ✅ **COMPLETADO**  
**Fecha Cierre:** 19 de Marzo de 2026

---

## 📊 Estado de las Historias - Sprint 5

| Historia Completada |
|:---|
| ✅ HU-012 - Realización de Pedidos |
| ✅ HU-014 - Consulta de Estado de Pedidos |

| Historia Pendiente | Historia en Desarrollo | Historia Terminada |
|:---|:---|:---|
| HU-015 - Actualización de Estado de Producción | | HU-012 - Realización de Pedidos |
| HU-016 - Gestión de Inventario | | HU-014 - Consulta de Estado de Pedidos |
| HU-022 - Asignación de Tareas de Producción | | |
| HU-024 - Reporte de Avances | | |
| HU-029 - Módulo de Notificaciones | | |
| HU-030 - Alertas al Jefe | | |
| HU-025 - Confirmación de Finalización de Tareas | | |
| HU-026 - Notificación al Jefe de Tareas Completadas | | |
| HU-031 - Reportes de Pedidos | | |
| HU-033 - Suma de Producción | | |

---

## 📋 Historias de Usuario - Sprint 5

### HU-012: Realización de Pedidos
**Prioridad:** Alta | **Story Points:** 13 | **Estado:** ✅ COMPLETADO

Como cliente mayorista, Quiero crear un pedido con múltiples productos y tallas, Para comprar en volumen los productos que necesito.

**Criterios de Aceptación:**
- [x] Puedo agregar productos al carrito con talla y cantidad
- [x] Puedo modificar la cantidad de cada línea
- [x] Puedo eliminar productos del carrito
- [x] Se muestra el total de pares y valor
- [x] Puedo crear el pedido con fecha de entrega estimada
- [x] El pedido se registra en estado "Pendiente"
- [x] Recibo confirmación inmediata del pedido
- [x] Se valida que hay stock disponible

**Tareas Completadas:**
- [x] Frontend: Crear flujo de carrito/cesta
- [x] Frontend: Componente ProductSelector con talla y cantidad
- [x] Frontend: Línea de detalle de pedido con edición
- [x] Frontend: Formulario de creación de pedido
- [x] Frontend: Validación de datos before submit
- [x] Backend: Crear modelo OrderDetail con product_id, size, colour, amount
- [x] Backend: Crear modelo Order con customer_id, total_pairs, delivery_date
- [x] Backend: Endpoint POST /api/v1/admin/orders (crear pedido)
- [x] Backend: Validación de stock antes de crear  
- [x] Backend: Transacción para garantizar consistencia
- [x] Frontend: Integrar con API y mostrar errores
- [x] Testing: Flujo completo de creación de pedido

---

### HU-014: Consulta de Estado de Pedidos
**Prioridad:** Alta | **Story Points:** 8 | **Estado:** ✅ COMPLETADO

Como cliente, Quiero ver el estado de mis pedidos, Para saber cuándo se entregarán.

**Criterios de Aceptación:**
- [x] Puedo ver listado paginado de mis pedidos
- [x] Veo ID, cliente, cantidad de pares, estado, fecha creación, fecha entrega
- [x] Los estados son: Pendiente, En Producción, Completado, Cancelado
- [x] Puedo filtrar por estado
- [x] Puedo ver detalles completos al hacer click (productos, tallas, cantidades)
- [x] Se muestran imágenes de productos en el detalle
- [x] Puedo descargar un PDF del pedido

**Tareas Completadas:**
- [x] Backend: Endpoint GET /api/v1/admin/orders (listar con paginación)
- [x] Backend: Endpoint GET /api/v1/admin/orders/{order_id} (detalle)
- [x] Backend: Endpoint GET /api/v1/admin/orders?state=pendiente (filtrar)
- [x] Backend: Include imagen_url, brand, category, style en respuesta
- [x] Backend: Considerar audit fields (created_by, updated_by)
- [x] Frontend: Crear OrdersPage con tabla de pedidos
- [x] Frontend: Implementar detalles modal con productos
- [x] Frontend: Mostrar miniaturas de imágenes
- [x] Frontend: Badge de estado con colores
- [x] Frontend: Paginación y filtros
- [x] Frontend: Link a descarga de PDF
- [x] Testing: Verificar que imágenes cargan correctamente

---

## 🔧 Cambios Técnicos Realizados en Sprint 5

### Backend
- ✅ Crear tabla `orders` con uuid PK, customer_id FK, total_pairs, state, delivery_date
- ✅ Crear tabla `order_details` con uuid PK, order_id FK, product_id FK, size, colour, amount
- ✅ Agregar audit fields: created_by, updated_by, deleted_by (UUID refs a users)
- ✅ Establecer relaciones OneToMany Order -> OrderDetail
- ✅ Implementar soft deletes con `deleted_at`
- ✅ Eager loading del producto y su información (brand, category, style)

### Frontend
- ✅ Componente OrdersPage con vista de lista y modal de detalles
- ✅ Modal muestra imagen de cada producto línea a línea
- ✅ Estado Pendiente = Amarillo, En Producción = Azul, Completado = Verde
- ✅ Manejo correcto de CORS para cargar imágenes desde /api/v1/uploads/
- ✅ Resolver URLs de imagen durante renderizado

### Seguridad de Datos
- ✅ Solo se puede crear orden siendo cliente registrado
- ✅ Solo jefe con rol admin puede ver todas las órdenes
- ✅ Validación de stock antes de crear
- ✅ Auditoría completa de cambios

---

## 🎯 Logros del Sprint 5

✅ Flujo completo de creación de pedidos  
✅ Gestión de líneas de detalle con múltiples tallas  
✅ Visualización de estado de pedidos con imágenes  
✅ Filtrado y paginación de órdenes  
✅ Audit trail de todos los cambios  
✅ Validación de datos end-to-end  

---

## 📊 Resumen de Sprint 5

- [x] HU-012: Creación de pedidos completada y probada
- [x] HU-014: Visualización de estado de pedidos funcional
- [x] Documentación y pruebas realizadas
- [x] Total de Story Points: 21/21 ✅

**Creado por:** Andrés Gil (Scrum Master)  
**Última Actualización:** 19 de Marzo de 2026

