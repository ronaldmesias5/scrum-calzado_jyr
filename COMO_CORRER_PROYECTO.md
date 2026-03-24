# 🚀 Cómo Correr el Proyecto CALZADO J&R

**Estado:** ✅ Funcional | **Ambiente:** Docker Compose | **Versión:** v0.4

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

### 3️⃣ Acceder a la Aplicación
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
Swagger:   http://localhost:8000/docs
```

---

## 👤 Usuario de Prueba

```
Email:     admin@calzadojyr.com
Contraseña: AdminSegura123!
```


---

## ✅ Verificación Rápida

```bash
# Ver estado de servicios
docker compose ps

# Ver logs del backend
docker compose logs backend -f

# Conectarse a BD (si necesario)
docker compose exec db psql -U jyr_user -d calzado_jyr_db
  \dt                    # Ver tablas
  SELECT COUNT(*) FROM products;  # Ver productos (debe ser 65)
  \q
```

**Debería ver:**
- ✅ 3 servicios corriendo: `db`, `backend`, `frontend`
- ✅ 65 productos en BD
- ✅ Frontend carga sin errores
- ✅ Login funciona


---

## 🔗 URLs Principales

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Swagger | http://localhost:8000/docs |
| API ReDoc | http://localhost:8000/redoc |
| PostgreSQL | localhost:5432 |

---

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Orquestación:** Docker Compose
- **Auth:** JWT + Bcrypt

---

**¡Listo para correr! **
