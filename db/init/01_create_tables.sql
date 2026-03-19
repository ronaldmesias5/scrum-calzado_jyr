-- ============================================================
-- CALZADO J&R — Script de inicialización de la base de datos
-- ============================================================
-- Archivo: db/init/01_create_tables.sql
-- Descripción: DDL para crear TODAS las tablas del sistema en PostgreSQL 17.
--
-- ¿Qué?
--   - Crea extensión uuid-ossp
--   - Define 10 ENUM types (occupation_type, order_status, task_status, etc.)
--   - Crea tablas: roles, type_document, users, password_reset_tokens
--   - Tablas futuras: orders, tasks, inventory, supplies, notifications, etc.
--   - Inserta 3 roles iniciales (admin, employee, client)
--
-- ¿Para qué?
--   - Inicializar BD desde cero en contenedor Docker
--   - Separar DDL del código Python (ORM refleja, no crea)
--   - Ejecutar automáticamente con volumen /docker-entrypoint-initdb.d
--   - Garantizar tipos ENUM existen antes que tablas
--
-- ¿Impacto?
--   CRÍTICO — Sin este script, contenedor Postgres queda completamente vacío.
--   Modificar nombres de tablas/columnas rompe: TODOS los modelos ORM.
--   Cambiar ENUM values requiere: migration Alembic + actualización en models.py
--   Dependencias: docker-compose.yml (volumen db/init), models/*.py (ORM)
--
-- EJECUCIÓN:
--   Docker ejecuta scripts en /docker-entrypoint-initdb.d en orden alfabético.
--   01_create_tables.sql → 02_triggers_and_indexes.sql → 99_seed_type_documents.sql
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TIPOS ENUMERADOS (ENUM TYPES)
-- ============================================================
-- Los siguientes tipos ENUM definen conjuntos predefinidos de valores
-- que se utilizan en columnas de tablas para asegurar integridad de datos
-- y restringir valores solo a opciones válidas del negocio.

-- Tipo ENUM para las ocupaciones de empleados
-- Valores permitidos:
--   - 'jefe': Encargado de orquestar tareas, validar cuentas y gestionar la producción
--   - 'cortador': Encargado de cortar materiales
--   - 'guarnecedor': Encargado de elaborar guarniciones
--   - 'solador': Encargado de preparar suelas y bases
--   - 'emplantillador': Encargado de emplantar/armar calzado
CREATE TYPE occupation_type AS ENUM ('jefe', 'cortador', 'guarnecedor', 'solador', 'emplantillador');

-- Tipo ENUM para el estado de los movimientos de insumos
-- Valores: 'entrada' (ingreso al inventario) o 'salida' (egreso del inventario)
CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida');

-- Tipo ENUM para el estado de los movimientos de inventario
-- Valores: 'entrada', 'salida', 'ajuste'
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste');

-- Tipo ENUM para el estado de los pedidos
-- Valores: 'pendiente', 'en_progreso', 'completado', 'cancelado'
CREATE TYPE order_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- Tipo ENUM para el estado de las tareas
-- Valores: 'pendiente', 'en_progreso', 'completado', 'cancelado'
CREATE TYPE task_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- Tipo ENUM para la prioridad de las tareas
-- Valores: 'baja', 'media', 'alta'
CREATE TYPE task_priority AS ENUM ('baja', 'media', 'alta');

-- Tipo ENUM para el tipo de tarea (ocupación)
-- Valores: 'corte', 'guarnicion', 'soladura', 'emplantillado'
CREATE TYPE task_type AS ENUM ('corte', 'guarnicion', 'soladura', 'emplantillado');

-- Tipo ENUM para el estado de las incidencias
-- Valores: 'abierta', 'en_progreso', 'resuelta', 'cerrada'
CREATE TYPE incidence_status AS ENUM ('abierta', 'en_progreso', 'resuelta', 'cerrada');

-- Tipo ENUM para el tipo de notificación
-- Valores: 'info', 'advertencia', 'error', 'éxito'
CREATE TYPE notification_type AS ENUM ('info', 'advertencia', 'error', 'exito');

-- ============================================================
-- TABLA: roles
-- DESCRIPCIÓN EN ESPAÑOL:
-- Tabla principal de roles del sistema. Define los tres roles fundamentales:
-- - Admin: Administrador del sistema con acceso completo a código y configuración
-- - Employee: Empleado de fábrica que puede tener diferentes ocupaciones
-- - Client: Cliente externo que realiza pedidos
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único
--   name (VARCHAR): Nombre único del rol
--   description (VARCHAR): Descripción del rol
--   created_at (TIMESTAMP): Fecha de creación
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
)
WITH (fillfactor = 90);

-- Insertar roles del sistema
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrador del sistema — acceso completo a código, configuración y datos'),
    ('employee', 'Empleado de la fábrica — gestión de tareas, producción y operaciones'),
    ('client', 'Cliente — gestión de pedidos, visualización de catálogo y seguimiento')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABLA: type_document
-- Tipos de documentos de identificación
-- ============================================================
CREATE TABLE IF NOT EXISTS type_document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
)
WITH (fillfactor = 90);

-- ============================================================
-- TABLA: users
-- DESCRIPCIÓN EN ESPAÑOL:
-- Tabla central de usuarios del sistema. Almacena información de
-- administradores, empleados y clientes. Incluye campos específicos
-- para diferentes tipos de usuario (ocupación para empleados,
-- nombre comercial para clientes).
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único del usuario
--   email (VARCHAR): Correo electrónico único
--   hashed_password (VARCHAR): Contraseña cifrada con bcrypt
--   name (VARCHAR): Nombres del usuario
--   last_name (VARCHAR): Apellidos del usuario
--   phone (VARCHAR): Teléfono de contacto
--   role_id (UUID): Referencia del rol (admin/employee/client)
--   is_active (BOOLEAN): Indica si la cuenta está activa
--   is_validated (BOOLEAN): Indica si la cuenta fue validada por admin
--   must_change_password (BOOLEAN): Fuerza cambio de contraseña en próximo login
--   business_name (VARCHAR): Nombre del comercio/empresa (solo clientes)
--   occupation (occupation_type): Ocupación laboral (solo empleados)
--   validated_by (UUID): ID del admin que validó la cuenta
--   validated_at (TIMESTAMP): Fecha de validación de la cuenta
--   created_by (UUID): Usuario que creó este registro (auditoría)
--   updated_by (UUID): Usuario que actualizó este registro (auditoría)
--   deleted_by (UUID): Usuario que marcó como deletado (auditoría)
--   created_at (TIMESTAMP): Fecha de creación del usuario
--   updated_at (TIMESTAMP): Última actualización de datos
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    identity_document VARCHAR(20),
    identity_document_type_id UUID,
    role_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
    business_name VARCHAR(255),
    occupation occupation_type,
    validated_by UUID,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_users_identity_document_type FOREIGN KEY (identity_document_type_id) REFERENCES type_document(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_users_validated_by FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Índices para búsquedas y auditoría
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- ============================================================
-- TABLA: password_reset_tokens
-- DESCRIPCIÓN EN ESPAÑOL:
-- Tokens de recuperación de contraseña. Almacena códigos temporales
-- generados cuando un usuario solicita resetear su contraseña.
-- Los tokens tienen una fecha de expiración y se marcan como utilizados
-- una vez que se ha completado el reseteo.
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único del token
--   user_id (UUID): Referencia del usuario propietario del token
--   token (VARCHAR): Token único generado para el reseteo
--   expires_at (TIMESTAMP): Fecha y hora de expiración del token
--   used (BOOLEAN): Indica si el token ya fue utilizado
--   created_by (UUID): Usuario que creó este token (auditoría)
--   created_at (TIMESTAMP): Fecha de creación del token
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_password_reset_tokens_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
)
WITH (fillfactor = 90);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================
-- TABLA: supplies
-- DESCRIPCIÓN EN ESPAÑOL:
-- Registro centralizado de insumos (materiales) utilizados en la 
-- fabricación de calzado. Incluye cueros, telas, pegamentos, 
-- herrajes, plantillas y todos los componentes necesarios.
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único del insumo
--   name (VARCHAR): Nombre descriptivo del insumo
--   description (TEXT): Descripción detallada y especificaciones
--   created_by (UUID): Usuario que creó este registro (auditoría)
--   updated_by (UUID): Usuario que actualizó este registro (auditoría)
--   deleted_by (UUID): Usuario que marcó como deletado (auditoría)
--   created_at (TIMESTAMP): Fecha de registro
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_supplies_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_supplies_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_supplies_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_supplies_created_by ON supplies(created_by);
CREATE INDEX IF NOT EXISTS idx_supplies_deleted_at ON supplies(deleted_at);

-- ============================================================
-- TABLA: supplies_movement
-- DESCRIPCIÓN EN ESPAÑOL:
-- Registro de movimientos de insumos (entradas y salidas del 
-- inventario). Cada registro representa una transacción de materiales.
-- Controla el flujo de insumos desde compra hasta su uso en producción.
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único del movimiento
--   supplies_id (UUID): Referencia del insumo movido
--   user_id (UUID): ID del usuario que realizó el movimiento
--   type_of_movement (supplies_movement_type): 'entrada' o 'salida'
--   amount (NUMERIC): Cantidad del insumo movido
--   colour (VARCHAR): Color del insumo (cuando aplique)
--   size (VARCHAR): Talla o tamaño del insumo
--   movement_date (TIMESTAMP): Fecha y hora del movimiento
--   created_by (UUID): Usuario que creó este registro (auditoría)
--   updated_by (UUID): Usuario que actualizó este registro (auditoría)
--   created_at (TIMESTAMP): Fecha de registro del movimiento
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS supplies_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplies_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type_of_movement supplies_movement_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    colour VARCHAR(100),
    size VARCHAR(50),
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_supplies_movement_supplies FOREIGN KEY (supplies_id) REFERENCES supplies(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_supplies_movement_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_supplies_movement_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_supplies_movement_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_supplies_movement_supplies_id ON supplies_movement(supplies_id);
CREATE INDEX IF NOT EXISTS idx_supplies_movement_user_id ON supplies_movement(user_id);
CREATE INDEX IF NOT EXISTS idx_supplies_movement_movement_date ON supplies_movement(movement_date);

-- ============================================================
-- TABLA: categories
-- Categorías de productos (zapatos, botas, sandalias, botines, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_categories_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);

-- ============================================================
-- TABLA: brands
-- Marcas o fabricantes (Nike, Adidas, Puma, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_brands_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_brands_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_brands_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);

-- ============================================================
-- TABLA: styles
-- Estilos/modelos específicos de producto
-- ============================================================
CREATE TABLE IF NOT EXISTS styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_styles_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_styles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_styles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_styles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_styles_brand_id ON styles(brand_id);
CREATE INDEX IF NOT EXISTS idx_styles_created_by ON styles(created_by);

-- ============================================================
-- TABLA: products
-- Catálogo de productos finales (combinación de categoría, marca, estilo)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL,
    brand_id UUID NOT NULL,
    style_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500),
    insufficient_threshold INTEGER DEFAULT 10,
    state BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_style FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_products_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_style_id ON products(style_id);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);

-- ============================================================
-- TABLA: inventory_movement
-- Registro de movimientos de inventario (entradas, salidas, ajustes)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type_of_movement inventory_movement_type NOT NULL,
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(255),
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_inventory_movement_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movement_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movement_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movement_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_inventory_movement_product_id ON inventory_movement(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_user_id ON inventory_movement(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_movement_date ON inventory_movement(movement_date);

-- ============================================================
-- TABLA: inventory
-- Inventario de productos en bodega (cantidad, tallas, colores)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    size VARCHAR(50) NOT NULL,
    colour VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_size_colour ON inventory(product_id, size, colour);

-- ============================================================
-- TABLA: tasks
-- Tareas asignadas a empleados (corte, guarnición, soladura, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID NOT NULL,
    description TEXT NOT NULL,
    priority task_priority NOT NULL,
    type task_type NOT NULL,
    status task_status DEFAULT 'pendiente' NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- ============================================================
-- TABLA: orders
-- Pedidos realizados por clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    total_pairs INTEGER NOT NULL,
    state order_status DEFAULT 'pendiente' NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_orders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_orders_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- ============================================================
-- TABLA: order_details
-- Líneas detalladas de cada pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS order_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    size VARCHAR(50) NOT NULL,
    colour VARCHAR(100),
    amount INTEGER NOT NULL,
    state order_status DEFAULT 'pendiente' NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
CREATE INDEX IF NOT EXISTS idx_order_details_state ON order_details(state);

-- ============================================================
-- TABLA: vale
-- Comprobante o vale de entrega de productos
-- ============================================================
CREATE TABLE IF NOT EXISTS vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_vale_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vale_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vale_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_vale_order_id ON vale(order_id);
CREATE INDEX IF NOT EXISTS idx_vale_created_by ON vale(created_by);

-- ============================================================
-- TABLA: detail_vale
-- Detalles específicos de cada vale
-- ============================================================
CREATE TABLE IF NOT EXISTS detail_vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    product_id UUID NOT NULL,
    user_id UUID NOT NULL,
    vale_id UUID NOT NULL,
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_detail_vale_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_vale FOREIGN KEY (vale_id) REFERENCES vale(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_detail_vale_vale_id ON detail_vale(vale_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_task_id ON detail_vale(task_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_product_id ON detail_vale(product_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_user_id ON detail_vale(user_id);

-- ============================================================
-- TABLA: incidence
-- Registro de incidencias o problemas en tareas
-- ============================================================
CREATE TABLE IF NOT EXISTS incidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    state incidence_status DEFAULT 'abierta' NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_incidence_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_incidence_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_incidence_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_incidence_task_id ON incidence(task_id);
CREATE INDEX IF NOT EXISTS idx_incidence_state ON incidence(state);
CREATE INDEX IF NOT EXISTS idx_incidence_created_by ON incidence(created_by);



-- ============================================================
-- TABLA: notifications
-- DESCRIPCIÓN EN ESPAÑOL:
-- Registro de notificaciones del sistema dirigidas a usuarios.
-- Almacena mensajes sobre eventos importantes (pedidos, tareas,
-- validaciones, etc.). Cada usuario tiene su panel de notificaciones
-- que aparece en tiempo real.
-- 
-- ATRIBUTOS:
--   id (UUID): Identificador único de la notificación
--   user_id (UUID): Usuario destinatario de la notificación
--   title (VARCHAR): Título breve de la notificación
--   message (TEXT): Contenido detallado del mensaje
--   type (notification_type): Tipo (info, advertencia, error, exito)
--   is_read (BOOLEAN): Indica si ha sido leída
--   created_by (UUID): Usuario que creó la notificación (auditoría)
--   created_at (TIMESTAMP): Fecha de creación
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
) WITH (fillfactor = 90);

-- Índices para búsquedas rápidas y auditoría
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);
