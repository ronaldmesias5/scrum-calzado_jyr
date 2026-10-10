# 📊 Diccionario de Datos - CALZADO J&R

---

## 🏗️ Resumen General

- **Motor:** PostgreSQL 17
- **Total de Tablas:** 30
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
| **task_priority** | baja, alta | Prioridad de las tareas asignadas (`media` eliminada en mig. 043). |
| **task_type** | corte, guarnicion, soladura, emplantillado | Etapa de producción de calzado. |
| **incidence_status** | abierta, en_progreso, resuelta, cerrada | Estado de un reporte de problema. |
| **notification_type** | info, advertencia, error, exito | Nivel visual de la notificación. |
| **pending_incidence_status** | pending, approved, rejected | Estado de aprobación de incidencias de producto pendientes. |

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
| **avatar_url** | VARCHAR(500) | | URL de la foto de perfil del usuario. |
| **invitation_expires_at** | TIMESTAMPTZ | | Expiración de la contraseña temporal (24h, mig. 038). |
| **email_app_password** | VARCHAR(255) | | App password SMTP para envío de correos (mig. 041). |
| **email_sender** | VARCHAR(255) | | Remitente SMTP (mig. 042). |
| **rejected_by** | UUID | FK → `users(id)` | Usuario que rechazó el registro. |
| **rejected_at** | TIMESTAMPTZ | | Fecha del rechazo. |
| **rejection_reason** | TEXT | | Motivo del rechazo. |
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

*Restricción adicional: UNIQUE `uq_inventory_product_size_colour` (product_id, size, colour) — mig. 039*

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
| **observation** | TEXT | | Observaciones de avance (mig. 025, `PATCH /tasks/{id}/observation`). |
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
| **customer_id** | UUID | FK → `users(id)`, NULLABLE | Cliente propietario (nullable desde mig. 047 — pedidos sin cliente asignado). |
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
| **unit_price** | NUMERIC(12,2) | | Precio unitario congelado al crear el pedido (mig. 049, precios por cliente). |
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
> ⚠️ **LEGACY**: la aplicación no escribe en esta tabla (ni en `detail_vale`). El vale real se maneja con `tasks.vale_number`.

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
> ⚠️ **LEGACY**: la aplicación no escribe en esta tabla. El vale real se maneja con `tasks.vale_number`.

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
| **order_id** | UUID | FK → `orders(id)` ON DELETE SET NULL | Pedido relacionado (si aplica). |
| **link_url** | VARCHAR(500) | | Ruta interna a la que navega al hacer clic. |
| **created_by** | UUID | FK → `users(id)` | Usuario que generó la notificación. |
| **updated_by** | UUID | FK → `users(id)` | Último editor. |
| **deleted_by** | UUID | FK → `users(id)` | Usuario que eliminó la notificación. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 22. REPORT_SHARES

**Propósito:** Almacena los reportes compartidos por un jefe/admin a un empleado para que aparezcan en su dashboard.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **shared_by_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Jefe/admin que comparte. |
| **target_user_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Usuario destinatario. |
| **report_type** | VARCHAR(50) | NOT NULL | Tipo de reporte (performance, produccion, etc.). |
| **report_title** | VARCHAR(255) | | Título visible del reporte. |
| **parameters** | JSONB | | Parámetros con los que se generó. |
| **message** | TEXT | | Nota opcional del remitente. |
| **is_read** | BOOLEAN | DEFAULT FALSE | Estado de lectura por el destinatario. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **read_at** | TIMESTAMPTZ | | Fecha de lectura. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 23. CLIENT_PRICES (Precios por cliente)

**Propósito:** Precio de venta por par de un producto para un cliente específico (mig. 049).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **client_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Cliente. |
| **product_id** | UUID | FK → `products(id)` ON DELETE CASCADE, NOT NULL | Producto. |
| **unit_price** | NUMERIC(12,2) | NOT NULL | Precio por par (COP). |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

*Restricción adicional: UNIQUE `uq_client_product_price` (client_id, product_id)*

---

### 24. AI_EMBEDDINGS (Chatbot IA)

**Propósito:** Fragmentos vectorizados (Dim 768, pgvector) para búsqueda semántica del chatbot "Águila J&R" (mig. 048).

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **content** | TEXT | NOT NULL | Texto del fragmento. |
| **embedding** | VECTOR(768) | | Vector pgvector del contenido. |
| **metadata** | JSONB | | Origen/rol/categoría del fragmento. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

