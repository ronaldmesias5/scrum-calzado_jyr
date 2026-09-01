-- Test #23: Eliminar producto exitoso (soft delete)
-- Endpoint: DELETE /api/v1/admin/catalog/products/{id}
-- Verifica: deleted_at NOT NULL, state=false

-- Crear producto temporal para eliminar
INSERT INTO products (id, style_id, brand_id, category_id, name_product,
  description_product, color, state, created_at)
VALUES ('10000000-0000-0000-0000-000000000099',
  'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001', 'Producto Para Eliminar',
  'Temporal', 'Blanco', true, NOW()) ON CONFLICT DO NOTHING;

-- Soft delete
UPDATE products SET deleted_at = NOW(), state = false
WHERE id = '10000000-0000-0000-0000-000000000099';

-- Verificar
SELECT id, name_product, state, deleted_at FROM products
WHERE id = '10000000-0000-0000-0000-000000000099';
