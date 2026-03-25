# 👤 Usuarios de Prueba — Proyecto Calzado J&R

Después de ejecutar migraciones (`alembic upgrade head`), tendrás 3 usuarios listos para testing:

## 🔑 Credenciales de Prueba

### 1️⃣ **Admin — Jefe del Sistema** (Para ver Dashboard)

```
Email:    admin@calzadojyr.com
Password: admin123
Rol:      admin
Ocupación: jefe
```

**Acceso:** Sistema completo, configuración, usuarios, reportes.

---

### 2️⃣ **Employee — Operario** (Para gestión de producción)

```
Email:    cortador@calzadojyr.com
Password: cortador123
Rol:      employee
Ocupación: cortador
```

**Acceso:** Tareas, inventario, movimientos, producción.

---

### 3️⃣ **Client — Cliente** (Para compras)

```
Email:    cliente@calzadojyr.com
Password: cliente123
Rol:      client
Ocupación: (ninguna)
```

**Acceso:** Ver catálogo, realizar pedidos, seguimiento.

---

## 🔐 Información Personal

| Usuario | Nombre Completo | Teléfono | Cédula |
|---------|---|---|---|
| Admin | Juan Administrador | +57 300 123 4567 | 1001234567 |
| Employee | Carlos Cortador | +57 301 234 5678 | 1002345678 |
| Client | María Cliente | +57 302 345 6789 | 1003456789 |

---

## 🚀 Cómo Usar

### 1. Ejecutar migraciones (incluye usuarios de prueba)

```bash
cd be
alembic upgrade head
```

### 2. Iniciar API

```bash
uvicorn app.main:app --reload
# O con Docker:
docker compose up
```

### 3. Logearse

**API:** 
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calzadojyr.com","password":"admin123"}'
```

**Frontend:**
```
http://localhost:5173
Ingresa email y password
```

---

## ⚠️ Notas Importantes

- **Solo para desarrollo** — En producción estos usuarios deben eliminarse
- **Contraseñas simples** — Por seguridad, cambiar antes de deploy
- **Migraciones versionadas** — Si ejecutas `downgrade`, se eliminan estos usuarios
- **BD siempre igual** — Mismo usuario en todas las máquinas de desarrollo

---

## 🗑️ Para Eliminar Usuarios de Prueba

```bash
# Revertir solo esta migración
cd be
alembic downgrade 003_seed_catalog_data

# O eliminarlos manualmente
psql -U tu_usuario -d tu_bd -c \
  "DELETE FROM users WHERE email LIKE '%@calzadojyr.com'"
```

---

## 📝 Crear Más Usuarios de Prueba

Puedes agregar más usuarios modificando la migración 004, o crear nuevos con:

```bash
# Registrarse por API
POST http://localhost:8000/api/auth/register
{
  "email": "nuevo@example.com",
  "password": "password123",
  "name_user": "Nombre",
  "last_name": "Apellido"
}
```

---

**¡El jefe ya puede logearse y ver el dashboard! 🎉**
