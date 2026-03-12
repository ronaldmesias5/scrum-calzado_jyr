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
);

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
);

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
    identity_document_type_id UUID REFERENCES type_document(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
    business_name VARCHAR(255),
    occupation occupation_type,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índice en email para búsquedas rápidas en login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
--   created_at (TIMESTAMP): Fecha de creación del token
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice en token para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

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
--   created_at (TIMESTAMP): Fecha de registro
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

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
--   created_at (TIMESTAMP): Fecha de registro del movimiento
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS supplies_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplies_id UUID NOT NULL REFERENCES supplies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type_of_movement supplies_movement_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    colour VARCHAR(100),
    size VARCHAR(50),
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: categories
-- Categorías de productos (zapatos, botas, sandalias, botines, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: brands
-- Marcas o fabricantes (Nike, Adidas, Puma, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: references
-- Referencias o estilos específicos de producto
-- ============================================================
CREATE TABLE IF NOT EXISTS "references" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: products
-- Catálogo de productos finales (combinación de categoría, marca, referencia)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID NOT NULL REFERENCES brands(id),
    reference_id UUID NOT NULL REFERENCES "references"(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    state BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: inventory
-- Inventario de productos en bodega (cantidad, tallas, colores)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    size VARCHAR(50) NOT NULL,
    colour VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: inventory_movement
-- Registro de movimientos de inventario (entradas, salidas, ajustes)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type_of_movement inventory_movement_type NOT NULL,
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(255),
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: tasks
-- Tareas asignadas a empleados (corte, guarnición, soladura, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    priority task_priority NOT NULL,
    type task_type NOT NULL,
    status task_status DEFAULT 'pendiente' NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: orders
-- Pedidos realizados por clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id),
    total_pairs INTEGER NOT NULL,
    state order_status DEFAULT 'pendiente' NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: order_details
-- Líneas detalladas de cada pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS order_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    size VARCHAR(50) NOT NULL,
    colour VARCHAR(100),
    amount INTEGER NOT NULL,
    state order_status DEFAULT 'pendiente' NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: vale
-- Comprobante o vale de entrega de productos
-- ============================================================
CREATE TABLE IF NOT EXISTS vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: detail_vale
-- Detalles específicos de cada vale
-- ============================================================
CREATE TABLE IF NOT EXISTS detail_vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    vale_id UUID NOT NULL REFERENCES vale(id),
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: incidence
-- Registro de incidencias o problemas en tareas
-- ============================================================
CREATE TABLE IF NOT EXISTS incidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    type VARCHAR(100) NOT NULL,
    description TEXT,
    state incidence_status DEFAULT 'abierta' NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: vale
-- Descripción: Comprobante o vale de entrega.
-- Registra información de talla, color y cantidad entregada.
-- ============================================================
CREATE TABLE IF NOT EXISTS vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: detail_vale
-- Descripción: Detalles específicos de cada vale.
-- Relaciona el vale con la tarea, producto y usuario involucrados.
-- ============================================================
CREATE TABLE IF NOT EXISTS detail_vale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    vale_id UUID NOT NULL REFERENCES vale(id),
    size VARCHAR(50),
    colour VARCHAR(100),
    amount NUMERIC(10, 2),
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

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
--   created_at (TIMESTAMP): Fecha de creación
--   updated_at (TIMESTAMP): Última actualización
--   deleted_at (TIMESTAMP): Soft delete para auditoría
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Índice para filtrar notificaciones no leídas
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- TABLA: incidence
-- Descripción: Registro de incidencias o problemas ocurridos
-- durante la ejecución de una tarea en la fábrica.
-- ============================================================
CREATE TABLE IF NOT EXISTS incidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    type VARCHAR(100) NOT NULL,
    description TEXT,
    state incidence_status DEFAULT 'abierta' NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDAS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_supplies_movement_supplies_id ON supplies_movement(supplies_id);
CREATE INDEX IF NOT EXISTS idx_supplies_movement_user_id ON supplies_movement(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_product_id ON inventory_movement(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_user_id ON inventory_movement(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_incidence_task_id ON incidence(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_state ON notifications(state);
