# 📊 Diccionario de Datos - CALZADO J&R
## Sistema de Gestión y Producción de Calzado

**Base de Datos:** PostgreSQL 17-alpine  
**Estado:** ✅ 100% Sincronizada y Funcional  
**Total Tablas:** 19 Operacionales  

---


## 📑 19 Tablas Operacionales

### Tabla 1️⃣: ROLES
**Propósito:** Roles del sistema (admin, jefe, operario, cliente)  
**Registros:** 3 | **Relaciones:** 1:N a users

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| **id** | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del rol |
| description | VARCHAR(255) | | Descripción |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

---

### Tabla 2️⃣: TYPE_DOCUMENT  
**Propósito:** Tipos de documento de identidad  
**Registros:** 8 | **Relaciones:** 1:N a users

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-----------|
| **id** | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Tipo de documento |
| created_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Fecha creación |
| updated_at | TIMESTAMP+TZ | DEFAULT NOW(), NOT NULL | Última actualización |
| deleted_at | TIMESTAMP+TZ | | Soft delete |

---

### Tabla 3️⃣: USERS (Core)
**Propósito:** Usuarios del sistema  
**Registros:** 13 | **Relaciones:** 7 FKs (4 auditoría + 3 datos)

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| email | VARCHAR(255) | - | UNIQUE, email único |
| hashed_password | VARCHAR(255) | - | Contraseña bcrypt |
| name, last_name | VARCHAR(255) | - | Nombre completo |
| phone | VARCHAR(20) | - | Teléfono contacto |
| identity_document | VARCHAR(20) | - | Número documento |
| **identity_document_type_id** | UUID | → type_document(id) | FK: Tipo documento |
| **role_id** | UUID | → roles(id) | FK: Rol usuario |
| is_active | BOOLEAN | - | Cuenta activa/inactiva |
| is_validated | BOOLEAN | - | Aprobada por admin |
| must_change_password | BOOLEAN | - | Fuerza cambio |
| business_name | VARCHAR(255) | - | Razón social (clientes) |
| occupation | occupation_type | - | Ocupación (empleados) |
| **validated_by** | UUID | → users(id) | FK: Admin validador |
| validated_at | TIMESTAMP+TZ | - | Fecha validación |
| **created_by** | UUID | → users(id) | FK: Auditoría creador |
| **updated_by** | UUID | → users(id) | FK: Auditoría actualizador |
| **deleted_by** | UUID | → users(id) | FK: Auditoría eliminador |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps auditoría |

---

### Tabla 4️⃣: PASSWORD_RESET_TOKENS
**Propósito:** Tokens de recuperación de contraseña  
**Registros:** 5-10 | **Relaciones:** N:1 a users

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **user_id** | UUID | → users(id) | FK: Usuario propietario |
| token | VARCHAR(255) | - | UNIQUE, token único |
| expires_at | TIMESTAMP+TZ | - | Expiración (60min) |
| used | BOOLEAN | - | Si fue utilizado |
| created_at | TIMESTAMP+TZ | - | Fecha creación |

---

