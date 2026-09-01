-- Test #21: Transaccion exitosa (COMMIT)
-- Verifica: pedido + detalle + stock se crean atomicamente

BEGIN;
  INSERT INTO orders (id, customer_id, total_pairs, state, creation_date, created_at)
  VALUES ('70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
          5, 'pendiente', NOW(), NOW());
  INSERT INTO order_details (id, order_id, product_id, size, colour, amount, created_at)
  VALUES ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
          '10000000-0000-0000-0000-000000000001', '40', 'Negro', 5, NOW());
  UPDATE inventory SET reserved = reserved + 5
  WHERE product_id = '10000000-0000-0000-0000-000000000001' AND size = '40' AND colour = 'Negro';
COMMIT;

-- Verificar que todo persistio
SELECT id, state, total_pairs FROM orders WHERE id = '70000000-0000-0000-0000-000000000001';
SELECT amount, reserved, amount - reserved AS disponible FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001' AND size = '40' AND colour = 'Negro';
