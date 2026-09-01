-- Test #06: Crear marca (unicidad)
-- Endpoint: POST /api/v1/admin/catalog/brands
-- Verifica: no hay duplicados

SELECT name_brand, COUNT(*) AS repeticiones
FROM brands WHERE deleted_at IS NULL
GROUP BY name_brand HAVING COUNT(*) > 1;
