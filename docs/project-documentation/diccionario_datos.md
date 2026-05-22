# 📊 Diccionario de Datos - CALZADO J&R

---

## 🏗️ Resumen General

- **Motor:** PostgreSQL 17
- **Total de Tablas:** 22
- **MER:** https://drive.google.com/file/d/1fWGxdwjIHfuCTPplSWGAwSNAE5vKLGD4/view?usp=sharing

---

## ♾️ Tipos Enumerados (ENUMS)

| Nombre | Valores | Descripción |
| :--- | :--- | :--- |
| **occupation_type** | jefe, cortador, guarnecedor, solador, emplantillador | Cargos operativos en la fábrica. |
| **supplies_movement_type** | entrada, salida | Tipo de flujo de materia prima. |
| **inventory_movement_type** | entrada, salida, ajuste | Tipo de flujo de producto terminado. |
| **order_status** | pendiente, en_progreso, completado, entregado, cancelado | Estado de un pedido mayorista. |
| **task_status** | pendiente, por_liquidar, en_progreso, completado, pagado, cancelado | Estado de una tarea de producción. |
| **task_priority** | baja, media, alta | Prioridad de las tareas asignadas. |
| **task_type** | corte, guarnicion, soladura, emplantillado | Etapa de producción de calzado. |
| **incidence_status** | abierta, en_progreso, resuelta, cerrada | Estado de un reporte de problema. |
| **notification_type** | info, advertencia, error, exito | Nivel visual de la notificación. |

---

## 📑 Tablas Operacionales

### 1. ROLES

**Propósito:** Define los niveles de acceso al sistema.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK, DEFAULT uuid_generate_v4() | ID único del rol. |
| **name_role** | VARCHAR(50) | UNIQUE, NOT NULL | Nombre (admin, employee, client). |
| **description_role** | VARCHAR(255) | | Explicación del alcance del rol. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 2. TYPE_DOCUMENT

**Propósito:** Clasificación de documentos de identidad (C.C., NIT, etc.).

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK, DEFAULT uuid_generate_v4() | ID único. |
| **name_type_document** | VARCHAR(100) | UNIQUE, NOT NULL | Nombre del tipo de documento. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 3. USERS

**Propósito:** Entidad central que gestiona credenciales de acceso, perfiles de empleados y clientes.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único de usuario. |
| **email** | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico (login). |
| **hashed_password** | VARCHAR(255) | NOT NULL | Contraseña cifrada. |
| **name_user** | VARCHAR(255) | NOT NULL | Nombres. |
| **last_name** | VARCHAR(255) | NOT NULL | Apellidos. |
| **phone** | VARCHAR(20) | | Teléfono de contacto. |
| **identity_document** | VARCHAR(20) | | Número de documento físico. |
| **identity_document_type_id** | UUID | FK → `type_document(id)` | Tipo de documento. |
| **role_id** | UUID | FK → `roles(id)`, NOT NULL | Rol asignado. |
| **is_active** | BOOLEAN | DEFAULT FALSE | Si la cuenta puede loguearse. |
| **is_validated** | BOOLEAN | DEFAULT FALSE | Aprobación por parte de un Jefe. |
| **must_change_password** | BOOLEAN | DEFAULT FALSE | Forzar cambio en próximo inicio de sesión. |
| **session_version** | INTEGER | NOT NULL, DEFAULT 1 | Versión de sesión para invalidar tokens. |
| **accepted_terms** | BOOLEAN | DEFAULT FALSE | Aceptación de términos y condiciones. |
| **terms_accepted_at** | TIMESTAMPTZ | | Fecha de aceptación de términos. |
| **business_name** | VARCHAR(255) | | Razón social (solo para Clientes). |
| **occupation** | ENUM | occupation_type | Cargo (solo para Empleados). |
| **validated_by** | UUID | FK → `users(id)` | Jefe que validó al usuario. |
| **validated_at** | TIMESTAMPTZ | | Fecha de validación. |
| **created_by** | UUID | FK → `users(id)` | Usuario que creó el registro. |
| **updated_by** | UUID | FK → `users(id)` | Usuario que editó el registro. |
| **deleted_by** | UUID | FK → `users(id)` | Usuario que eliminó el registro. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW(), ON UPDATE NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 4. PASSWORD_RESET_TOKENS

