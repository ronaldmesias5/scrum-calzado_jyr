-- Test #14: Estado entregado (libera reserva)
-- Endpoint: PATCH /api/v1/admin/orders/{id}/status
-- Verifica: reserved=0, state=entregado

SELECT amount, reserved, amount - reserved AS disponible
FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001'
  AND size = '40' AND colour = 'Negro';

SELECT state FROM orders
WHERE id = (SELECT id FROM orders
            WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
            ORDER BY created_at DESC LIMIT 1);
