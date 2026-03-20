-- ================================================================
-- Script III: Seed de Marcas, Categorías, Estilos y Productos
-- ================================================================
-- Descripción: Inserta datos iniciales para el catálogo de calzado
-- Ejecución: Solo se ejecuta si las tablas están vacías (IF NOT EXISTS)

-- ─────────────────────────────────────────────────────────────────
-- MARCAS (5)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
SELECT 'Nike', 'Marca estadounidense de calzado y ropa deportiva', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name_brand = 'Nike');

INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
SELECT 'Adidas', 'Líder global en ropa y calzado deportivo', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name_brand = 'Adidas');

INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
SELECT 'Puma', 'Marca internacional de calzado deportivo y casual', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name_brand = 'Puma');

INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
SELECT 'New Balance', 'Fabricante de calzado deportivo y casual', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name_brand = 'New Balance');

INSERT INTO brands (name_brand, description_brand, created_at, updated_at)
SELECT 'Reebok', 'Marca de calzado deportivo y fitness', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name_brand = 'Reebok');

-- ─────────────────────────────────────────────────────────────────
-- CATEGORÍAS (3)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO categories (name_category, description_category, created_at, updated_at)
SELECT 'Dama', 'Zapatos para mujeres', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_category = 'Dama');

INSERT INTO categories (name_category, description_category, created_at, updated_at)
SELECT 'Caballero', 'Zapatos para hombres', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_category = 'Caballero');

INSERT INTO categories (name_category, description_category, created_at, updated_at)
SELECT 'Infantil', 'Zapatos para niños', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_category = 'Infantil');

-- ─────────────────────────────────────────────────────────────────
-- ESTILOS (22) - Referencias a marcas por nombre
-- ─────────────────────────────────────────────────────────────────
INSERT INTO styles (name_style, description_style, brand_id, created_at, updated_at)
SELECT name, description, (SELECT id FROM brands WHERE brands.name_brand = temp.brand_name LIMIT 1), NOW(), NOW()
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
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name_style = temp.name);

-- ─────────────────────────────────────────────────────────────────
-- PRODUCTOS (65)
-- Regla especial: Reebok Princesa solo en Dama e Infantil
-- ─────────────────────────────────────────────────────────────────
INSERT INTO products (style_id, category_id, brand_id, name_product, created_at, updated_at)
SELECT 
  s.id,
  c.id,
  s.brand_id,
  s.name_style || ' - ' || c.name_category,
  NOW(),
  NOW()
FROM styles s
CROSS JOIN categories c
WHERE 
  -- Reebok Princesa: solo Dama + Infantil (excluir Caballero)
  NOT (s.name_style = 'Princesa' AND c.name_category = 'Caballero')
AND NOT EXISTS (
  SELECT 1 FROM products
  WHERE products.style_id = s.id 
  AND products.category_id = c.id
);
