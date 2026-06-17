# Backlog Sprint 3 — Reactivación de Cuentas y Módulo de Notificaciones

**Sprint:** 3
**Duración:** 2 semanas
**SP Total:** 21
**Fecha:** Mayo–Junio 2026
**Estado:** ✅ COMPLETADO

## Historias de Usuario

| HU | Nombre | SP | Estado |
|----|--------|----|--------|
| HU-005 | Solicitud de Reactivación de Cuentas | 13 | ✅ COMPLETADO |
| HU-029 | Módulo de Notificaciones | 8 | ✅ COMPLETADO |

---

## HU-005: Solicitud de Reactivación de Cuentas (13 SP)

### Descripción
Los usuarios cuya cuenta ha sido desactivada pueden solicitar su reactivación. El administrador/jefe recibe y gestiona estos tickets, pudiendo aprobar o rechazar la reactivación. El usuario recibe notificación por email del resultado.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/auth/router.py:201-267` | `POST /auth/request-reactivation` — usuario desactivado envía solicitud con motivo. Verifica que el email exista y la cuenta esté inactiva. Crea ticket de reactivación. |
| `be/app/modules/admin/router.py:577-680` | Gestión de tickets de reactivación: `GET /admin/reactivation-tickets` lista tickets pendientes, `PATCH .../approve` aprueba, `PATCH .../reject` rechaza con motivo. |
| `be/app/models/reactivation_ticket.py` | Modelo `ReactivationTicket`: `id`, `user_id` (FK), `reason` (texto), `status` (pending/approved/rejected), `admin_id` (nullable), `admin_note` (nullable), `created_at`, `resolved_at` |
| `be/app/utils/email.py` | `send_reactivation_approved_email()`, `send_reactivation_rejected_email()` — notificaciones de resultado |

### Endpoints
| Método | Ruta | Líneas | Descripción |
|--------|------|--------|-------------|
| POST | `/api/v1/auth/request-reactivation` | 201-267 | Crea ticket de reactivación. Requiere email + motivo. Crea `ReactivationTicket(status=pending)`. |
| GET | `/api/v1/admin/reactivation-tickets` | 577-? | Lista tickets pendientes. Filtrable por estado. Requiere rol admin/jefe. |
| PATCH | `/api/v1/admin/reactivation-tickets/{id}/approve` | ?-? | Aprueba reactivación: `user.is_active=True`, ticket `status=approved`, envía email. |
| PATCH | `/api/v1/admin/reactivation-tickets/{id}/reject` | ?-? | Rechaza reactivación con motivo. Ticket `status=rejected`, envía email de rechazo. |

### Seguridad
- Solo usuarios con cuenta existente pueden solicitar reactivación
- Cada solicitud crea un ticket único; no se permiten solicitudes duplicadas mientras haya un ticket pendiente
- El admin/jefe debe estar autenticado para gestionar tickets
- Las notificaciones por email informan al usuario del resultado

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/modules/auth/pages/ReactivationPage.tsx` | Formulario público donde el usuario ingresa email y motivo de reactivación. Muestra mensaje de éxito tras enviar. |
| `fe/src/modules/dashboard-jefe/pages/UsersManagementPage.tsx` | Pestaña "Reactivaciones" que lista tickets pendientes con botones Aprobar/Rechazar. Modal de motivo de rechazo. |

### Flujo
1. Usuario con cuenta desactivada ingresa a `/auth/reactivation`
2. Ingresa email y motivo → `POST /auth/request-reactivation`
3. Backend: verifica email existe y cuenta está inactiva → crea `ReactivationTicket(status="pending")`
4. Admin/jefe ve ticket en pestaña "Reactivaciones" de `UsersManagementPage`
5. Admin aprueba → `PATCH .../approve` → `user.is_active=True`, email de confirmación
6. Admin rechaza con motivo → `PATCH .../reject` → email de rechazo con motivo
7. Usuario recibe email y puede intentar iniciar sesión nuevamente (si aprobado)

---

## HU-029: Módulo de Notificaciones (8 SP)

### Descripción
Sistema centralizado de notificaciones para todos los roles del sistema. Soporta notificaciones en base de datos (persistentes) y en tiempo real vía WebSocket. Incluye conteo de no leídas, marcado como leídas, eliminación, y notificaciones push vía WebSocket.

### Implementación Backend

