-- ================================================================
-- Script III: Seed de Marcas, Categorías, Estilos y Productos
-- ================================================================
-- Descripción: Inserta datos iniciales para el catálogo de calzado
-- Ejecución: Solo se ejecuta si las tablas están vacías (IF NOT EXISTS)

-- ─────────────────────────────────────────────────────────────────
-- MARCAS (5)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO brand (name, description, created_at, updated_at)
VALUES
  ('Nike', 'Marca estadounidense de calzado y ropa deportiva', NOW(), NOW()),
  ('Adidas', 'Líder global en ropa y calzado deportivo', NOW(), NOW()),
  ('Puma', 'Marca internacional de calzado deportivo y casual', NOW(), NOW()),
  ('New Balance', 'Fabricante de calzado deportivo y casual', NOW(), NOW()),
  ('Reebok', 'Marca de calzado deportivo y fitness', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- CATEGORÍAS (3)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO category (name, description, created_at, updated_at)
VALUES
  ('Dama', 'Zapatos para mujeres', NOW(), NOW()),
  ('Caballero', 'Zapatos para hombres', NOW(), NOW()),
  ('Infantil', 'Zapatos para niños', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- ESTILOS (22) - Referencias a marcas por nombre
-- ─────────────────────────────────────────────────────────────────
INSERT INTO style (name, description, brand_id, created_at, updated_at)
SELECT name, description, (SELECT id FROM brand WHERE brand.name = temp.brand_name LIMIT 1), NOW(), NOW()
FROM (VALUES
  ('Air Force One', 'Icónico zapato de Nike', 'Nike'),
  ('SB', 'Línea de skate de Nike', 'Nike'),
  ('Force One Bota', 'Air Force One en formato bota', 'Nike'),
  ('Air Jordan 1', 'Primer modelo de Air Jordan', 'Nike'),
  ('Air Jordan 11', 'Modelo emblemático Air Jordan', 'Nike'),
  ('Air Max', 'Tecnología Air Max de Nike', 'Nike'),
  ('Superstar', 'Clásico de Adidas', 'Adidas'),
  ('Forum', 'Diseño retro de Adidas', 'Adidas'),
  ('Ultraboost', 'Tecnología Boost de Adidas', 'Adidas'),
  ('Stan Smith', 'Icono del tenis de Adidas', 'Adidas'),
  ('Campus', 'Clásico vinilo de Adidas', 'Adidas'),
  ('Varial', 'Zapato de skate Adidas', 'Adidas'),
  ('Neo', 'Línea casual Neo de Adidas', 'Adidas'),
  ('California', 'Modelo clásico de Puma', 'Puma'),
  ('9060', 'Modelo moderno New Balance', 'New Balance'),
  ('574', 'Icónico modelo New Balance', 'New Balance'),
  ('1300', 'Clásico New Balance', 'New Balance'),
  ('530', 'Retro New Balance', 'New Balance'),
  ('Princesa', 'Línea Princesa de Reebok', 'Reebok'),
  ('Plus Clásico', 'Plus Clásico Reebok', 'Reebok'),
  ('Bota Clásica', 'Bota Clásica Reebok', 'Reebok'),
  ('Running', 'Línea Running de Reebok', 'Reebok')
) AS temp(name, description, brand_name)
WHERE NOT EXISTS (SELECT 1 FROM style WHERE style.name = temp.name)
ON CONFLICT (name, brand_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- PRODUCTOS (65)
-- Regla especial: Reebok Princesa solo en Dama e Infantil
-- ─────────────────────────────────────────────────────────────────
INSERT INTO product (style_id, category_id, created_at, updated_at)
SELECT s.id, c.id, NOW(), NOW()
FROM style s
CROSS JOIN category c
WHERE 
  -- Reebok Princesa: solo Dama + Infantil (excluir Caballero)
  NOT (s.name = 'Princesa' AND c.name = 'Caballero')
AND NOT EXISTS (
  SELECT 1 FROM product 
  WHERE product.style_id = s.id 
  AND product.category_id = c.id
)
ON CONFLICT (style_id, category_id) DO NOTHING;
