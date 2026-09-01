-- Test #05: Login con invitacion expirada (bloqueado)
-- Endpoint: POST /api/v1/auth/login
-- Verifica: invitation_expires_at < NOW(), is_active=false

SELECT email, is_active, invitation_expires_at,
  CASE WHEN invitation_expires_at < NOW() THEN 'BLOQUEADO'
       ELSE 'PERMITIDO' END AS estado
FROM users WHERE email = 'invitacion.expirada@test.com';
