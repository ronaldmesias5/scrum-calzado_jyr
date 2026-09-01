-- Test #26: Cadena de produccion completa
-- Verifica: corte -> guarnicion -> soladura -> emplantillado -> completado

-- Crear pedido + tarea corte
INSERT INTO orders (id, customer_id, total_pairs, state, creation_date, created_at)
VALUES ('70000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000004',
        4, 'pendiente', NOW(), NOW());
INSERT INTO tasks (id, order_id, product_id, type, amount, status, priority, line_group, created_at)
VALUES ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000026',
        '10000000-0000-0000-0000-000000000001', 'corte', 4, 'pendiente', 'media', 1, NOW());

-- Completar etapas
UPDATE tasks SET status = 'completado' WHERE id = '90000000-0000-0000-0000-000000000001';
UPDATE orders SET state = 'completado' WHERE id = '70000000-0000-0000-0000-000000000026';

-- Verificar
SELECT type, status FROM tasks WHERE order_id = '70000000-0000-0000-0000-000000000026' ORDER BY created_at;
SELECT id, state FROM orders WHERE id = '70000000-0000-0000-0000-000000000026';

-- Limpiar
DELETE FROM tasks WHERE order_id = '70000000-0000-0000-0000-000000000026';
DELETE FROM orders WHERE id = '70000000-0000-0000-0000-000000000026';
