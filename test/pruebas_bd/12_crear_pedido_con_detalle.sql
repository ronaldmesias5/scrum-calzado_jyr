-- Test #12: Crear pedido con detalle
-- Endpoint: POST /api/v1/admin/orders
-- Verifica: state=pendiente, total_pairs=SUM(details)

SELECT o.id, o.total_pairs, o.state, u.email AS cliente
FROM orders o
JOIN users u ON u.id = o.customer_id
WHERE u.email = 'cliente.test@gmail.com'
ORDER BY o.created_at DESC LIMIT 1;

-- Coherencia total_pairs = SUM(amount)
SELECT o.total_pairs, SUM(od.amount) AS suma_detalles,
  CASE WHEN o.total_pairs = SUM(od.amount) THEN 'OK' ELSE 'FALLA' END AS verificacion
FROM orders o JOIN order_details od ON od.order_id = o.id
WHERE o.id = (SELECT id FROM orders
              WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
              ORDER BY created_at DESC LIMIT 1)
GROUP BY o.total_pairs;
