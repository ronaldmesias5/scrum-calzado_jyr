-- Test #20: Aprobar incidencia (loss_record)
-- Endpoint: PATCH /api/v1/scrap/{id}/approve
-- Verifica: status=approved, loss_record creado

SELECT ppi.id, ppi.status, ppi.approved_type, ppi.loss_record_id
FROM pending_product_incidences ppi
WHERE ppi.status = 'approved'
ORDER BY ppi.updated_at DESC LIMIT 1;

SELECT id, product_id, quantity, incident_type
FROM loss_records ORDER BY created_at DESC LIMIT 1;
