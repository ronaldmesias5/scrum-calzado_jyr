-- Verificacion final de integridad
-- Ejecutar DESPUES de todos los tests (01-26)

SELECT 'USUARIOS' AS tabla, COUNT(*) AS total FROM users WHERE deleted_at IS NULL
UNION ALL SELECT 'MARCAS', COUNT(*) FROM brands WHERE deleted_at IS NULL
UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM products WHERE deleted_at IS NULL
UNION ALL SELECT 'INVENTARIO', COUNT(*) FROM inventory WHERE deleted_at IS NULL
UNION ALL SELECT 'PEDIDOS', COUNT(*) FROM orders WHERE deleted_at IS NULL
UNION ALL SELECT 'TAREAS', COUNT(*) FROM tasks WHERE deleted_at IS NULL
UNION ALL SELECT 'INCIDENCIAS', COUNT(*) FROM pending_product_incidences WHERE deleted_at IS NULL
UNION ALL SELECT 'LOSS_RECORDS', COUNT(*) FROM loss_records WHERE deleted_at IS NULL;

-- FK orphans (debe ser 0)
SELECT COUNT(*) AS inventario_huerfanos FROM inventory i
LEFT JOIN products p ON p.id = i.product_id WHERE p.id IS NULL;

-- Duplicados (debe ser 0)
SELECT name_brand, COUNT(*) FROM brands WHERE deleted_at IS NULL
GROUP BY name_brand HAVING COUNT(*) > 1;
