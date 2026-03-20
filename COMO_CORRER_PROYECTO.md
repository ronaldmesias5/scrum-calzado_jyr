# 🚀 Cómo Correr el Proyecto CALZADO J&R

**Estado:** ✅ Funcional | **Ambiente:** Docker Compose | **Versión:** v0.4

> 📖 **Documentación Completa:** Ver [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) para guía exhaustiva con solución de problemas.

---

## 🎯 IMPORTANTE: Gestores de Dependencias

### Frontend: EXCLUSIVAMENTE `pnpm`

⚠️ **SOLO pnpm para el frontend**

- ✅ **pnpm** - ✓ ÚSALO PARA TODO
- ❌ **npm** - No está permitido
- ❌ **yarn** - No está permitido

Si ya ejecutaste `npm`, elimina el directorio `fe/node_modules` y corre:
```bash
cd fe && pnpm install
```

### Backend: EXCLUSIVAMENTE `UV`

⚠️ **SOLO UV para el backend Python**

- ✅ **UV** - ✓ ÚSALO PARA TODO  
- ❌ **pip** - No está permitido
- ❌ **poetry** - No está permitido
- ❌ **pipenv** - No está permitido

Si ya ejecutaste `pip install`, configura UV:
```bash
cd be && uv pip install -e .
```

**Recuerda:** be/requirements.txt fue **ELIMINADO**. Todas las dependencias están en **be/pyproject.toml**.

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

Otros usuarios disponibles en `.env.example` con sufijo `Segura123!`

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

## 🛑 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Connection refused" | `docker compose restart backend` |
| "Port already in use" | Cambiar `BE_PORT` o `FE_PORT` en `.env` y actualizar URLs |
| "No products found" | `docker compose down --volumes && docker compose up -d --build` |
| "Invalid SECRET_KEY" | Ver sección Configuración arriba para generar valor válido |

→ **Más soluciones en** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md#-solución-de-problemas)

---

## 📚 Documentación Completa

- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** ← Guía exhaustiva con todos los detalles
- **[README.md](README.md)** ← Descripción del proyecto
- **[RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md)** ← Visión general
- **[docs/](docs/)** ← Especificaciones técnicas y sprints

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

## 🎯 Próximos Pasos

1. ✅ Clonar repo
2. ✅ Copiar `.env.example` → `.env`
3. ✅ `docker compose up -d --build`
4. ✅ Abrir http://localhost:5173
5. ✅ Login con credenciales de prueba

Si encuentras problemas, consulta [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

---

**¡Listo para correr! 🎉**