**Propósito:** Almacena tokens temporales para recuperación de contraseñas.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **user_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Propietario del token. |
| **token** | VARCHAR(255) | UNIQUE, NOT NULL | Hash del token de seguridad. |
| **expires_at** | TIMESTAMPTZ | NOT NULL | Fecha de expiración. |
| **used** | BOOLEAN | DEFAULT FALSE | Indica si ya fue canjeado. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha emisión. |

---

### 5. SUPPLIES

**Propósito:** Listado Maestro de Insumos (Cueros, hilos, suelas, etc.).

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **name_supplies** | VARCHAR(255) | NOT NULL | Nombre del insumo. |
| **description_supplies** | TEXT | | Detalles técnicos. |
| **category** | VARCHAR(50) | DEFAULT 'otros' | Categoría del insumo. |
| **color** | VARCHAR(50) | | Color del insumo. |
| **stock_quantity** | NUMERIC(10,2) | DEFAULT 0 | Cantidad en stock. |
| **sizes** | JSONB | | Tallas disponibles (formato JSON). |
| **unit** | VARCHAR(50) | DEFAULT 'unidades' | Unidad de medida. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 6. SUPPLIES_MOVEMENT

**Propósito:** Registro histórico de entradas y salidas de materia prima de bodega.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **supplies_id** | UUID | FK → `supplies(id)` ON DELETE RESTRICT, NOT NULL | El insumo movido. |
| **user_id** | UUID | FK → `users(id)` ON DELETE RESTRICT, NOT NULL | Usuario que opera el movimiento. |
| **type_of_movement** | ENUM | supplies_movement_type | Entrada o Salida. |
| **amount** | NUMERIC(10,2) | NOT NULL | Cantidad movida. |
| **colour** | VARCHAR(100) | | Color del insumo si aplica. |
| **size** | VARCHAR(50) | | Talla del insumo si aplica. |
| **sizes** | JSONB | | Tallas múltiples en formato JSON. |
| **movement_date** | TIMESTAMPTZ | NOT NULL | Fecha efectiva. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 7. SUPPLY_CATEGORIES

**Propósito:** Categorías independientes para insumos (materias primas, consumibles, etc.).

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **name** | VARCHAR(50) | UNIQUE, NOT NULL | Nombre de la categoría. |
| **global_stage** | VARCHAR(50) | DEFAULT 'otros' | Etapa global asociada. |
| **color** | VARCHAR(20) | DEFAULT 'blue' | Color representativo. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

---

### 8. CATEGORIES

**Propósito:** Categorización del calzado (Deportivo, Casual, Botas, etc.).

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **name_category** | VARCHAR(255) | UNIQUE, NOT NULL | Nombre único. |
| **description_category** | TEXT | | Descripción. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 9. BRANDS

**Propósito:** Marcas comerciales de calzado manejadas.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **name_brand** | VARCHAR(255) | UNIQUE, NOT NULL | Ej. "Nike", "Adidas", "Propios". |
| **description_brand** | TEXT | | Detalles de la marca. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 10. STYLES

**Propósito:** Estilos o modelos específicos dentro de una marca.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **brand_id** | UUID | FK → `brands(id)` ON DELETE RESTRICT, NOT NULL | Marca a la que pertenece. |
| **name_style** | VARCHAR(255) | NOT NULL | Nombre del modelo (ej. "Air Max"). |
| **description_style** | TEXT | | Descripción del estilo. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 11. PRODUCTS (Catálogo)

