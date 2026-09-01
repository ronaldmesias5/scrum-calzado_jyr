-- Test #02: Login JWT exitoso
-- Endpoint: POST /api/v1/auth/login
-- Verifica: is_active=true, token generado

SELECT email, session_version, is_active
FROM users
WHERE email = 'ronald.jefe@gmail.com';
