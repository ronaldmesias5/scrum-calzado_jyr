-- Test #04: Validar cuenta de empleado
-- Endpoint: PATCH /api/v1/admin/users/{id}/validate
-- Verifica: is_validated=true, validated_by=admin

SELECT u.email, u.is_validated, u.validated_by, u.validated_at
FROM users u
WHERE u.email = 'qa.empleado.nuevo@test.com';
