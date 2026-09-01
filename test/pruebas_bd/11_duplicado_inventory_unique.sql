-- Test #11: Inventario duplicado (unicidad)
-- Endpoint: POST /api/v1/admin/catalog/inventory
-- Verifica: solo 1 registro por combinacion product+size+colour

SELECT product_id, size, colour, COUNT(*) AS total
FROM inventory
WHERE product_id = '10000000-0000-0000-0000-000000000001'
  AND size = '40' AND colour = 'Negro'
GROUP BY product_id, size, colour;
