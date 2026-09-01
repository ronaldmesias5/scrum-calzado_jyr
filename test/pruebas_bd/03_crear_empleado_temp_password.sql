-- Test #03: Crear empleado con password temporal
-- Endpoint: POST /api/v1/admin/users/create-employee
-- Verifica: occupation=cortador, is_active=true

SELECT email, name_user, occupation, is_active, is_validated
FROM users WHERE email = 'qa.empleado.nuevo@test.com';
