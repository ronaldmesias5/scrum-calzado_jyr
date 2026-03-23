-- ============================================================
-- CALZADO J&R — Script de inicialización de la base de datos (VERSIÓN CORREGIDA)
-- ============================================================
-- Archivo: db/init/01_create_tables_fix.sql
-- Descripción: DDL corregida - Sin palabras reservadas y con todas las FK

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TIPOS ENUMERADOS (ENUM TYPES)
-- ============================================================
CREATE TYPE occupation_type AS ENUM ('jefe', 'cortador', 'guarnecedor', 'solador', 'emplantillador');
CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida');
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');
CREATE TYPE task_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');
CREATE TYPE task_priority AS ENUM ('baja', 'media', 'alta');
CREATE TYPE task_type AS ENUM ('corte', 'guarnicion', 'soladura', 'emplantillado');
CREATE TYPE incidence_status AS ENUM ('abierta', 'en_progreso', 'resuelta', 'cerrada');
CREATE TYPE notification_type AS ENUM ('info', 'advertencia', 'error', 'exito');

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_role VARCHAR(50) UNIQUE NOT NULL,
    description_role VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
) WITH (fillfactor = 90);

INSERT INTO roles (name_role, description_role) VALUES
    ('admin', 'Administrador del sistema — acceso completo a código, configuración y datos'),
    ('employee', 'Empleado de la fábrica — gestión de tareas, producción y operaciones'),
    ('client', 'Cliente — gestión de pedidos, visualización de catálogo y seguimiento')
ON CONFLICT (name_role) DO NOTHING;

-- ============================================================
-- TABLA: type_document
-- ============================================================
-- Nota: Los valores iniciales se populan en 99_seed_type_documents.sql
--       que se ejecuta al final del proceso de inicialización.
CREATE TABLE IF NOT EXISTS type_document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_type_document VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
) WITH (fillfactor = 90);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name_user VARCHAR(255) NOT NULL,
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
    session_version INTEGER DEFAULT 1,
    accepted_terms BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- ============================================================
-- TABLA: password_reset_tokens
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
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================
-- TABLA: supplies
-- ============================================================
CREATE TABLE IF NOT EXISTS supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_supplies VARCHAR(255) NOT NULL,
    description_supplies TEXT,
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
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_category VARCHAR(255) NOT NULL UNIQUE,
    description_category TEXT,
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

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name_category);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);

-- ============================================================
-- TABLA: brands
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_brand VARCHAR(255) NOT NULL UNIQUE,
    description_brand TEXT,
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

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name_brand);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);

-- ============================================================
-- TABLA: styles
-- ============================================================
CREATE TABLE IF NOT EXISTS styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL,
    name_style VARCHAR(255) NOT NULL,
    description_style TEXT,
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
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL,
    brand_id UUID NOT NULL,
    style_id UUID NOT NULL,
    name_product VARCHAR(255) NOT NULL,
    color VARCHAR(100),
    description_product TEXT,
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
-- ✅ CORRECCIÓN #4: Índice parcial para productos con stock por debajo del mínimo (alertas de reorden)
CREATE INDEX IF NOT EXISTS idx_inventory_minimum_stock ON inventory(minimum_stock) WHERE amount <= minimum_stock;

-- ============================================================
-- TABLA: tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID NOT NULL,
    description_task TEXT NOT NULL,
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
-- ✅ CORRECCIÓN #4: Índices para deadline (filtrar/ordenar tareas por fecha de vencimiento)
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_by_status_deadline ON tasks(status, deadline) WHERE deadline IS NOT NULL;

-- ============================================================
-- TABLA: orders
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
-- ✅ CORRECCIÓN #4: Índices para delivery_date (seguimiento de entregas, reportes por fecha)
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date) WHERE delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_by_state_delivery ON orders(state, delivery_date) WHERE delivery_date IS NOT NULL;

-- ============================================================
-- TABLA: order_details
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
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_details_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
CREATE INDEX IF NOT EXISTS idx_order_details_state ON order_details(state);

-- ============================================================
-- TABLA: vale
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
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_vale_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vale_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vale_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vale_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_vale_order_id ON vale(order_id);
CREATE INDEX IF NOT EXISTS idx_vale_created_by ON vale(created_by);
-- ✅ CORRECCIÓN #4: Índice para creation_date (reportes cronológicos de vales)
CREATE INDEX IF NOT EXISTS idx_vale_creation_date ON vale(creation_date DESC NULLS LAST);

-- ============================================================
-- TABLA: detail_vale
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
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_detail_vale_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_vale FOREIGN KEY (vale_id) REFERENCES vale(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_detail_vale_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_detail_vale_vale_id ON detail_vale(vale_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_task_id ON detail_vale(task_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_product_id ON detail_vale(product_id);
CREATE INDEX IF NOT EXISTS idx_detail_vale_user_id ON detail_vale(user_id);

-- ============================================================
-- TABLA: incidence
-- ============================================================
CREATE TABLE IF NOT EXISTS incidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    type_incidence VARCHAR(100) NOT NULL,
    description_incidence TEXT,
    state incidence_status DEFAULT 'abierta' NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_incidence_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_incidence_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_incidence_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_incidence_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_incidence_task_id ON incidence(task_id);
CREATE INDEX IF NOT EXISTS idx_incidence_state ON incidence(state);
CREATE INDEX IF NOT EXISTS idx_incidence_created_by ON incidence(created_by);
-- ✅ CORRECCIÓN #4: Índices para report_date (reportes cronológicos de incidencias)
CREATE INDEX IF NOT EXISTS idx_incidence_report_date ON incidence(report_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_incidence_by_state_date ON incidence(state, report_date DESC) WHERE state != 'cerrada';

-- ============================================================
-- TABLA: notifications
-- ============================================================
-- ✅ CORRECCIÓN #1: Normalización de constraints a sintaxis explícita (consistency)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title_notification VARCHAR(255) NOT NULL,
    message_notification TEXT NOT NULL,
    type_notification notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);
-- ✅ CORRECCIÓN #4: Índice para ordenar notificaciones por fecha (reportes, listados cronológicos)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC NULLS LAST);
