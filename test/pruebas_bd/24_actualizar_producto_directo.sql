-- Test #24: Actualizar producto (UPDATE directo)
-- Endpoint: PUT /api/v1/admin/catalog/products/{id}
-- Verifica: nombre, color y updated_at cambiaron

-- Guardar estado anterior
SELECT name_product, color, updated_at AS updated_antes INTO TEMPORARY TABLE tmp_estado
FROM products WHERE id = '10000000-0000-0000-0000-000000000001';

-- Actualizar
UPDATE products SET name_product = 'Tenis Running Pro', color = 'Rojo', updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000001';

-- Verificar
SELECT name_product, color, updated_at FROM products
WHERE id = '10000000-0000-0000-0000-000000000001';

-- Restaurar
UPDATE products SET name_product = 'Tenis Running', color = 'Negro', updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000001';
DROP TABLE IF EXISTS tmp_estado;
