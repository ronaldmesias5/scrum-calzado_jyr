-- Test #09: Crear inventario
-- Endpoint: POST /api/v1/admin/catalog/inventory
-- Verifica: amount, reserved, size, colour

SELECT product_id, size, colour, amount, reserved
FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001'
  AND size = '40' AND colour = 'Negro';
