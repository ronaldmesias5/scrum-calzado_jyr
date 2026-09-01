-- Test #10: Salida de stock insuficiente (rechazada)
-- Endpoint: POST /api/v1/admin/catalog/inventory/movements
-- Verifica: stock sin cambios, sin movimiento registrado

SELECT amount, reserved, amount - reserved AS disponible
FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001'
  AND size = '40' AND colour = 'Negro';
