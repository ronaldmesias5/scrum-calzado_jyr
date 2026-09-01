-- Test #17: Auto-crear siguiente etapa (guarnicion)
-- Endpoint: PATCH /api/v1/dashboard/employee/tasks/{id}/status
-- Verifica: corte=completado, guarnicion=pendiente

SELECT type, status, completed_at FROM tasks
WHERE order_id = (SELECT id FROM orders
                  WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
                  ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at;
