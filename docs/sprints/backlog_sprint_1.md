# Backlog Sprint 1 — Autenticación: Registro e Inicio de Sesión

**Sprint:** 1
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Mayo–Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-001 | Creación de Cuentas | 13 | ✅ COMPLETADO |
| HU-003 | Inicio de Sesión | 8 | ✅ COMPLETADO |

---

## HU-001: Creación de Cuentas (13 SP)

**Endpoint:** `POST /api/v1/auth/register` (`be/app/modules/auth/router.py:53`)

### Descripción
Registro de nuevos usuarios (clientes) en el sistema. El usuario proporciona nombre, correo electrónico, contraseña y tipo de documento. La cuenta se crea en estado inactivo (`is_active=False`, `is_validated=False`) y se envía un correo de validación.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/auth/router.py:53-81` | Endpoint `POST /register`. Recibe `RegisterRequest`, valida email único, hashea contraseña, crea `User` con rol `cliente` (id=3). Devuelve `UserResponse` con código 201. |
| `be/app/modules/auth/schemas.py` | `RegisterRequest` (name_user, last_name, id_type, id_number, email, password, phone, address), `UserResponse` (id, email, name_user, last_name, role, is_active, is_validated, avatar_url, created_at) |
| `be/app/modules/users/service.py` | `create_user()` — lógica de negocio: validación de email duplicado, creación del usuario en BD |
| `be/app/models/user.py` | Modelo `User`: `is_active` (default False), `is_validated` (default False), `session_version` (default 0), `must_change_password` (default False) |
| `be/app/utils/email.py` | `send_validation_email()` — envía correo con enlace de validación (en desarrollo: imprime en consola; en producción: SMTP real con aiosmtplib) |
| `be/app/modules/auth/security.py` | `hash_password()` — bcrypt con `passlib.context.CryptContext` |
| `be/alembic/versions/` | Migraciones iniciales que crean tabla `users` con todos los campos necesarios |

### Endpoints relacionados
- `POST /api/v1/auth/register` — Crear cuenta de cliente
- `POST /api/v1/auth/login` — Inicio de sesión (usado tras validación)

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/modules/landing/auth/RegisterPage.tsx` | Formulario de registro con todos los campos requeridos. Validación en cliente. Redirige a confirmación tras éxito. |
| `fe/src/services/authApi.ts` | Llamada `POST /auth/register` con los datos del formulario |

### Flujo
1. Usuario completa formulario de registro (nombre, email, contraseña, tipo/número documento, teléfono, dirección)
2. Frontend valida campos y envía `POST /api/v1/auth/register`
3. Backend verifica email no duplicado, hashea contraseña, crea `User(is_active=False, is_validated=False, role_id=3)`
4. Backend envía email de validación con enlace
5. Frontend muestra mensaje de éxito: "Revisa tu correo para activar tu cuenta"

---

## HU-003: Inicio de Sesión (8 SP)

**Endpoint:** `POST /api/v1/auth/login` (`be/app/modules/auth/router.py:85-104`)