### Tabla 5️⃣: CATEGORIES
**Propósito:** Categorías de productos  
**Registros:** 3 | **Relaciones:** 1:N a products, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| name | VARCHAR(255) | - | Nombre (Deportivo, Casual, Formal) |
| description | TEXT | - | Descripción |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 6️⃣: BRANDS
**Propósito:** Marcas de calzado  
**Registros:** 5 | **Relaciones:** 1:N a products, styles, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| name | VARCHAR(255) | - | Nombre (Nike, Adidas, etc) |
| description | TEXT | - | Descripción |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 7️⃣: STYLES
**Propósito:** Estilos/modelos dentro de marcas  
**Registros:** 23 | **Relaciones:** N:1 brands, 1:N products, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **brand_id** | UUID | → brands(id) | FK: Marca |
| name | VARCHAR(255) | - | Nombre estilo |
| description | TEXT | - | Descripción |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 8️⃣: PRODUCTS
**Propósito:** Catálogo de productos  
**Registros:** 68 | **Relaciones:** N:1 categories, brands, styles; 1:N inventory, order_details, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **category_id** | UUID | → categories(id) | FK: Categoría |
| **brand_id** | UUID | → brands(id) | FK: Marca |
| **style_id** | UUID | → styles(id) | FK: Estilo |
| name | VARCHAR(255) | - | Nombre producto |
| description | TEXT | - | Descripción |
| state | BOOLEAN | - | Activo/Inactivo |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 9️⃣: INVENTORY
**Propósito:** Stock de productos por talla/color  
**Registros:** Variable | **Relaciones:** N:1 products, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **product_id** | UUID | → products(id) | FK: Producto |
| size | VARCHAR(50) | - | Talla (30-47) |
| colour | VARCHAR(100) | - | Color |
| amount | NUMERIC(10,2) | - | Cantidad disponible |
| minimum_stock | INTEGER | - | Stock mínimo |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 🔟: ORDERS
**Propósito:** Órdenes/pedidos mayoristas  
**Registros:** 8 | **Relaciones:** N:1 users (customer), 1:N order_details, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **customer_id** | UUID | → users(id) | FK: Cliente que ordenó |
| total_pairs | INTEGER | - | Total pares |
| state | order_status | - | Enum: pendiente/progreso/completado |
| delivery_date | TIMESTAMP+TZ | - | Fecha entrega |
| creation_date | TIMESTAMP+TZ | - | Fecha orden |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣1️⃣: ORDER_DETAILS
**Propósito:** Líneas de detalle de órdenes  
**Registros:** 86 | **Relaciones:** N:1 orders, products, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **order_id** | UUID | → orders(id) | FK: Orden |
| **product_id** | UUID | → products(id) | FK: Producto |
| size | VARCHAR(50) | - | Talla |
| colour | VARCHAR(100) | - | Color |
| amount | INTEGER | - | Cantidad pares |
| state | order_status | - | Estado línea |
| order_date | TIMESTAMP+TZ | - | Fecha orden |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣2️⃣: NOTIFICATIONS
**Propósito:** Sistema de notificaciones  
**Registros:** Variable | **Relaciones:** N:1 users, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **user_id** | UUID | → users(id) | FK: Usuario destinatario |
| title | VARCHAR(255) | - | Título |
| message | TEXT | - | Contenido |
| type | notification_type | - | Enum: info/advertencia/error/éxito |
| is_read | BOOLEAN | - | Leída/No leída |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣3️⃣: SUPPLIES
**Propósito:** Insumos/materias primas  
**Registros:** Variable | **Relaciones:** 1:N supplies_movement, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| name | VARCHAR(255) | - | Nombre (cuero, hilo, suela, cierre) |
| description | TEXT | - | Especificaciones |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣4️⃣: SUPPLIES_MOVEMENT
**Propósito:** Histórico de movimientos de insumos  
**Registros:** Variable | **Relaciones:** N:1 supplies, users, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **supplies_id** | UUID | → supplies(id) | FK: Insumo |
| **user_id** | UUID | → users(id) | FK: Usuario operador |
| type_of_movement | supplies_movement_type | - | Enum: entrada/salida |
| amount | NUMERIC(10,2) | - | Cantidad |
| colour | VARCHAR(100) | - | Color |
| size | VARCHAR(50) | - | Talla |
| movement_date | TIMESTAMP+TZ | - | Fecha/hora |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣5️⃣: INVENTORY_MOVEMENT
**Propósito:** Histórico de movimientos de productos  
**Registros:** Variable | **Relaciones:** N:1 products, users, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **product_id** | UUID | → products(id) | FK: Producto |
| **user_id** | UUID | → users(id) | FK: Usuario |
| type_of_movement | inventory_movement_type | - | Enum: entrada/salida/ajuste |
| size | VARCHAR(50) | - | Talla |
| colour | VARCHAR(100) | - | Color |
| amount | NUMERIC(10,2) | - | Cantidad |
| reason | VARCHAR(255) | - | Motivo |
| movement_date | TIMESTAMP+TZ | - | Fecha/hora |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣6️⃣: TASKS
**Propósito:** Tareas de producción  
**Registros:** Variable | **Relaciones:** 1:N incidence, detail_vale, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| description | TEXT | - | Descripción tarea |
| priority | task_priority | - | Enum: baja/media/alta |
| type | task_type | - | Enum: corte/guarnicion/soladura/emplantillado |
| status | task_status | - | Enum: pendiente/progreso/completado/cancelado |
| deadline | TIMESTAMP+TZ | - | Fecha límite |
| assignment_date | TIMESTAMP+TZ | - | Fecha asignación |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣7️⃣: INCIDENCE
**Propósito:** Reportes de incidencias en producción  
**Registros:** Variable | **Relaciones:** N:1 tasks, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **task_id** | UUID | → tasks(id) | FK: Tarea |
| type | VARCHAR(100) | - | Tipo incidencia |
| description | TEXT | - | Descripción |
| state | incidence_status | - | Enum: abierta/progreso/resuelta/cerrada |
| report_date | TIMESTAMP+TZ | - | Fecha reporte |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣8️⃣: VALE
**Propósito:** Vale de entrega de producción  
**Registros:** Variable | **Relaciones:** 1:N detail_vale, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| size | VARCHAR(50) | - | Talla entregada |
| colour | VARCHAR(100) | - | Color entregado |
| amount | NUMERIC(10,2) | - | Cantidad |
| creation_date | TIMESTAMP+TZ | - | Fecha emisión |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

