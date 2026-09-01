-- Test #15: Eliminar pedido no cancelado (bloqueado)
-- Endpoint: DELETE /api/v1/admin/orders/{id}
-- Verifica: el pedido sigue existiendo

SELECT id, state FROM orders
WHERE id = (SELECT id FROM orders
            WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
            ORDER BY created_at DESC LIMIT 1);
