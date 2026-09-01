-- Test #25: Salida valida de stock
-- Endpoint: POST /api/v1/admin/catalog/inventory/movements
-- Verifica: stock decrementado, movimiento registrado

UPDATE inventory SET amount = amount - 10
WHERE product_id = '10000000-0000-0000-0000-000000000001' AND size = '40' AND colour = 'Negro';

INSERT INTO inventory_movement (id, inventory_id, type_of_movement, quantity, reason, created_at)
VALUES ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'salida', 10, 'Prueba salida valida', NOW());

-- Verificar
SELECT amount, reserved, amount - reserved AS disponible FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001' AND size = '40' AND colour = 'Negro';

SELECT type_of_movement, quantity, reason FROM inventory_movement
WHERE id = '80000000-0000-0000-0000-000000000001';

-- Restaurar
UPDATE inventory SET amount = amount + 10
WHERE product_id = '10000000-0000-0000-0000-000000000001' AND size = '40' AND colour = 'Negro';
DELETE FROM inventory_movement WHERE id = '80000000-0000-0000-0000-000000000001';
