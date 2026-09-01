-- Test #18: Reclamo de tarea incompatible (bloqueado)
-- Endpoint: POST /api/v1/dashboard/employee/tasks/{id}/claim
-- Verifica: tarea sin asignar (cortador no puede guarnicion)

SELECT type, status, assigned_to FROM tasks
WHERE order_id = (SELECT id FROM orders
                  WHERE customer_id = 'c0000000-0000-0000-0000-000000000004'
                  ORDER BY created_at DESC LIMIT 1)
  AND type = 'guarnicion';
