# Backlog Sprint 2 — Validación y Recuperación de Cuentas

**Sprint:** 2
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Mayo–Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-002 | Validación y Activación de Cuentas | 13 | ✅ COMPLETADO |
| HU-004 | Recuperación de Cuentas (Olvido de Contraseña) | 8 | ✅ COMPLETADO |

---

## HU-002: Validación y Activación de Cuentas (13 SP)

### Descripción
El administrador/jefe puede revisar usuarios pendientes de validación (registrados pero no activados), aprobar o rechazar sus cuentas. Al aprobar, el usuario queda activo (`is_active=True`, `is_validated=True`) y recibe un email de confirmación. Al rechazar, se envía un email notificando el motivo.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/admin/router.py:105-135` | `GET /admin/users/pending-validation` — lista usuarios con `is_validated=False`, ordenados por fecha de creación |
| `be/app/modules/admin/router.py:137-167` | `PATCH /admin/users/{id}/validate` — aprueba usuario: setea `is_active=True`, `is_validated=True`, envía email de bienvenida |
| `be/app/modules/admin/router.py:170-209` | `PATCH /admin/users/{id}/reject` — rechaza usuario: recibe `rejection_reason` en body, envía email de rechazo, elimina o marca como rechazado |
| `be/app/models/user.py` | `User.is_validated` (bool), `User.is_active` (bool) — flags que controlan el estado de la cuenta |
| `be/app/utils/email.py` | `send_validation_approved_email()` — email de cuenta activada; `send_validation_rejected_email()` — email con motivo de rechazo |

### Endpoints
| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/admin/users/pending-validation` | 105-135 | Obtiene lista de usuarios pendientes. Requiere rol admin/jefe. |
| PATCH | `/api/v1/admin/users/{id}/validate` | 137-167 | Aprueba usuario. Body opcional. Envía email de bienvenida con link de login. |
| PATCH | `/api/v1/admin/users/{id}/reject` | 170-209 | Rechaza usuario con motivo (`rejection_reason: str`). Envía email de rechazo. |

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/modules/dashboard-jefe/pages/UsersManagementPage.tsx` | Panel de gestión de usuarios con pestaña "Pendientes" que lista usuarios no validados. Botones "Aprobar" y "Rechazar" con confirmación. Modal de motivo de rechazo. |
| `fe/src/modules/dashboard-jefe/services/adminApi.ts` | `getPendingUsers()`, `validateUser(id)`, `rejectUser(id, reason)` |

### Flujo de Aprobación
1. Admin/jefe navega a `UsersManagementPage` → pestaña "Pendientes"
2. Se cargan usuarios con `GET /admin/users/pending-validation`
3. Admin hace clic en "Aprobar" → confirmación → `PATCH /admin/users/{id}/validate`
4. Backend: `user.is_active = True`, `user.is_validated = True`, `db.commit()`
5. Backend envía email "Tu cuenta ha sido activada — ya puedes iniciar sesión"
6. Frontend remueve usuario de la lista pendiente y muestra notificación de éxito

### Flujo de Rechazo
1. Admin hace clic en "Rechazar" → modal solicita motivo
2. Admin ingresa motivo y confirma → `PATCH /admin/users/{id}/reject` con `{"rejection_reason": "..."}`
3. Backend envía email con el motivo de rechazo
4. Backend (según implementación) elimina usuario o marca estado como rechazado
5. Frontend remueve usuario de la lista y muestra notificación

---

## HU-004: Recuperación de Cuentas (Olvido de Contraseña) (8 SP)

### Descripción
Los usuarios pueden solicitar un restablecimiento de contraseña si la olvidan. El sistema envía un enlace único con token UUID que expira en 1 hora. El usuario puede establecer una nueva contraseña mediante ese enlace.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/auth/router.py:171-184` | `POST /auth/forgot-password` — recibe email, verifica que el usuario exista, genera token UUID con expiración, almacena en BD, envía email |
| `be/app/modules/auth/router.py:187-198` | `POST /auth/reset-password` — recibe token + nueva contraseña, verifica token vigente, actualiza contraseña, incrementa `session_version`, invalida token |
| `be/app/modules/auth/schemas.py` | `ForgotPasswordRequest(email)`, `ResetPasswordRequest(token, new_password)` |
| `be/app/models/password_reset.py` | Modelo `PasswordResetToken`: `id` (UUID), `user_id` (FK), `token` (UUID único), `expires_at` (datetime), `used` (bool), `created_at` |
| `be/app/utils/email.py` | `send_password_reset_email()` — envía email con enlace de restablecimiento (en desarrollo: imprime en consola) |

