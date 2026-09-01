-- Test #19: Crear incidencia de producto
-- Endpoint: POST /api/v1/scrap
-- Verifica: status=pending, defect_code_id correcto

SELECT ppi.id, ppi.quantity, ppi.status, ppi.defect_code_id
FROM pending_product_incidences ppi
ORDER BY ppi.created_at DESC LIMIT 1;
