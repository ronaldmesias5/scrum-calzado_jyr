-- Test #22: ROLLBACK por fallo (atomicidad)
-- Verifica: nada persiste cuando la transaccion falla

BEGIN;
  INSERT INTO orders (id, customer_id, total_pairs, state, creation_date, created_at)
  VALUES ('70000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000004',
          50, 'pendiente', NOW(), NOW());
  RAISE EXCEPTION 'Simulacion de fallo - stock insuficiente';
ROLLBACK;

-- Verificar que NADA persistio
SELECT COUNT(*) AS debe_ser_cero FROM orders WHERE id = '70000000-0000-0000-0000-000000000099';