### Endpoints
| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| POST | `/api/v1/auth/forgot-password` | 171-184 | Solicita restablecimiento. Genera token UUID, almacena con expiry 1h. Envía email. |
| POST | `/api/v1/auth/reset-password` | 187-198 | Restablece contraseña. Valida token, actualiza hash, incrementa `session_version`, marca token como usado. |

### Seguridad
- **Token UUID v4**: impredecible, único por solicitud
- **Expiración 1 hora**: `expires_at = datetime.utcnow() + timedelta(hours=1)`
- **One-time use**: `used` flag evita reutilización del mismo token
- **session_version increment**: invalida todas las sesiones activas del usuario, forzando inicio de sesión con la nueva contraseña
- **No revela existencia del usuario**: siempre responde con mismo mensaje genérico ("Si el email está registrado, recibirás un enlace") independientemente de si el email existe

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/modules/auth/pages/ForgotPasswordPage.tsx` | Formulario que solicita email. Muestra mensaje de confirmación genérico tras envío. |
| `fe/src/modules/auth/pages/ResetPasswordPage.tsx` | Formulario con nueva contraseña + confirmación. Lee token de la URL (`/auth/reset-password?token=...`). |
| `fe/src/services/authApi.ts` | `forgotPassword(email)`, `resetPassword(token, newPassword)` |

### Flujo
1. Usuario hace clic en "¿Olvidaste tu contraseña?" en la página de login
2. Ingresa su email en `ForgotPasswordPage` → `POST /auth/forgot-password`
3. Backend genera `PasswordResetToken(token=uuid4(), expires_at=now+1h, used=False)`, guarda en BD
4. Backend envía email con enlace: `http://localhost:5173/auth/reset-password?token={uuid}`
5. Usuario recibe el email (en desarrollo: consola del servidor) y hace clic en el enlace
6. `ResetPasswordPage` lee `token` de query params, muestra formulario de nueva contraseña
7. Usuario ingresa nueva contraseña → `POST /auth/reset-password` con `{token, new_password}`
8. Backend verifica token: existe, no expirado, no usado → actualiza contraseña, incrementa `session_version`, marca token como usado
9. Frontend redirige a login con mensaje "Contraseña actualizada. Inicia sesión con tu nueva contraseña."

---

## Cambios Técnicos

- **Nuevo modelo**: `PasswordResetToken` en `be/app/models/password_reset.py` con migración Alembic
- **Email service**: Funciones de envío de correo para aprobación, rechazo, y restablecimiento de contraseña
- **Seguridad**: Tokens de un solo uso con expiración, incremento de `session_version` al cambiar contraseña
- **Frontend**: Dos nuevas páginas públicas (`ForgotPasswordPage`, `ResetPasswordPage`) en módulo `auth/`
- **Admin panel**: Pestaña "Pendientes" en `UsersManagementPage` para gestión de validaciones

## Logros

- Flujo completo de validación de cuentas por parte del admin
- Sistema seguro de recuperación de contraseñas con tokens temporales
- Notificaciones por email en cada paso del proceso
- Mejora de seguridad: no revelar si un email está registrado o no

## Resumen

El Sprint 2 completó el ciclo de vida de la cuenta de usuario: desde el registro (Sprint 1) hasta la activación por admin y la capacidad de recuperar acceso en caso de olvido. Queda pendiente la reactivación de cuentas desactivadas (HU-005, Sprint 3) y el módulo de notificaciones (HU-029, Sprint 3).