### Descripción
Autenticación de usuarios mediante JWT con access y refresh tokens almacenados en cookies HttpOnly. Soporta renovación de tokens y cierre de sesión. Incluye control de versión de sesión para invalidación remota.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/auth/router.py:85-104` | `POST /login` — valida credenciales, verifica `is_active`, actualiza `last_login`, genera tokens, setea cookies HttpOnly |
| `be/app/modules/auth/router.py:107-129` | `POST /refresh` — refresca access token usando refresh token válido |
| `be/app/modules/auth/router.py:131-138` | `POST /logout` — limpia cookies, NO invalida tokens (se espera expiración natural) |
| `be/app/modules/auth/security.py` | `create_access_token()`, `create_refresh_token()`, `verify_password()`, `decode_token()` — JWT con HS256, expiración configurable vía `.env` |
| `be/app/core/dependencies.py` | `get_current_user()` — dependencia FastAPI que decodifica token JWT de la cookie `access_token`, verifica `session_version` del usuario contra la del token |
| `be/app/models/user.py` | `session_version: int` — se incrementa al cambiar contraseña o invalidar sesiones manualmente |

### Endpoints
| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| POST | `/api/v1/auth/login` | 85-104 | Autenticación con email+password. Setea `access_token` (30min) y `refresh_token` (7d) como cookies HttpOnly, Secure, SameSite=Lax. |
| POST | `/api/v1/auth/refresh` | 107-129 | Intercambia refresh token por nuevo access token. Verifica vigencia del refresh token. |
| POST | `/api/v1/auth/logout` | 131-138 | Elimina cookies del cliente. No invalida tokens del lado del servidor. |

### Seguridad
- **JWT**: tokens firmados con HS256, secret key de `settings.SECRET_KEY`
- **HttpOnly**: las cookies no son accesibles desde JavaScript (`httponly=True`)
- **Secure**: solo en HTTPS (configurable vía `settings.SECURE_COOKIES`)
- **SameSite=Lax**: protege contra CSRF en navegadores modernos
- **session_version**: cada token incluye `session_version` del usuario; `get_current_user()` lo verifica contra BD. Si se incrementa (ej. cambio de contraseña), tokens anteriores quedan inválidos.
- **Rate limiting**: `POST /login` tiene rate limiter (deshabilitado en `development`)

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/modules/auth/pages/LoginPage.tsx` | Formulario de inicio de sesión con email y contraseña. Manejo de errores (credenciales inválidas, cuenta inactiva). |
| `fe/src/services/authApi.ts` | `POST /auth/login` con `withCredentials: true` para enviar/recibir cookies |
| `fe/src/store/authStore.ts` | Zustand store: `login()`, `logout()`, `checkAuth()`. Persiste estado de autenticación. Redirige según rol. |
| `fe/src/components/auth/ProtectedRoute.tsx` | Componente wrapper que verifica autenticación y rol antes de renderizar rutas protegidas |

### Flujo
1. Usuario ingresa email y contraseña en `LoginPage.tsx`
2. Frontend llama `POST /api/v1/auth/login` con `withCredentials: true`
3. Backend verifica credenciales con `verify_password()`
4. Backend verifica `user.is_active == True` (si está inactivo, rechaza login)
5. Backend genera `access_token` (30min) y `refresh_token` (7d), los setea como cookies
6. Frontend `authStore.login()` decodifica el token (payload contiene `sub`, `role`, `session_version`) y actualiza estado global
7. Usuario es redirigido a su dashboard según rol (`/admin/dashboard`, `/employee/dashboard`, `/client/dashboard`)

### Manejo de tokens expirados
- Si `access_token` expira, el interceptor de Axios detecta error 401 y automáticamente llama `POST /auth/refresh`
- Si el refresh falla (refresh token expirado o inválido), redirige a login

---

## Cambios Técnicos

- **Arquitectura**: Se crearon los módulos `auth/` y `users/` dentro de `be/app/modules/`, cada uno con `router.py`, `service.py` (sin controller/repository aún — patrón 4-capas incompleto)
- **Seguridad**: Configuración inicial de JWT, bcrypt, cookies HttpOnly, rate limiting básico
- **Modelos**: Tabla `users` con campos `is_active`, `is_validated`, `session_version`, `must_change_password`
- **Frontend**: Store de autenticación con Zustand, sistema de redirección por rol, interceptores Axios para refresh automático
- **Migraciones**: Migraciones iniciales de Alembic para tabla `users`

## Logros

- Sistema de autenticación completo con JWT + refresh tokens
- Separación clara por roles (jefe, empleado, cliente) desde el registro
- Manejo seguro de sesiones con `session_version`
- UX: redirect automático por rol después de login, refresh silencioso de tokens

## Resumen

El Sprint 1 estableció la base del sistema de autenticación: registro de clientes con validación por email, e inicio de sesión con JWT + refresh tokens en cookies HttpOnly. Queda pendiente la activación de cuentas por parte del admin (HU-002, Sprint 2) y la recuperación de contraseñas (HU-004, Sprint 2).