| Archivo | Rol |
|---------|-----|
| `be/app/modules/notifications/router.py` | Endpoints REST: `GET /notifications`, `GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all`, `DELETE /{id}` |
| `be/app/modules/notifications/service.py` | Capa de servicio: `create_notification()`, `get_user_notifications()`, `mark_as_read()`, `dismiss_notification()`, `get_unread_count()` |
| `be/app/modules/notifications/ws_manager.py` | Gestor de conexiones WebSocket: `connect()`, `disconnect()`, `broadcast_to_user()` |
| `be/app/modules/notifications/schemas.py` | `NotificationResponse`, `NotificationCreate`, `UnreadCountResponse` |
| `be/app/models/notification.py` | Modelo `Notification`: `id`, `user_id` (FK), `title`, `message`, `type` (info/warning/success/error), `is_read` (default False), `related_entity_type`, `related_entity_id`, `created_at` |

### Endpoints REST
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/notifications` | Lista notificaciones del usuario autenticado. Paginadas. Ordenadas por fecha descendente. |
| GET | `/api/v1/notifications/unread-count` | Devuelve `{"unread_count": N}` para el badge del navbar. |
| PATCH | `/api/v1/notifications/{id}/read` | Marca una notificación como leída. |
| PATCH | `/api/v1/notifications/read-all` | Marca todas las notificaciones del usuario como leídas. |
| DELETE | `/api/v1/notifications/{id}` | Elimina una notificación. |

### WebSocket
- **Ruta**: `ws://host/api/v1/notifications/ws`
- **Conexión**: requiere token JWT como query param (`?token=...`)
- **Eventos**:
  - `new_notification`: cuando se crea una nueva notificación para el usuario
  - `unread_count`: actualización del contador de no leídas
- **Mecanismo**: `ws_manager.py` mantiene un diccionario `{user_id: [WebSocket connections]}`. El service llama `ws_manager.broadcast_to_user()` después de crear una notificación.

### Service Layer (`be/app/modules/notifications/service.py`)
```python
def create_notification(db, user_id, title, message, type="info", related_entity_type=None, related_entity_id=None):
    # Crea Notification en BD
    # Llama ws_manager.broadcast_to_user() si el usuario tiene conexiones activas
    # Retorna la notificación creada

def get_user_notifications(db, user_id, skip=0, limit=50):
    # Query ordenado por created_at DESC
    # Filtra por user_id

def mark_as_read(db, notification_id, user_id):
    # Verifica que la notificación pertenezca al usuario
    # Actualiza is_read=True

def mark_all_as_read(db, user_id):
    # Bulk update: todas las no leídas del usuario

def dismiss_notification(db, notification_id, user_id):
    # Elimina la notificación (soft o hard delete según implementación)

def get_unread_count(db, user_id):
    # COUNT(*) WHERE user_id AND is_read=False
```

### Frontend

| Archivo | Rol |
|---------|-----|
| `fe/src/components/notifications/NotificationBell.tsx` | Icono de campana en navbar con badge del contador de no leídas. Dropdown con lista de notificaciones. |
| `fe/src/components/notifications/NotificationList.tsx` | Lista renderizada de notificaciones con icono por tipo (info/warning/success/error). Botones "Mark read" individual y "Mark all read". |
| `fe/src/services/notificationsApi.ts` | Funciones para todos los endpoints REST. |
| `fe/src/hooks/useNotifications.ts` | Hook que gestiona: polling del contador, conexión WebSocket, estado de notificaciones. |

### Integración con otros módulos
- **Auth**: notificación al activar/rechazar cuenta, al reactivar cuenta
- **Orders**: notificación al crear/actualizar/cancelar pedido
- **Admin**: notificación al crear usuario, al asignar tareas
- **Dashboard**: badge en navbar actualizado vía WebSocket o polling periódico

---

## Cambios Técnicos

- **Nuevo módulo**: `be/app/modules/notifications/` con router, service, ws_manager, schemas
- **Nuevo modelo**: `Notification` en `be/app/models/notification.py` con migración Alembic
- **WebSocket**: Implementación con `ws_manager.py` para conexiones en tiempo real
- **Nuevo modelo**: `ReactivationTicket` en `be/app/models/reactivation_ticket.py` con migración
- **Frontend**: Componentes reutilizables de notificaciones (`NotificationBell`, `NotificationList`)
- **Hook**: `useNotifications` para gestión centralizada de notificaciones en frontend

## Logros

- Sistema de tickets de reactivación completo con aprobación/rechazo por admin
- Módulo de notificaciones persistente con soporte REST y WebSocket
- Notificaciones en tiempo real sin necesidad de refrescar página
- Badge de contador de no leídas en navbar
- Integración con otros módulos para notificaciones automáticas

## Resumen

El Sprint 3 implementó dos funcionalidades clave: la reactivación de cuentas desactivadas mediante un sistema de tickets gestionados por el admin, y el módulo centralizado de notificaciones con soporte REST + WebSocket. Las notificaciones sientan las bases para mantener informados a los usuarios de eventos importantes del sistema en tiempo real.
