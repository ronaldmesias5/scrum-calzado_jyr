-- Test #16: Tarea de corte (deduccion de insumos)
-- Endpoint: POST /api/v1/admin/orders/{id}/tasks
-- Verifica: tarea creada, stock insumos decrementado

SELECT type, status, amount FROM tasks
WHERE order_id = (SELECT id FROM orders
                  WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
                  ORDER BY created_at DESC LIMIT 1)
  AND type = 'corte';

SELECT s.name_supplies, s.stock_quantity
FROM product_supplies ps
JOIN supplies s ON s.id = ps.supply_id
WHERE ps.product_id = '10000000-0000-0000-0000-000000000001';