---

### 25. EMAIL_VERIFICATION_TOKENS

**Propósito:** Tokens de verificación de correo (mig. 043).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **user_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Usuario. |
| **token** | VARCHAR(255) | NOT NULL | Token de verificación. |
| **expires_at** | TIMESTAMPTZ | NOT NULL | Expiración. |
| **used** | BOOLEAN | DEFAULT FALSE | Si ya fue canjeado. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

---

### 26. REACTIVATION_TICKETS

**Propósito:** Solicitudes de reactivación de cuentas suspendidas.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **user_id** | UUID | FK → `users(id)` ON DELETE CASCADE, NOT NULL | Usuario solicitante. |
| **email** | VARCHAR(255) | NOT NULL | Correo del solicitante. |
| **reason** | TEXT | NOT NULL | Motivo de la solicitud. |
| **phone** | VARCHAR(20) | | Teléfono de contacto. |
| **identity_document** | VARCHAR(20) | | Documento de identidad. |
| **evidence_url** | VARCHAR(500) | | Evidencia adjunta (URL). |
| **status** | VARCHAR(20) | DEFAULT 'pendiente' | Estado de la solicitud. |
| **admin_comment** | TEXT | | Comentario del jefe al revisar. |
| **reviewed_by** | UUID | FK → `users(id)` | Quien revisó. |
| **reviewed_at** | TIMESTAMPTZ | | Fecha de revisión. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

---

### 27. PENDING_PRODUCT_INCIDENCES

**Propósito:** Incidencias de producto con flujo de aprobación (enum `pending_incidence_status`).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **employee_id** | UUID | FK → `users(id)` | Empleado que reporta. |
| **task_id** | UUID | FK → `tasks(id)` | Tarea relacionada. |
| **customer_id** | UUID | FK → `users(id)` | Cliente relacionado. |
| **order_id** | UUID | FK → `orders(id)` | Pedido relacionado. |
| **order_detail_id** | UUID | FK → `order_details(id)` | Línea de pedido relacionada. |
| **product_id** | UUID | FK → `products(id)`, NOT NULL | Producto afectado. |
| **size** | VARCHAR(50) | NOT NULL | Talla afectada. |
| **colour** | VARCHAR(100) | | Color afectado. |
| **defect_code_id** | UUID | FK → `defect_codes(id)` | Código de defecto asociado. |
| **description** | TEXT | | Detalle de la incidencia. |
| **quantity** | NUMERIC(10,2) | NOT NULL | Cantidad afectada. |
| **observations** | TEXT | | Observaciones. |
| **status** | ENUM | pending_incidence_status, DEFAULT 'pending' | Estado de aprobación. |
| **approved_type** | VARCHAR(50) | | Tipo de aprobación aplicada. |
| **reviewed_by_id** | UUID | FK → `users(id)` | Quien revisó. |
| **reviewed_at** | TIMESTAMPTZ | | Fecha de revisión. |
| **rejection_reason** | TEXT | | Motivo de rechazo. |
| **evidence_image_url** | VARCHAR(500) | | Imagen de evidencia. |
| **loss_record_id** | UUID | FK → `loss_records(id)` | Pérdida generada (si se aprueba). |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 28. DEFECT_CODES

**Propósito:** Catálogo de códigos de defecto de fabricación.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **code** | VARCHAR(50) | UNIQUE, NOT NULL | Código corto (ej. DEF-FAB). |
| **name** | VARCHAR(255) | NOT NULL | Nombre del defecto. |
| **description** | TEXT | | Descripción. |
| **is_active** | BOOLEAN | DEFAULT TRUE | Si está habilitado. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 29. LOSS_RECORDS