**Propósito:** Definición de producto final (combinación de categoría, marca y estilo).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **style_id** | UUID | FK → `styles(id)` ON DELETE RESTRICT, NOT NULL | Estilo vinculado. |
| **brand_id** | UUID | FK → `brands(id)` ON DELETE RESTRICT, NOT NULL | Marca vinculada. |
| **category_id** | UUID | FK → `categories(id)` ON DELETE RESTRICT, NOT NULL | Categoría vinculada. |
| **name_product** | VARCHAR(255) | NOT NULL | Nombre descriptivo. |
| **description_product** | TEXT | | Descripción detallada del producto. |
| **color** | VARCHAR(100) | | Color principal. |
| **image_url** | VARCHAR(500) | | Ruta a la imagen del catálogo. |
| **insufficient_threshold** | INTEGER | DEFAULT 12 | Cantidad para alerta de bajo stock. |
| **state** | BOOLEAN | DEFAULT TRUE | Habilitado/Deshabilitado. |
| **task_prices** | JSONB | NOT NULL, DEFAULT '{}' | Precios por tipo de tarea (COP/docena). |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 12. PRODUCT_SUPPLIES

**Propósito:** Vinculación M:N entre productos e insumos con cantidad requerida.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **product_id** | UUID | FK → `products(id)` ON DELETE CASCADE, NOT NULL | Producto. |
| **supply_id** | UUID | FK → `supplies(id)` ON DELETE CASCADE, NOT NULL | Insumo requerido. |
| **quantity_required** | NUMERIC(10,4) | DEFAULT 1 | Unidades del insumo por par/producto. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

*Restricción adicional: UNIQUE (product_id, supply_id)*

---

### 13. INVENTORY (Bodega Central)

**Propósito:** Stock consolidado y disponible de productos terminados por talla y color.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **product_id** | UUID | FK → `products(id)` ON DELETE RESTRICT, NOT NULL | Producto referenciado. |
| **size** | VARCHAR(50) | NOT NULL | Talla específica. |
| **colour** | VARCHAR(100) | | Color específico. |
| **amount** | NUMERIC(10,2) | NOT NULL | Pares actuales en bodega. |
| **reserved** | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Stock reservado para pedidos activos. |
| **minimum_stock** | INTEGER | DEFAULT 0 | Nivel de reorden por variante. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 14. INVENTORY_MOVEMENT

**Propósito:** Auditoría y trazabilidad de cada cambio en el inventario.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **product_id** | UUID | FK → `products(id)` ON DELETE RESTRICT, NOT NULL | Producto afectado. |
| **user_id** | UUID | FK → `users(id)` ON DELETE RESTRICT, NOT NULL | Responsable del cambio. |
| **type_of_movement** | ENUM | inventory_movement_type | Entrada, Salida, Ajuste. |
| **size** | VARCHAR(50) | | Talla específica del movimiento. |
| **colour** | VARCHAR(100) | | Color específico del movimiento. |
| **amount** | NUMERIC(10,2) | NOT NULL | Diferencia aplicada. |
| **reason** | VARCHAR(255) | | Por qué se hizo el ajuste. |
| **movement_date** | TIMESTAMPTZ | NOT NULL | Fecha efectiva del movimiento. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 15. TASKS

**Propósito:** Definición de tareas de producción para operarios.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **assigned_to** | UUID | FK → `users(id)` ON DELETE RESTRICT, NOT NULL | Operario responsable. |
| **vale_number** | INTEGER | | Número de vale asociado. |
| **amount** | INTEGER | DEFAULT 0 | Cantidad de pares asignados. |
| **order_id** | UUID | FK → `orders(id)` ON DELETE CASCADE | Pedido al que pertenece. |
| **product_id** | UUID | FK → `products(id)` ON DELETE CASCADE | Producto a fabricar. |
| **line_group** | INTEGER | NOT NULL, DEFAULT 0 | Grupo de numeración dentro del producto en el pedido. |
| **description_task** | TEXT | NOT NULL | Instrucciones detalladas. |
| **priority** | ENUM | task_priority | Nivel de urgencia. |
| **type** | ENUM | task_type | Etapa (Corte, Guarnición, Soladura, Emplantillado). |
| **status** | ENUM | task_status, DEFAULT 'pendiente' | Estado actual. |
| **deadline** | TIMESTAMPTZ | | Fecha límite pactada. |
| **assignment_date** | TIMESTAMPTZ | NOT NULL | Fecha en que se asignó. |
| **completed_at** | TIMESTAMPTZ | | Fecha de finalización. |
| **created_by** | UUID | FK → `users(id)` | Usuario que creó la tarea. |
| **updated_by** | UUID | FK → `users(id)` | Usuario que actualizó la tarea. |
| **deleted_by** | UUID | FK → `users(id)` | Usuario que eliminó la tarea. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 16. ORDERS

