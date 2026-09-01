-- Test #07: Producto duplicado rechazado
-- Endpoint: POST /api/v1/admin/catalog/products
-- Verifica: no hay duplicados por combinacion de atributos

SELECT name_product, COUNT(*) AS total
FROM products WHERE deleted_at IS NULL
GROUP BY name_product HAVING COUNT(*) > 1;
