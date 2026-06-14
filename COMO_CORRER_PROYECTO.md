# 🚀 Cómo Correr el Proyecto CALZADO J&R

**Estado:** ✅ Funcional | **Ambiente:** Docker Compose | **Versión:** v1.0

---

## ⚡ Quick Start (3 pasos)

### 1️⃣ Clonar y Configurar

```bash
git clone <REPO_URL> calzado-jyr
cd calzado-jyr
cp .env.example .env
```

**Para DEVELOPMENT local:**

- No cambiar nada en `.env` — ya trae valores de ejemplo

**Para PRODUCTION:**

```bash
# En el archivo .env, actualizar:
# - DATABASE_PASSWORD → generar contraseña segura
# - SECRET_KEY → generar con: python -c "import secrets; print(secrets.token_urlsafe(48))"
# - FRONTEND_URL y VITE_API_URL → URLs reales con HTTPS
# - MAIL_* → Credenciales SMTP válidas (Opcional para recuperación de contraseña)
```

### 2️⃣ Levantar Servicios

```bash
docker compose up -d --build
```

Esperar 30-60 segundos a que todo inicie.

**Nota:** Las migraciones de Alembic (27) se ejecutan automáticamente al iniciar el backend. La BD se crea completa con tablas, índices, triggers y datos de prueba (65 productos, 3 roles, usuarios de prueba).

### 3️⃣ Acceder a la Aplicación

```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
Swagger:   http://localhost:8000/docs
```

---

## 👤 Usuarios de Prueba

**Admin (Jefe - Acceso al Dashboard):**

```
Email:     ronald.jefe@gmail.com
Contraseña: Test123456!
```

---

## 🛠️ Desarrollo Local (Sin Docker)

Si prefieres correr el frontend o backend por separado:

### Backend (con uv)

```powershell
cd be
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend (con pnpm)

**IMPORTANTE:** Usar ÚNICAMENTE `pnpm`, nunca `npm` ni `yarn`.

```powershell
cd fe
pnpm install
pnpm dev
```

---

## ✅ Verificación Rápida BD (si necesario)

```bash
docker compose exec db psql -U jyr_user -d calzado_jyr_db
  \dt                    # Ver tablas
  SELECT COUNT(*) FROM products;  # Ver productos (debe ser 65)
  \q
```

## 🔗 URLs Principales

| Servicio | URL |
|----------|-----|
| Frontend | <http://localhost:5173> |
| Backend | <http://localhost:8000> |
| API Swagger | <http://localhost:8000/docs> |
| API ReDoc | <http://localhost:8000/redoc> |
| Mailpit UI | <http://localhost:8025> |
| PostgreSQL | localhost:5432 |

---

## 📧 Correos Electrónicos

### Desarrollo (Mailpit)

Los correos nunca se envían realmente. Se capturan en Mailpit:
- **Web UI:** http://localhost:8025

### Producción (Gmail SMTP)

Para enviar correos reales, configurar en `.env`:

```env
MAIL_USERNAME=jyrcalzado@gmail.com
MAIL_PASSWORD=abcd1234efgh5678   # ← App Password de 16 caracteres
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Importante:** No usar la contraseña normal de Gmail. Generar App Password en:
https://myaccount.google.com/apppasswords

---

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL + Alembic (27 migraciones)
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS 4
- **Orquestación:** Docker Compose (db + be + fe + mailpit)
- **Auth:** JWT + Bcrypt
- **AI Tools:** OpenCode con 9 skills integradas

---

**¡Listo para correr!**