**Propósito:** Encabezado de pedidos realizados por Clientes.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID pedido. |
| **customer_id** | UUID | FK → `users(id)`, NOT NULL | Cliente propietario. |
| **total_pairs** | INTEGER | NOT NULL | Suma total de pares del pedido. |
| **state** | ENUM | order_status, DEFAULT 'pendiente' | Estado del pedido. |
| **delivery_date** | TIMESTAMPTZ | | Fecha compromiso de entrega. |
| **creation_date** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de recepción. |
| **created_by** | UUID | FK → `users(id)` | Usuario que creó la orden. |
| **updated_by** | UUID | FK → `users(id)` | Usuario que actualizó la orden. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 17. ORDER_DETAILS

**Propósito:** Desglose del pedido por producto, talla y color.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID detalle. |
| **order_id** | UUID | FK → `orders(id)` ON DELETE CASCADE, NOT NULL | Pedido padre. |
| **product_id** | UUID | FK → `products(id)`, NOT NULL | Calzado solicitado. |
| **size** | VARCHAR(50) | NOT NULL | Talla específica. |
| **colour** | VARCHAR(100) | | Color específico. |
| **amount** | INTEGER | NOT NULL | Cantidad de pares. |
| **observations** | TEXT | | Observaciones específicas del producto. |
| **line_group** | INTEGER | NOT NULL, DEFAULT 0 | Agrupa filas de una misma adición al pedido. |
| **state** | ENUM | order_status, DEFAULT 'pendiente' | Estado de la línea. |
| **order_date** | TIMESTAMPTZ | NOT NULL | Fecha del pedido. |
| **created_by** | UUID | FK → `users(id)` | Usuario que creó la línea. |
| **updated_by** | UUID | FK → `users(id)` | Usuario que actualizó la línea. |
| **deleted_by** | UUID | FK → `users(id)` | Usuario que eliminó la línea. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 18. VALE

**Propósito:** Documento de liquidación para la entrega de trabajo terminado.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID vale. |
| **order_id** | UUID | FK → `orders(id)` ON DELETE CASCADE, NOT NULL | Pedido al que liquida. |
| **size** | VARCHAR(50) | | Talla específica. |
| **colour** | VARCHAR(100) | | Color específico. |
| **amount** | NUMERIC(10,2) | | Valor o cantidad total liquidada. |
| **creation_date** | TIMESTAMPTZ | DEFAULT NOW() | Fecha emisión. |
| **created_by** | UUID | FK → `users(id)` | Usuario que creó el vale. |
| **updated_by** | UUID | FK → `users(id)` | Usuario que actualizó el vale. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 19. DETAIL_VALE

**Propósito:** Vínculo granular entre una tarea específica, el operario y el vale de liquidación.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID detalle vale. |
| **task_id** | UUID | FK → `tasks(id)` ON DELETE RESTRICT, NOT NULL | Tarea origen. |
| **product_id** | UUID | FK → `products(id)` ON DELETE RESTRICT, NOT NULL | Producto entregado. |
| **user_id** | UUID | FK → `users(id)` ON DELETE RESTRICT, NOT NULL | Operario que entrega. |
| **vale_id** | UUID | FK → `vale(id)` ON DELETE CASCADE, NOT NULL | Vale padre. |
| **size** | VARCHAR(50) | | Talla específica. |
| **colour** | VARCHAR(100) | | Color específico. |
| **amount** | NUMERIC(10,2) | | Cantidad entregada. |
| **creation_date** | TIMESTAMPTZ | DEFAULT NOW() | Fecha emisión. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 20. INCIDENCE