### Tabla 1️⃣9️⃣: DETAIL_VALE
**Propósito:** Detalles del vale  
**Registros:** Variable | **Relaciones:** N:1 tasks, products, users, vale, Auditoría

| Campo | Tipo | FK Destino | Descripción |
|-------|------|-----------|-----------|
| **id** | UUID | - | PK |
| **task_id** | UUID | → tasks(id) | FK: Tarea |
| **product_id** | UUID | → products(id) | FK: Producto |
| **user_id** | UUID | → users(id) | FK: Usuario |
| **vale_id** | UUID | → vale(id) | FK: Vale padre |
| size | VARCHAR(50) | - | Talla |
| colour | VARCHAR(100) | - | Color |
| amount | NUMERIC(10,2) | - | Cantidad |
| creation_date | TIMESTAMP+TZ | - | Fecha |
| **created_by** | UUID | → users(id) | FK: Auditoría |
| **updated_by** | UUID | → users(id) | FK: Auditoría |
| **deleted_by** | UUID | → users(id) | FK: Auditoría |
| created_at, updated_at, deleted_at | TIMESTAMP+TZ | - | Timestamps |

---

```
USERS (7 FKs):
├── role_id → roles
├── identity_document_type_id → type_document
├── validated_by → users (self-reference)
├── created_by → users (audit)
├── updated_by → users (audit)
└── deleted_by → users (audit)

PRODUCTS (6 FKs): category_id, brand_id, style_id, created_by, updated_by, deleted_by
STYLES (4 FKs): brand_id, created_by, updated_by, deleted_by
INVENTORY (4 FKs): product_id, created_by, updated_by, deleted_by
ORDERS (4 FKs): customer_id, created_by, updated_by, deleted_by
ORDER_DETAILS (5 FKs): order_id, product_id, created_by, updated_by, deleted_by
NOTIFICATIONS (4 FKs): user_id, created_by, updated_by, deleted_by
SUPPLIES_MOVEMENT (5 FKs): supplies_id, user_id, created_by, updated_by, deleted_by
INVENTORY_MOVEMENT (5 FKs): product_id, user_id, created_by, updated_by, deleted_by
TASKS (3 FKs): created_by, updated_by, deleted_by
INCIDENCE (4 FKs): task_id, created_by, updated_by, deleted_by
DETAIL_VALE (8 FKs): task_id, product_id, user_id, vale_id, created_by, updated_by, deleted_by (+1 más)
... (resto de tablas con audit)

TOTAL: 52 FKs
```

---
