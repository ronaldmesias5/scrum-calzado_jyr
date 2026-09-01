-- ============================================================
-- SCRIPT 00: PREPARACION DEL ESCENARIO DE PRUEBAS
-- CALZADO J&R - SENA ADSO - Guia 6: Pruebas de Base de Datos
-- ============================================================
-- Descripcion: Inserta datos semilla para ejecutar los 20 casos
--              de prueba. Ejecutar ANTES de cualquier otro script.
-- Base de datos: PostgreSQL (Supabase local o produccion)
-- ============================================================

-- -----------------------------------------------------------
-- 1. ROLES (si no existen por seed)
-- -----------------------------------------------------------
INSERT INTO roles (id, name_role, description_role, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin', 'Administrador del sistema', NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'employee', 'Empleado de produccion', NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'client', 'Cliente externo', NOW())
ON CONFLICT (name_role) DO NOTHING;

-- -----------------------------------------------------------
-- 2. TIPOS DE DOCUMENTO
-- -----------------------------------------------------------
INSERT INTO type_document (id, name_type_document, created_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Cedula de Ciudadania', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'Cedula de Extranjeria', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'Pasaporte', NOW())
ON CONFLICT (name_type_document) DO NOTHING;

-- -----------------------------------------------------------
-- 3. USUARIOS DE PRUEBA
-- -----------------------------------------------------------
-- Password hasheado para 'Test123456!' (bcrypt)
-- NOTA: En produccion usar el hash real de la app

-- Admin (jefe)
INSERT INTO users (id, email, hashed_password, name_user, last_name, role_id, is_active, is_validated, occupation, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'ronald.jefe@gmail.com',
  '$2b$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR3z8yY1kF6mN2vC4bX7aD9fG0hI2j',
  'Ronald',
  'Jefe',
  'a0000000-0000-0000-0000-000000000001',
  true,
  true,
  'jefe',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Empleado (cortador)
INSERT INTO users (id, email, hashed_password, name_user, last_name, role_id, is_active, is_validated, occupation, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'empleado.test@gmail.com',
  '$2b$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR3z8yY1kF6mN2vC4bX7aD9fG0hI2j',
  'Carlos',
  'Cortador',
  'a0000000-0000-0000-0000-000000000002',
  true,
  true,
  'cortador',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Empleado (guarnecedor)
INSERT INTO users (id, email, hashed_password, name_user, last_name, role_id, is_active, is_validated, occupation, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'guarnecedor.test@gmail.com',
  '$2b$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR3z8yY1kF6mN2vC4bX7aD9fG0hI2j',
  'Maria',
  'Guarnecedora',
  'a0000000-0000-0000-0000-000000000002',
  true,
  true,
  'guarnecedor',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Cliente
INSERT INTO users (id, email, hashed_password, name_user, last_name, role_id, is_active, is_validated, business_name, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000004',
  'cliente.test@gmail.com',
  '$2b$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR3z8yY1kF6mN2vC4bX7aD9fG0hI2j',
  'Pedro',
  'Cliente',
  'a0000000-0000-0000-0000-000000000003',
  true,
  true,
  'Distribuidora XYZ',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Empleado con invitacion expirada (para prueba #5)
INSERT INTO users (id, email, hashed_password, name_user, last_name, role_id, is_active, is_validated, occupation, invitation_expires_at, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000005',
  'invitacion.expirada@test.com',
  '$2b$12$LJ3m4ys3Lz0wqV9rK5e5xuQpR3z8yY1kF6mN2vC4bX7aD9fG0hI2j',
  'Ana',
  'Expirada',
  'a0000000-0000-0000-0000-000000000002',
  false,
  false,
  'solador',
  NOW() - INTERVAL '48 hours',  -- Expirada hace 2 dias
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------
-- 4. CATEGORIAS
-- -----------------------------------------------------------
INSERT INTO categories (id, name_category, description_category, created_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Hombre', 'Calzado para hombre', NOW()),
  ('d0000000-0000-0000-0000-000000000002', 'Mujer', 'Calzado para mujer', NOW()),
  ('d0000000-0000-0000-0000-000000000003', 'Nino', 'Calzado para ninos', NOW())
ON CONFLICT (name_category) DO NOTHING;

-- -----------------------------------------------------------
-- 5. MARCAS
-- -----------------------------------------------------------
INSERT INTO brands (id, name_brand, description_brand, created_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'MarcaTest', 'Marca de prueba para el taller', NOW()),
  ('e0000000-0000-0000-0000-000000000002', 'MarcaConEstilos', 'Marca que tiene estilos vinculados', NOW())
ON CONFLICT (name_brand) DO NOTHING;

-- -----------------------------------------------------------
-- 6. ESTILOS
-- -----------------------------------------------------------
INSERT INTO styles (id, brand_id, name_style, description_style, created_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'EstiloDeportivo', 'Estilo deportivo unisex', NOW()),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'EstiloFormal', 'Estilo formal para dama', NOW())
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 7. PRODUCTOS
-- -----------------------------------------------------------
INSERT INTO products (id, style_id, brand_id, category_id, name_product, description_product, color, state, insufficient_threshold, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Tenis Running', 'Tenis para correr', 'Negro', true, 12, NOW()),
  ('10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Zapato Formal', 'Zapato de vestir', 'Cafe', true, 8, NOW())
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 8. INVENTARIO (con stock para pruebas)
-- -----------------------------------------------------------
INSERT INTO inventory (id, product_id, size, colour, amount, reserved, minimum_stock, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40', 'Negro', 50.00, 0.00, 5, NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '42', 'Negro', 30.00, 0.00, 5, NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '38', 'Cafe', 20.00, 0.00, 3, NOW())
ON CONFLICT (product_id, size, colour) DO NOTHING;

-- -----------------------------------------------------------
-- 9. CATEGORIAS DE INSUMOS
-- -----------------------------------------------------------
INSERT INTO supply_categories (id, name, global_stage, color, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Cuero', 'corte', 'amber', NOW()),
  ('30000000-0000-0000-0000-000000000002', 'Hilo', 'guarnicion', 'blue', NOW()),
  ('30000000-0000-0000-0000-000000000003', 'Suela', 'soladura', 'gray', NOW())
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------
-- 10. INSUMOS
-- -----------------------------------------------------------
INSERT INTO supplies (id, name_supplies, description_supplies, category, stock_quantity, unit, created_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'Cuero Sintetico', 'Cuero para parte superior', 'cuero', 100.00, 'metros', NOW()),
  ('40000000-0000-0000-0000-000000000002', 'Hilo Nylon', 'Hilo resistente para costura', 'hilo', 500.00, 'metros', NOW()),
  ('40000000-0000-0000-0000-000000000003', 'Suela Goma', 'Suela de goma vulcanizada', 'suela', 80.00, 'unidades', NOW())
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 11. RELACION PRODUCTO-INSUMOS
-- -----------------------------------------------------------
INSERT INTO product_supplies (id, product_id, supply_id, quantity_required, created_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 2.0000, NOW()),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 5.0000, NOW()),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 1.0000, NOW())
ON CONFLICT (product_id, supply_id) DO NOTHING;

-- -----------------------------------------------------------
-- 12. CODIGOS DE DEFECTO
-- -----------------------------------------------------------
INSERT INTO defect_codes (id, code, name, description, is_active, created_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', 'DEF-FAB', 'Defecto de Fabricacion', 'Error en proceso de fabricacion', true, NOW()),
  ('60000000-0000-0000-0000-000000000002', 'DEF-ALM', 'Defecto de Almacen', 'Dano en almacenamiento', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------
-- ESCENARIO LISTO - Ejecutar scripts 01 a 20 despues de este
-- ============================================================