**Propósito:** Registro de problemas durante la producción (fallas de máquina, falta de material, etc.).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID incidencia. |
| **task_id** | UUID | FK → `tasks(id)` ON DELETE RESTRICT, NOT NULL | Tarea donde ocurrió. |
| **type_incidence** | VARCHAR(100) | NOT NULL | Categoría del problema. |
| **description_incidence** | TEXT | | Comentario del operario. |
| **state** | ENUM | incidence_status, DEFAULT 'abierta' | Estado de resolución. |
| **report_date** | TIMESTAMPTZ | NOT NULL | Fecha del reporte. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 21. NOTIFICATIONS

**Propósito:** Centro de alertas para usuarios según eventos del sistema.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID notificación. |
| **user_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Destinatario. |
| **title_notification** | VARCHAR(255) | NOT NULL | Asunto. |
| **message_notification** | TEXT | NOT NULL | Contenido. |
| **type_notification** | ENUM | notification_type | Nivel de importancia. |
| **is_read** | BOOLEAN | DEFAULT FALSE | Estado de lectura. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

## 🗺️ Mapa de Relaciones (FK Completo)

| FK | Columna Origen | Tabla Destino | Comportamiento |
| :--- | :--- | :--- | :--- |
| **FK1** | `users.role_id` | `roles(id)` | — |
| **FK2** | `users.identity_document_type_id` | `type_document(id)` | — |
| **FK3** | `users.validated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK4** | `users.created_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK5** | `users.updated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK6** | `users.deleted_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK7** | `password_reset_tokens.user_id` | `users(id)` | ON DELETE CASCADE |
| **FK8** | `supplies_movement.supplies_id` | `supplies(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK9** | `supplies_movement.user_id` | `users(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK10** | `styles.brand_id` | `brands(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK11** | `products.style_id` | `styles(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK12** | `products.brand_id` | `brands(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK13** | `products.category_id` | `categories(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK14** | `product_supplies.product_id` | `products(id)` | ON DELETE CASCADE |
| **FK15** | `product_supplies.supply_id` | `supplies(id)` | ON DELETE CASCADE |
| **FK16** | `inventory.product_id` | `products(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK17** | `inventory_movement.product_id` | `products(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK18** | `inventory_movement.user_id` | `users(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK19** | `tasks.assigned_to` | `users(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK20** | `tasks.order_id` | `orders(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK21** | `tasks.product_id` | `products(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK22** | `tasks.created_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK23** | `tasks.updated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK24** | `tasks.deleted_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK25** | `orders.customer_id` | `users(id)` | — |
| **FK26** | `orders.created_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK27** | `orders.updated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK28** | `order_details.order_id` | `orders(id)` | ON DELETE CASCADE |
| **FK29** | `order_details.product_id` | `products(id)` | — |
| **FK30** | `order_details.created_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK31** | `order_details.updated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK32** | `order_details.deleted_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK33** | `vale.order_id` | `orders(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK34** | `vale.created_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK35** | `vale.updated_by` | `users(id)` | ON DELETE SET NULL, ON UPDATE CASCADE |
| **FK36** | `detail_vale.task_id` | `tasks(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK37** | `detail_vale.product_id` | `products(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK38** | `detail_vale.user_id` | `users(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK39** | `detail_vale.vale_id` | `vale(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK40** | `incidence.task_id` | `tasks(id)` | ON DELETE RESTRICT, ON UPDATE CASCADE |
| **FK41** | `notifications.user_id` | `users(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |

---

## ♾️ Definición Completa de ENUMS (SQL)

```sql
CREATE TYPE occupation_type AS ENUM ('jefe', 'cortador', 'guarnecedor', 'solador', 'emplantillador');
CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida');
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'entregado', 'cancelado');
CREATE TYPE task_status AS ENUM ('pendiente', 'por_liquidar', 'en_progreso', 'completado', 'pagado', 'cancelado');
CREATE TYPE task_priority AS ENUM ('baja', 'media', 'alta');
CREATE TYPE task_type AS ENUM ('corte', 'guarnicion', 'soladura', 'emplantillado');
CREATE TYPE incidence_status AS ENUM ('abierta', 'en_progreso', 'resuelta', 'cerrada');
CREATE TYPE notification_type AS ENUM ('info', 'advertencia', 'error', 'exito');
```

---

*Documento generado a partir de los modelos ORM SQLAlchemy — Mayo 2026*
