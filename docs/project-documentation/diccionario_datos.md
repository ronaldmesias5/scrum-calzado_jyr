# 📊 Diccionario de Datos - CALZADO J&R

**Base de Datos:** PostgreSQL 17+  
**Sistema:** Sistema de Gestión y Producción de Calzado

---

## 📋 Tabla de Contenidos

1. [Tipos Enumerados](#tipos-enumerados)
2. [Tablas](#tablas)
3. [Relaciones](#relaciones)
4. [Índices](#índices)
5. [Índice Alfabético](#índice-alfabético)

---

## 🏷️ Tipos Enumerados

### occupation_type
Tipo de ocupación laboral para empleados de la fábrica.

| Valor | Descripción |
|-------|-----------|
| `jefe` | Encargado de orquestar tareas, validar cuentas y gestionar la producción |
| `cortador` | Encargado de cortar materiales |
| `guarnecedor` | Encargado de elaborar guarniciones |
| `solador` | Encargado de preparar suelas y montar |
| `emplantillador` | Encargado de terminar calzado |

### supplies_movement_type
Tipo de movimiento de insumos.

| Valor | Descripción |
|-------|-----------|
| `entrada` | Ingreso de insumo al inventario |
| `salida` | Egreso de insumo del inventario |

### inventory_movement_type
Tipo de movimiento de inventario de productos.

| Valor | Descripción |
|-------|-----------|
| `entrada` | Ingreso de producto al inventario |
| `salida` | Egreso de producto del inventario |
| `ajuste` | Ajuste de conteo de inventario |

### order_status
Estado de un pedido o línea de detalle.

| Valor | Descripción |
|-------|-----------|
| `pendiente` | Pedido registrado, en espera de procesamiento |
| `en_progreso` | Pedido siendo procesado/fabricado |
| `completado` | Pedido completado |
| `cancelado` | Pedido cancelado |

### task_status
Estado de una tarea asignada.

| Valor | Descripción |
|-------|-----------|
| `pendiente` | Tarea asignada, sin iniciar |
| `en_progreso` | Tarea en ejecución |
| `completado` | Tarea completada exitosamente |
| `cancelado` | Tarea cancelada |

### task_priority
Nivel de prioridad de una tarea.

| Valor | Descripción |
|-------|-----------|
| `baja` | Prioridad baja |
| `media` | Prioridad media |
| `alta` | Prioridad alta |

### task_type
Tipo de tarea según ocupación.

| Valor | Descripción |
|-------|-----------|
| `corte` | Tarea de corte de materiales |
| `guarnicion` | Tarea de elaboración de guarniciones |
| `soladura` | Tarea de soladura |
| `emplantillado` | Tarea de emplantillado/terminado |

### incidence_status
Estado de una incidencia reportada.

| Valor | Descripción |
|-------|-----------|
| `abierta` | Incidencia reportada, sin resolver |
| `en_progreso` | Incidencia en proceso de resolución |
| `resuelta` | Incidencia resuelta |
| `cerrada` | Incidencia cerrada |

### notification_type
Tipo de notificación del sistema.

| Valor | Descripción |
|-------|-----------|
| `info` | Notificación informativa |
| `advertencia` | Notificación de advertencia |
| `error` | Notificación de error |
| `exito` | Notificación de éxito |

---

## 📑 Tablas

**Total: 19 tablas (según script SQL y modelos ORM)**

### ENUMS
Ver sección inicial para los tipos enumerados: occupation_type, supplies_movement_type, inventory_movement_type, order_status, task_status, task_priority, task_type, incidence_status, notification_type.

### roles
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del rol |
| description | VARCHAR(255) | | Descripción del rol |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### type_document
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Tipo de documento |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### users
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único del usuario |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico único |
| hashed_password | VARCHAR(255) | NOT NULL | Contraseña cifrada |
| name | VARCHAR(255) | NOT NULL | Nombres del usuario |
| last_name | VARCHAR(255) | NOT NULL | Apellidos del usuario |
| phone | VARCHAR(20) | | Teléfono de contacto |
| identity_document | VARCHAR(20) | | Número de documento de identidad |
| identity_document_type_id | UUID | FK → type_document(id) | Tipo de documento |
| role_id | UUID | FK → roles(id), NOT NULL | Rol del usuario |
| is_active | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si la cuenta está activa |
| is_validated | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si fue validada por admin |
| must_change_password | BOOLEAN | DEFAULT FALSE, NOT NULL | Fuerza cambio en próximo login |
| business_name | VARCHAR(255) | | Nombre comercial (solo clientes) |
| occupation | occupation_type | | Ocupación laboral (solo empleados) |
| validated_by | UUID | FK → users(id) | Admin que validó la cuenta |
| validated_at | TIMESTAMP+TZ | | Fecha de validación |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### password_reset_tokens
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario propietario del token |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Token único generado |
| expires_at | TIMESTAMP+TZ | NOT NULL | Fecha de expiración |
| used | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si el token fue utilizado |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |

### supplies
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre del insumo |
| description | TEXT | | Descripción y especificaciones |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### supplies_movement
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| supplies_id | UUID | FK → supplies(id), NOT NULL | Insumo movido |
| user_id | UUID | FK → users(id), NOT NULL | Usuario que realizó movimiento |
| type_of_movement | supplies_movement_type | NOT NULL | Tipo de movimiento |
| amount | NUMERIC(10,2) | NOT NULL | Cantidad movida |
| colour | VARCHAR(100) | | Color del insumo |
| size | VARCHAR(50) | | Talla/tamaño del insumo |
| movement_date | TIMESTAMP+TZ | NOT NULL | Fecha y hora del movimiento |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de registro |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### categories
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre de la categoría |
| description | TEXT | | Descripción de la categoría |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### brands
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre de la marca |
| description | TEXT | | Descripción de la marca |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### styles
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| brand_id | UUID | FK → brands(id), NOT NULL | Marca del producto |
| name | VARCHAR(255) | NOT NULL | Nombre del estilo |
| description | TEXT | | Descripción del estilo |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### products
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| category_id | UUID | FK → categories(id), NOT NULL | Categoría del producto |
| brand_id | UUID | FK → brands(id), NOT NULL | Marca del producto |
| style_id | UUID | FK → styles(id), NOT NULL | Estilo/modelo |
| name | VARCHAR(255) | NOT NULL | Nombre del producto |
| description | TEXT | | Descripción del producto |
| state | BOOLEAN | DEFAULT TRUE, NOT NULL | true=activo, false=inactivo |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### inventory_movement
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| product_id | UUID | FK → products(id), NOT NULL | Producto movido |
| user_id | UUID | FK → users(id), NOT NULL | Usuario que realizó movimiento |
| type_of_movement | inventory_movement_type | NOT NULL | Tipo de movimiento |
| size | VARCHAR(50) | | Talla del producto |
| colour | VARCHAR(100) | | Color del producto |
| amount | NUMERIC(10,2) | NOT NULL | Cantidad |
| reason | VARCHAR(255) | | Motivo del movimiento |
| movement_date | TIMESTAMP+TZ | NOT NULL | Fecha y hora del movimiento |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de registro |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### inventory
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| product_id | UUID | FK → products(id), NOT NULL | Producto en inventario |
| size | VARCHAR(50) | NOT NULL | Talla del producto |
| colour | VARCHAR(100) | | Color de la combinación |
| amount | NUMERIC(10,2) | NOT NULL | Cantidad disponible |
| minimum_stock | INTEGER | DEFAULT 0, NOT NULL | Stock mínimo permitido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### tasks
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| description | TEXT | NOT NULL | Descripción de la tarea |
| priority | task_priority | NOT NULL | Prioridad |
| type | task_type | NOT NULL | Tipo de tarea |
| status | task_status | DEFAULT 'pendiente', NOT NULL | Estado de la tarea |
| deadline | TIMESTAMP+TZ | | Fecha límite de entrega |
| assignment_date | TIMESTAMP+TZ | NOT NULL | Fecha de asignación |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### orders
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| customer_id | UUID | FK → users(id), NOT NULL | Cliente que realizó pedido |
| total_pairs | INTEGER | NOT NULL | Cantidad total de pares en el pedido |
| state | order_status | DEFAULT 'pendiente', NOT NULL | Estado del pedido |
| delivery_date | TIMESTAMP+TZ | | Fecha de entrega programada |
| creation_date | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación del pedido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### order_details
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| order_id | UUID | FK → orders(id), NOT NULL | Pedido al que pertenece |
| product_id | UUID | FK → products(id), NOT NULL | Producto ordenado |
| size | VARCHAR(50) | NOT NULL | Talla del producto |
| colour | VARCHAR(100) | | Color del producto |
| amount | INTEGER | NOT NULL | Cantidad de pares |
| state | order_status | DEFAULT 'pendiente', NOT NULL | Estado de la línea |
| order_date | TIMESTAMP+TZ | NOT NULL | Fecha del pedido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### vale
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| size | VARCHAR(50) | | Talla entregada |
| colour | VARCHAR(100) | | Color entregado |
| amount | NUMERIC(10,2) | | Cantidad entregada |
| creation_date | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### detail_vale
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| task_id | UUID | FK → tasks(id), NOT NULL | Tarea asociada |
| product_id | UUID | FK → products(id), NOT NULL | Producto entregado |
| user_id | UUID | FK → users(id), NOT NULL | Usuario que recibió/entregó |
| vale_id | UUID | FK → vale(id), NOT NULL | Vale base |
| size | VARCHAR(50) | | Talla entregada |
| colour | VARCHAR(100) | | Color entregado |
| amount | NUMERIC(10,2) | | Cantidad entregada |
| creation_date | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### incidence
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| task_id | UUID | FK → tasks(id), NOT NULL | Tarea con problema |
| type | VARCHAR(100) | NOT NULL | Tipo de incidencia |
| description | TEXT | | Descripción del problema |
| state | incidence_status | DEFAULT 'abierta', NOT NULL | Estado de la incidencia |
| report_date | TIMESTAMP+TZ | NOT NULL | Fecha de reporte |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### notifications
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario destinatario |
| title | VARCHAR(255) | NOT NULL | Título breve de la notificación |
| message | TEXT | NOT NULL | Contenido detallado del mensaje |
| type | notification_type | NOT NULL | Tipo de notificación |
| is_read | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si ha sido leída |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### brands
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre de la marca |
| description | TEXT | | Descripción de la marca |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### categories
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre de la categoría |
| description | TEXT | | Descripción de la categoría |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### inventory
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| product_id | UUID | FK → products(id), NOT NULL | Producto en inventario |
| size | VARCHAR(50) | NOT NULL | Talla del producto |
| colour | VARCHAR(100) | | Color de la combinación |
| amount | NUMERIC(10,2) | NOT NULL | Cantidad disponible |
| minimum_stock | INTEGER | DEFAULT 0, NOT NULL | Stock mínimo permitido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### products
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| style_id | UUID | FK → styles(id), NOT NULL | Estilo/modelo |
| brand_id | UUID | FK → brands(id), NOT NULL | Marca del producto |
| category_id | UUID | FK → categories(id), NOT NULL | Categoría del producto |
| name | VARCHAR(255) | NOT NULL | Nombre del producto |
| description | TEXT | | Descripción del producto |
| state | BOOLEAN | DEFAULT TRUE, NOT NULL | true=activo, false=inactivo |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### styles
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| brand_id | UUID | FK → brands(id), NOT NULL | Marca del producto |
| name | VARCHAR(255) | NOT NULL | Nombre del estilo |
| description | TEXT | | Descripción del estilo |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### roles
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del rol |
| description | VARCHAR(255) | | Descripción del rol |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### type_document
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Tipo de documento |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### users
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único del usuario |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico único |
| hashed_password | VARCHAR(255) | NOT NULL | Contraseña cifrada |
| name | VARCHAR(255) | NOT NULL | Nombres del usuario |
| last_name | VARCHAR(255) | NOT NULL | Apellidos del usuario |
| phone | VARCHAR(20) | | Teléfono de contacto |
| identity_document | VARCHAR(20) | | Número de documento de identidad |
| identity_document_type_id | UUID | FK → type_document(id) | Tipo de documento |
| role_id | UUID | FK → roles(id), NOT NULL | Rol del usuario |
| is_active | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si la cuenta está activa |
| is_validated | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si fue validada por admin |
| must_change_password | BOOLEAN | DEFAULT FALSE, NOT NULL | Fuerza cambio en próximo login |
| business_name | VARCHAR(255) | | Nombre comercial (solo clientes) |
| occupation | VARCHAR(50) | | Ocupación laboral (solo empleados) |
| validated_by | UUID | FK → users(id) | Admin que validó la cuenta |
| validated_at | TIMESTAMP+TZ | | Fecha de validación |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### password_reset_tokens
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario propietario del token |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Token único generado |
| expires_at | TIMESTAMP+TZ | NOT NULL | Fecha de expiración |
| used | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si el token fue utilizado |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |

### orders
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| customer_id | UUID | FK → users(id), NOT NULL | Cliente que realizó pedido |
| total_pairs | INTEGER | NOT NULL | Cantidad total de pares en el pedido |
| state | VARCHAR(20) | DEFAULT 'pendiente', NOT NULL | Estado del pedido |
| delivery_date | TIMESTAMP+TZ | | Fecha de entrega programada |
| creation_date | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación del pedido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### order_details
| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| order_id | UUID | FK → orders(id), NOT NULL | Pedido al que pertenece |
| product_id | UUID | FK → products(id), NOT NULL | Producto ordenado |
| size | VARCHAR(50) | NOT NULL | Talla del producto |
| colour | VARCHAR(100) | | Color del producto |
| amount | INTEGER | NOT NULL | Cantidad de pares |
| state | VARCHAR(20) | DEFAULT 'pendiente', NOT NULL | Estado de la línea |
| order_date | TIMESTAMP+TZ | NOT NULL | Fecha del pedido |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

### 1️⃣ roles
**Descripción:** Tabla principal de roles del sistema.

Almacena los tres roles fundamentales del sistema:
- **Admin:** Administrador del sistema
- **Employee:** Empleado de fábrica
- **Client:** Cliente externo

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del rol |
| `description` | VARCHAR(255) | | Descripción del rol |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete (auditoría) |

**Datos Iniciales:**
- admin: "Administrador del sistema"
- employee: "Empleado de la fábrica"
- client: "Cliente — gestión de pedidos"

---

### 2️⃣ type_document
**Descripción:** Tipos de documentos de identificación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Tipo de documento (CC, NIT, Pasaporte, etc) |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 3️⃣ users
**Descripción:** Tabla central de usuarios del sistema.

Almacena información de administradores, empleados y clientes.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único del usuario |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico único |
| `hashed_password` | VARCHAR(255) | NOT NULL | Contraseña cifrada con bcrypt |
| `name` | VARCHAR(255) | NOT NULL | Nombres del usuario |
| `last_name` | VARCHAR(255) | NOT NULL | Apellidos del usuario |
| `phone` | VARCHAR(20) | | Teléfono de contacto |
| `identity_document` | VARCHAR(20) | | Número de documento de identidad |
| `identity_document_type_id` | UUID | FK → type_document(id) | Tipo de documento |
| `role_id` | UUID | FK → roles(id), NOT NULL | Rol del usuario |
| `is_active` | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si la cuenta está activa |
| `is_validated` | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si fue validada por admin |
| `must_change_password` | BOOLEAN | DEFAULT FALSE, NOT NULL | Fuerza cambio en próximo login |
| `business_name` | VARCHAR(255) | | Nombre comercial (solo clientes) |
| `occupation` | occupation_type | | Ocupación laboral (solo empleados) |
| `validated_by` | UUID | FK → users(id) | Admin que validó la cuenta |
| `validated_at` | TIMESTAMP+TZ | | Fecha de validación |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

**Índices:**
- `idx_users_email` (email) — Búsquedas rápidas en login

---

### 4️⃣ password_reset_tokens
**Descripción:** Tokens de recuperación de contraseña.

Almacena códigos temporales para reseteo de contraseñas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `user_id` | UUID | FK → users(id), NOT NULL | Usuario propietario del token |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Token único generado |
| `expires_at` | TIMESTAMP+TZ | NOT NULL | Fecha de expiración (60 min) |
| `used` | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si el token fue utilizado |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |

**Índices:**
- `idx_password_reset_tokens_token` (token) — Búsquedas rápidas de tokens

---

### 5️⃣ notifications
**Descripción:** Registro de notificaciones del sistema para usuarios.

Almacena mensajes sobre eventos importantes (pedidos, tareas, validaciones, etc.). Cada usuario tiene su panel de notificaciones que aparece en tiempo real.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `user_id` | UUID | FK → users(id), NOT NULL | Usuario destinatario |
| `title` | VARCHAR(255) | NOT NULL | Título breve de la notificación |
| `message` | TEXT | NOT NULL | Contenido detallado del mensaje |
| `type` | notification_type | NOT NULL | 'info', 'advertencia', 'error', 'exito' |
| `is_read` | BOOLEAN | DEFAULT FALSE, NOT NULL | Indica si ha sido leída |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

**Índices:**
- `idx_notifications_user_id` (user_id) — Búsquedas rápidas por usuario
- `idx_notifications_is_read` (is_read) — Filtrar notificaciones no leídas

---

### 6️⃣ supplies
**Descripción:** Registro centralizado de insumos (materiales).

Almacena cueros, telas, pegamentos, herrajes, plantillas y componentes necesarios para fabricación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(255) | NOT NULL | Nombre descriptivo del insumo |
| `description` | TEXT | | Descripción y especificaciones técnicas |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 7️⃣ supplies_movement
**Descripción:** Registro de movimientos de insumos (entradas y salidas).

Controla el flujo de materiales desde compra hasta uso en producción.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `supplies_id` | UUID | FK → supplies(id), NOT NULL | Insumo movido |
| `user_id` | UUID | FK → users(id), NOT NULL | Usuario que realizó movimiento |
| `type_of_movement` | supplies_movement_type | NOT NULL | 'entrada' o 'salida' |
| `amount` | NUMERIC(10,2) | NOT NULL | Cantidad movida |
| `colour` | VARCHAR(100) | | Color del insumo |
| `size` | VARCHAR(50) | | Talla/tamaño del insumo |
| `movement_date` | TIMESTAMP+TZ | NOT NULL | Fecha y hora del movimiento |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de registro |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 8️⃣ categories
**Descripción:** Categorías de productos.

Zapatos, botas, sandalias, botines, etc.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(255) | NOT NULL | Nombre de la categoría |
| `description` | TEXT | | Descripción de la categoría |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 9️⃣ brands
**Descripción:** Marcas o fabricantes de productos.

Nike, Adidas, Puma, marcas propias, etc.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(255) | NOT NULL | Nombre de la marca |
| `description` | TEXT | | Descripción de la marca |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---
### 🔟 styles
**Descripción:** Estilos/modelos específicos de producto.

Modelos o diseños particulares dentro de una marca.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|----------|
| `id` | UUID | PK | Identificador único |
| `brand_id` | UUID | FK → brands(id), NOT NULL | Marca del producto |
| `name` | VARCHAR(255) | NOT NULL | Nombre del estilo |
| `description` | TEXT | | Descripción del estilo |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---
### 🔟 references
**Descripción:** Referencias o estilos específicos de producto.

Modelos o diseños particulares dentro de una marca.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `brand_id` | UUID | FK → brands(id), NOT NULL | Marca del producto |
| `name` | VARCHAR(255) | NOT NULL | Nombre de la referencia/estilo |
| `description` | TEXT | | Descripción del estilo |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣1️⃣ products
**Descripción:** Catálogo de productos finales.

Combinación de categoría, marca y estilo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|----------|
| `id` | UUID | PK | Identificador único |
| `category_id` | UUID | FK → categories(id), NOT NULL | Categoría del producto |
| `brand_id` | UUID | FK → brands(id), NOT NULL | Marca del producto |
| `style_id` | UUID | FK → styles(id), NOT NULL | Estilo/modelo |
| `name` | VARCHAR(255) | NOT NULL | Nombre del producto |
| `description` | TEXT | | Descripción del producto |
| `state` | BOOLEAN | DEFAULT TRUE, NOT NULL | true=activo, false=inactivo |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣2️⃣ inventory
**Descripción:** Inventario de productos en bodega.

Cantidad disponible por talla, color y producto.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `product_id` | UUID | FK → products(id), NOT NULL | Producto en inventario |
| `size` | VARCHAR(50) | NOT NULL | Talla del producto |
| `colour` | VARCHAR(100) | | Color de la combinación |
| `amount` | NUMERIC(10,2) | NOT NULL | Cantidad disponible |
| `minimum_stock` | INTEGER | DEFAULT 0, NOT NULL | Stock mínimo permitido |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣3️⃣ inventory_movement
**Descripción:** Registro de movimientos de inventario.

Entradas, salidas y ajustes de productos en bodega.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `product_id` | UUID | FK → products(id), NOT NULL | Producto movido |
| `user_id` | UUID | FK → users(id), NOT NULL | Usuario que realizó movimiento |
| `type_of_movement` | inventory_movement_type | NOT NULL | 'entrada', 'salida' o 'ajuste' |
| `size` | VARCHAR(50) | | Talla del producto |
| `colour` | VARCHAR(100) | | Color del producto |
| `amount` | NUMERIC(10,2) | NOT NULL | Cantidad |
| `reason` | VARCHAR(255) | | Motivo del movimiento |
| `movement_date` | TIMESTAMP+TZ | NOT NULL | Fecha y hora del movimiento |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de registro |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣4️⃣ tasks
**Descripción:** Tareas asignadas a empleados.

Corte, guarnición, soladura, emplantillado, etc.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `description` | TEXT | NOT NULL | Descripción de la tarea |
| `priority` | task_priority | NOT NULL | 'baja', 'media' o 'alta' |
| `type` | task_type | NOT NULL | 'corte', 'guarnicion', 'soladura', 'emplantillado' |
| `status` | task_status | DEFAULT 'pendiente', NOT NULL | Estado de la tarea |
| `deadline` | TIMESTAMP+TZ | | Fecha límite de entrega |
| `assignment_date` | TIMESTAMP+TZ | NOT NULL | Fecha de asignación |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣5️⃣ orders
**Descripción:** Pedidos realizados por clientes.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `customer_id` | UUID | FK → users(id), NOT NULL | Cliente que realizó pedido |
| `total_pairs` | INTEGER | NOT NULL | Cantidad total de pares en el pedido |
| `state` | order_status | DEFAULT 'pendiente', NOT NULL | Estado del pedido |
| `delivery_date` | TIMESTAMP+TZ | | Fecha de entrega programada |
| `creation_date` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación del pedido |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣6️⃣ order_details
**Descripción:** Líneas detalladas de cada pedido.

Especifica cada combinación de producto/talla/color en un pedido.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `order_id` | UUID | FK → orders(id), NOT NULL | Pedido al que pertenece |
| `product_id` | UUID | FK → products(id), NOT NULL | Producto ordenado |
| `size` | VARCHAR(50) | NOT NULL | Talla del producto |
| `colour` | VARCHAR(100) | | Color del producto |
| `amount` | INTEGER | NOT NULL | Cantidad de pares |
| `state` | order_status | DEFAULT 'pendiente', NOT NULL | Estado de la línea |
| `order_date` | TIMESTAMP+TZ | NOT NULL | Fecha del pedido |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣7️⃣ vale
**Descripción:** Comprobante o vale de entrega de productos.

Registra información de talla, color y cantidad entregada.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `size` | VARCHAR(50) | | Talla entregada |
| `colour` | VARCHAR(100) | | Color entregado |
| `amount` | NUMERIC(10,2) | | Cantidad entregada |
| `creation_date` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣8️⃣ detail_vale
**Descripción:** Detalles específicos de cada vale.

Relaciona el vale con tarea, producto y usuario involucrados.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `task_id` | UUID | FK → tasks(id), NOT NULL | Tarea asociada |
| `product_id` | UUID | FK → products(id), NOT NULL | Producto entregado |
| `user_id` | UUID | FK → users(id), NOT NULL | Usuario que recibió/entregó |
| `vale_id` | UUID | FK → vale(id), NOT NULL | Vale base |
| `size` | VARCHAR(50) | | Talla entregada |
| `colour` | VARCHAR(100) | | Color entregado |
| `amount` | NUMERIC(10,2) | | Cantidad entregada |
| `creation_date` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

### 1️⃣9️⃣ incidence
**Descripción:** Registro de incidencias o problemas en tareas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| `id` | UUID | PK | Identificador único |
| `task_id` | UUID | FK → tasks(id), NOT NULL | Tarea con problema |
| `type` | VARCHAR(100) | NOT NULL | Tipo de incidencia |
| `description` | TEXT | | Descripción del problema |
| `state` | incidence_status | DEFAULT 'abierta', NOT NULL | Estado de la incidencia |
| `report_date` | TIMESTAMP+TZ | NOT NULL | Fecha de reporte |
| `created_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| `deleted_at` | TIMESTAMP+TZ | | Soft delete |

---

## 🔗 Relaciones

### Diagrama de Relaciones

```
roles
  1 ├─────────────────────┐
    │ (1:N)               │
    └────→ users 1        │
           (N:1)           │
           ├─→ type_document
           ├─→ roles (self: validated_by)
           │
           ├── password_reset_tokens (1:N)
           ├── notifications (1:N) ✅
           │
           ├── supplies_movement (1:N)
           ├── inventory_movement (1:N)
           │
           └── orders (N:1 customer_id)
                └─ order_details (1:N)
                     ├─ products (N:1)
                     │   ├─ categories (N:1)
                     │   ├─ brands (N:1)
                     │   └─ styles (N:1 → brands)
                     │
                     └── inventory (N:1 product_id)

supplies (1:N) → supplies_movement
products (1:N) → inventory
products (1:N) → inventory_movement
products (1:N) → order_details

tasks (1:N) → incidence
tasks (1:N) → detail_vale
```

### Claves Foráneas

| Tabla | Columna | Referencia | Acción |
|-------|---------|-----------|--------|
| users | role_id | roles(id) | — |
| users | identity_document_type_id | type_document(id) | — |
| users | validated_by | users(id) | — |
| password_reset_tokens | user_id | users(id) | ON DELETE CASCADE |
| notifications | user_id | users(id) | ON DELETE CASCADE |
| supplies_movement | supplies_id | supplies(id) | — |
| supplies_movement | user_id | users(id) | — |
| styles | brand_id | brands(id) | — |
| products | category_id | categories(id) | — |
| products | brand_id | brands(id) | — |
| products | style_id | styles(id) | — |
| inventory | product_id | products(id) | — |
| inventory_movement | product_id | products(id) | — |
| inventory_movement | user_id | users(id) | — |
| orders | customer_id | users(id) | — |
| order_details | order_id | orders(id) | — |
| order_details | product_id | products(id) | — |
| detail_vale | task_id | tasks(id) | — |
| detail_vale | product_id | products(id) | — |
| detail_vale | user_id | users(id) | — |
| detail_vale | vale_id | vale(id) | — |
| incidence | task_id | tasks(id) | — |

---

## 🔍 Índices

| Índice | Tabla | Columna(s) | Propósito |
|--------|-------|-----------|----------|
| `idx_users_email` | users | email | Búsquedas rápidas en login |
| `idx_password_reset_tokens_token` | password_reset_tokens | token | Búsquedas rápidas de tokens |
| `idx_notifications_user_id` | notifications | user_id | Búsquedas rápidas por usuario |
| `idx_notifications_is_read` | notifications | is_read | Filtrar notificaciones no leídas |

---

## 📋 Índice Alfabético

| Tabla | Desc. |
|-------|--------|
| [brands](#️⃣9️⃣-brands) | Marcas o fabricantes |
| [categories](#️⃣8️⃣-categories) | Categorías de productos |
| [detail_vale](#️⃣1️⃣8️⃣-detail_vale) | Detalles de vale de entrega |
| [incidence](#️⃣1️⃣9️⃣-incidence) | Incidencias/problemas reportados |
| [inventory](#️⃣1️⃣2️⃣-inventory) | Inventario de productos en bodega |
| [inventory_movement](#️⃣1️⃣3️⃣-inventory_movement) | Movimientos de inventario |
| [notifications](#️⃣5️⃣-notifications) | Notificaciones a usuarios |
| [order_details](#️⃣1️⃣6️⃣-order_details) | Líneas detalladas de pedidos |
| [orders](#️⃣1️⃣5️⃣-orders) | Pedidos de clientes |
| [password_reset_tokens](#️⃣4️⃣-password_reset_tokens) | Tokens de recuperación |
| [products](#️⃣1️⃣1️⃣-products) | Catálogo de productos |
| [styles](#️⃣🔟-styles) | Estilos/modelos de marca |
| [roles](#️⃣1️⃣-roles) | Roles del sistema |
| [supplies](#️⃣6️⃣-supplies) | Insumos/materiales |
| [supplies_movement](#️⃣7️⃣-supplies_movement) | Movimientos de insumos |
| [tasks](#️⃣1️⃣4️⃣-tasks) | Tareas asignadas |
| [type_document](#️⃣2️⃣-type_document) | Tipos de documentos |
| [users](#️⃣3️⃣-users) | Usuarios del sistema |
| [vale](#️⃣1️⃣7️⃣-vale) | Comprobante de entrega |

---

**Documentación actualizada:** 5 de marzo de 2026  
**Base de datos:** CALZADO J&R — Sistema de Gestión y Producción de Calzado
