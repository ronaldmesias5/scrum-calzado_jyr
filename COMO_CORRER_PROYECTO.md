# 🚀 Cómo Correr el Proyecto CALZADO J&R

**Ambiente:** Docker Compose (db + be + fe + mailpit)

---

## ⚡ Quick Start (3 pasos)

### 1️⃣ Clonar y Configurar

```bash
git clone <REPO_URL> calzado-jyr
cd calzado-jyr
cp .env.example .env
```

**Para DEVELOPMENT local:** no cambiar nada en `.env` — ya trae valores de ejemplo.

**Para PRODUCTION:** actualizar en `.env`:

- `POSTGRES_PASSWORD` → contraseña segura
- `SECRET_KEY` → generar con: `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- `FRONTEND_URL` y `VITE_API_URL` → URLs reales con HTTPS
- `MAIL_*` → Credenciales SMTP válidas (opcional para recuperación de contraseña)

### 2️⃣ Levantar Servicios

```bash
docker compose up -d --build
```

Esperar 30-60 segundos a que todo inicie.

**Nota:** Las migraciones de Alembic se ejecutan automáticamente al iniciar el backend. La BD se crea completa con tablas, índices y datos de prueba (65 productos, roles y usuarios de prueba).

### 3️⃣ Acceder a la Aplicación

```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
Swagger:   http://localhost:8000/docs
```

---

## 👤 Usuario de Prueba

**Admin (Jefe - Acceso al Dashboard):**

```
Email:       ronald.jefe@gmail.com
Contraseña:  Test123456!
```

---

## ✅ Verificación Rápida BD (si necesario)

```bash
docker compose exec db psql -U <POSTGRES_USER> -d <POSTGRES_DB>
  \dt                    # Ver tablas
  SELECT COUNT(*) FROM products;  # Ver productos (debe ser 65)
  \q
```

---

## 📧 Correos Electrónicos

En desarrollo los correos **no se envían realmente**. Se capturan en Mailpit:
- **Web UI:** http://localhost:8025

Para enviar correos reales (Gmail SMTP con App Password), configurar las variables `MAIL_*` en `.env`. Generar App Password en: https://myaccount.google.com/apppasswords

---

**¡Listo para correr!**