-- Test #01: Registro de cliente nuevo
-- Endpoint: POST /api/v1/auth/register
-- Verifica: email, rol client, is_active=true

SELECT u.email, u.name_user, u.is_active, r.name_role
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.email = 'qa.cliente.nuevo@test.com'
  AND r.name_role = 'client';