**Propósito:** Registro de pérdidas/aprobaciones de scrap (categorías: producto, maquinaria, insumo).

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **incidence_category** | VARCHAR(50) | NOT NULL | producto / maquinaria / insumo. |
| **product_id** | UUID | FK → `products(id)` | Producto afectado. |
| **size** | VARCHAR(50) | | Talla. |
| **machinery_name** | VARCHAR(255) | | Maquinaria (si aplica). |
| **supply_id** | UUID | FK → `supplies(id)` | Insumo afectado (si aplica). |
| **custom_supply_name** | VARCHAR(255) | | Insumo libre (si no está en catálogo). |
| **colour** | VARCHAR(100) | | Color. |
| **quantity** | NUMERIC(10,2) | NOT NULL | Cantidad perdida. |
| **defect_code_id** | UUID | FK → `defect_codes(id)` | Código de defecto. |
| **description** | TEXT | | Descripción. |
| **reason** | TEXT | | Motivo. |
| **observations** | TEXT | | Observaciones. |
| **incident_type** | VARCHAR(50) | NOT NULL | Tipo de incidente. |
| **registered_by_id** | UUID | FK → `users(id)`, NOT NULL | Quien registró. |
| **approved_by_id** | UUID | FK → `users(id)` | Quien aprobó. |
| **approved_at** | TIMESTAMPTZ | | Fecha de aprobación. |
| **order_id** | UUID | FK → `orders(id)` | Pedido relacionado. |
| **order_detail_id** | UUID | FK → `order_details(id)` | Línea de pedido. |
| **line_group** | INTEGER | | Grupo de línea. |
| **repaired_at** | TIMESTAMPTZ | | Fecha de reparación. |
| **repaired_by_id** | UUID | FK → `users(id)` | Quien reparó. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Última actualización. |
| **deleted_at** | TIMESTAMPTZ | | Fecha de eliminación lógica. |

---

### 30. SCRAP_STOCK

**Propósito:** Stock de material en recuperación / scrap por variante.

| Campo | Tipo | Restricciones / FK | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PK | ID único. |
| **product_id** | UUID | FK → `products(id)`, NOT NULL | Producto afectado. |
| **size** | VARCHAR(50) | NOT NULL | Talla. |
| **colour** | VARCHAR(100) | | Color. |
| **quantity** | NUMERIC(10,2) | NOT NULL | Cantidad en scrap. |
| **defect_code_id** | UUID | FK → `defect_codes(id)`, NOT NULL | Código de defecto. |

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
| **FK42** | `report_shares.shared_by_id` | `users(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK43** | `report_shares.target_user_id` | `users(id)` | ON DELETE CASCADE, ON UPDATE CASCADE |
| **FK44** | `notifications.order_id` | `orders(id)` | ON DELETE SET NULL |
| **FK45** | `client_prices.client_id` | `users(id)` | ON DELETE CASCADE |
| **FK46** | `client_prices.product_id` | `products(id)` | ON DELETE CASCADE |
| **FK47** | `email_verification_tokens.user_id` | `users(id)` | ON DELETE CASCADE |
| **FK48** | `reactivation_tickets.user_id` | `users(id)` | ON DELETE CASCADE |
| **FK49** | `reactivation_tickets.reviewed_by` | `users(id)` | ON DELETE SET NULL |
| **FK50** | `pending_product_incidences.product_id` | `products(id)` | — |
| **FK51** | `pending_product_incidences.order_id` | `orders(id)` | — |
| **FK52** | `pending_product_incidences.task_id` | `tasks(id)` | — |
| **FK53** | `pending_product_incidences.employee_id` | `users(id)` | — |
| **FK54** | `pending_product_incidences.defect_code_id` | `defect_codes(id)` | — |
| **FK55** | `pending_product_incidences.loss_record_id` | `loss_records(id)` | — |
| **FK56** | `loss_records.product_id` | `products(id)` | — |
| **FK57** | `loss_records.supply_id` | `supplies(id)` | — |
| **FK58** | `loss_records.registered_by_id` | `users(id)` | — |
| **FK59** | `scrap_stock.product_id` | `products(id)` | — |
| **FK60** | `scrap_stock.defect_code_id` | `defect_codes(id)` | — |

---

## ♾️ Definición Completa de ENUMS (SQL)

```sql
CREATE TYPE occupation_type AS ENUM ('jefe', 'cortador', 'guarnecedor', 'solador', 'emplantillador');
CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida');
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'entregado', 'cancelado');
CREATE TYPE task_status AS ENUM ('pendiente', 'por_liquidar', 'en_progreso', 'completado', 'pagado', 'cancelado');
CREATE TYPE task_priority AS ENUM ('baja', 'alta');
CREATE TYPE task_type AS ENUM ('corte', 'guarnicion', 'soladura', 'emplantillado');
CREATE TYPE incidence_status AS ENUM ('abierta', 'en_progreso', 'resuelta', 'cerrada');
CREATE TYPE notification_type AS ENUM ('info', 'advertencia', 'error', 'exito');
CREATE TYPE pending_incidence_status AS ENUM ('pending', 'approved', 'rejected');
```

---

*Documento generado a partir de los modelos ORM SQLAlchemy — Octubre 2026 (30 tablas)*
