-- Test #08: Eliminar marca con estilos (bloqueado por FK)
-- Endpoint: DELETE /api/v1/admin/catalog/brands/{id}
-- Verifica: la marca sigue existiendo (no eliminada)

SELECT id, name_brand, deleted_at
FROM brands WHERE id = 'e0000000-0000-0000-0000-000000000002';
