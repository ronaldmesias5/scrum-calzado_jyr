# � Cómo Correr el Proyecto CALZADO J&R
**Estado del Proyecto:** 50% MVP Completado | **Sprints Completados:** 5 de 10 | **Tablas BD:** 19 operacionales  
**Última Actualización:** 19 de Marzo 2026 | **Status:** ✅ En Desarrollo
---

## ✅ Requisitos Previos

- **Docker Desktop** instalado ([Descargar](https://www.docker.com/products/docker-desktop))
- **Git** instalado
- **4GB RAM** disponibles
- **2GB disco** disponibles

Verificar instalación:
```bash
docker --version
docker compose version
```

---

## 📝 PASO A PASO 

### PASO 1: Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd scrum
```

### PASO 2: Copiar el Archivo de Configuración
```bash
cp .env.example .env
```

Esto crea un archivo `.env` con los valores por defecto.

### PASO 3: Editar el Archivo .env (IMPORTANTE)

Abre el archivo `.env` en tu editor favorito y verifica/cambia estos valores:

```env
# BASE DE DATOS
DATABASE_URL=postgresql://jyr_user:password_jyr@db:5432/calzado_jyr
POSTGRES_USER=jyr_user
POSTGRES_PASSWORD=password_jyr
POSTGRES_DB=calzado_jyr

# BACKEND
SECRET_KEY=password_jyr_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# FRONTEND
VITE_API_URL=http://localhost:8000

# CORS
FRONTEND_URL=http://localhost:5173

# EMAIL (dejar como está o configurar con tu servidor SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=noreply@calzadojyr.com
```

**ℹ️ Para desarrollo local**: Los valores por defecto funcionan perfectamente. No necesitas cambiar nada.

**ℹ️ Para otra PC local**: Solo copia `.env.example` → `.env` y listo (Docker se encargará del resto).

**ℹ️ Para producción**: Cambiar `SECRET_KEY` a un valor seguro generado con: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

### PASO 4: Levantar el Proyecto

Desde la carpeta raíz del proyecto:

```bash
docker compose up --build
```

**Esperar 1-2 minutos** hasta ver este mensaje en los logs:
```
be_1  | ✅ Datos iniciales cargados exitosamente
frontend_1  | ✨ Servidor iniciado en http://localhost:5173
```

### PASO 5: Verificar que Todo Funciona

Abrir navegador:

| URL | Usuario | Contraseña |
|-----|---------|-----------|
| http://localhost:5173 | ronald.jefe@gmail.com | Test123456! |

Deberías ver la pantalla de login con el logo de "Calzado J&R".

---

## ⌨️ Comandos Principales

**Ver estado de los servicios:**
```bash
docker compose ps
```

**Ver logs en vivo:**
```bash
docker compose logs -f
```

**Detener todo:**
```bash
docker compose down
```

**Limpiar todo y empezar de nuevo:**
```bash
docker compose down -v
docker compose up --build
```

---

## 👤 Usuario Existente

**Jefe (Administrador)**
- Email: `ronald.jefe@gmail.com`
- Contraseña: `Test123456!`
- Rol: Empleado (con ocupación de Jefe)
- Estado: Activo y Validado

**Clientes de Prueba Disponibles**
- Email: `cliente1@gmail.com` | Contraseña: `Test123456!`
- Email: `cliente2@gmail.com` | Contraseña: `Test123456!`

---

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Base de Datos**: localhost:5432 (ver credenciales en `.env`)

---

## 📱 Endpoints Principales

**Autenticación**
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/change-password
```

**Usuarios**
```
GET /api/v1/users/me
GET /api/v1/users/pending-validation
```

**Admin**
```
POST /api/v1/admin/users/create-employee
POST /api/v1/admin/users/create-client
POST /api/v1/admin/users/validate/{id}
```

**Tipos de Documento**
```
GET /api/v1/type-documents
POST /api/v1/type-documents
```

Documentación completa en: http://localhost:8000/docs

---

## 🛠️ Stack Tecnológico


| Componente | Tecnología | Versión | Estado |
|-----------|-----------|---------|--------|
| **BD** | PostgreSQL | 17-alpine | ✅ Operativa (19 tablas) |
| **Backend** | FastAPI | 0.115+ | ✅ Corriendo |
| **ORM** | SQLAlchemy | 2.0+ | ✅ Funcional |
| **Frontend** | React | 19 | ✅ Corriendo |
| **Bundler** | Vite | 7.2+ | ✅ Compilando |
| **Estilos** | TailwindCSS | 4 | ✅ Aplicados |
| **Tipado** | TypeScript | 5.9+ | ✅ Estricto |
| **Router** | React Router | 7.13 | ✅ Implementado |
| **HTTP** | Axios | 1.13+ | ✅ Conectado |
| **Orquestación** | Docker Compose | 3.0+ | ✅ Sincronizado |

---

## 📋 Resumen Rápido (Quick Start)

```bash
# 1. Clonar y entrar
git clone <url-del-repositorio>
cd scrum

# 2. Crear .env
cp .env.example .env

# 3. Levantar todo
docker compose up --build

# 4. Esperar 1-2 minutos y abrir
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# Docs:     http://localhost:8000/docs

# 5. Login
# Email: ronald.jefe@gmail.com
# Contraseña: Test123456!
```

**¡Listo! El proyecto está corriendo en 4 pasos.** 🎉

### Funcionalidades Disponibles desde el Dashboard del Jefe:
- ✅ Crear empleados
- ✅ Crear clientes
- ✅ Validar usuarios
- ✅ Gestionar tipos de documento
- ✅ Ver catálogo (68 productos)
- ✅ Crear órdenes de pedidos
- ✅ Ajustar stock por talla/color
- ✅ Visualizar métricas y pedidos recientes

**Nota Importante**: Cuando se crea un nuevo usuario (empleado o cliente), ese usuario debe cambiar su contraseña en el primer login (campo `must_change_password=true`).

---

## 📊 Funcionalidades Implementadas (Sprints 1-5)

### Sprint 1-2: Autenticación y Validación ✅
- [x] Registro de usuarios
- [x] Login con JWT
- [x] Validación de usuarios por admin
- [x] Recuperación de contraseña

### Sprint 3: Catálogo y Dashboard Jefe ✅
- [x] Listado de productos (68 productos cargados)
- [x] Categorias, Marcas, Estilos
- [x] Dashboard del Jefe con métricas

### Sprint 4: Búsqueda y Filtros ✅
- [x] Búsqueda por nombre
- [x] Filtros por categoría
- [x] Filtros por marca
- [x] Filtros por rango de precios

### Sprint 5: Órdenes de Pedidos ✅
- [x] Creación de órdenes (8 pedidos cargados)
- [x] Estado de órdenes
- [x] Detalles de orden_details (86 líneas)

---

## ✅ Verificar que Todo Funciona

### Checklist Final
- [ ] `docker compose ps` muestra 3 servicios en estado "Up"
- [ ] Frontend carga en http://localhost:5173 (logo de "Calzado J&R")
- [ ] Backend responde en http://localhost:8000
- [ ] Login con `ronald.jefe@gmail.com` / `Test123456!` funciona correctamente
- [ ] Swagger API disponible en http://localhost:8000/docs
- [ ] Base de datos con 19 tablas sincronizadas
- [ ] Datos de prueba cargados (usuarios, productos, órdenes)

---

## 🔟 Endpoints Principales

### Autenticación
```
POST   /api/v1/auth/register        # Registro
POST   /api/v1/auth/login           # Login
POST   /api/v1/auth/refresh         # Refrescar token
POST   /api/v1/auth/logout          # Logout
POST   /api/v1/auth/change-password # Cambiar contraseña
```

### Usuarios
```
GET    /api/v1/users/me             # Perfil actual
GET    /api/v1/users/pending-validation  # Cuentas sin validar
```

### Admin
```
POST   /api/v1/admin/users/validate/{id}       # Validar usuario
POST   /api/v1/admin/users/create-employee     # Crear empleado
POST   /api/v1/admin/users/create-client       # Crear cliente
```

### Tipos de Documento
```
GET    /api/v1/type-documents       # Listar todos
POST   /api/v1/type-documents       # Crear
PUT    /api/v1/type-documents/{id}  # Actualizar
DELETE /api/v1/type-documents/{id}  # Eliminar
```

### Dashboard
```
GET    /api/v1/dashboard/admin/metrics  # Métricas
GET    /api/v1/dashboard/admin/orders   # Pedidos recientes
```

### Productos (Catálogo Admin)
```
GET    /api/v1/admin/catalog/products          # Listar productos
POST   /api/v1/admin/catalog/products          # Crear producto
PUT    /api/v1/admin/catalog/products/{id}     # Actualizar producto
DELETE /api/v1/admin/catalog/products/{id}     # Eliminar producto
```

### Órdenes (Pedidos)
```
GET    /api/v1/admin/orders                    # Listar órdenes
POST   /api/v1/admin/orders                    # Crear orden
GET    /api/v1/admin/orders/{id}               # Obtener detalle
PATCH  /api/v1/admin/orders/{id}/status        # Cambiar estado
DELETE /api/v1/admin/orders/{id}               # Eliminar orden
```

### Inventario (Ajuste de Stock)
```
GET    /api/v1/admin/catalog/inventory         # Listar inventario
POST   /api/v1/admin/catalog/inventory         # Crear/actualizar por talla
POST   /api/v1/admin/catalog/inventory/bulk    # Actualizar múltiples tallas
DELETE /api/v1/admin/catalog/inventory/{id}    # Eliminar inventario
```

**Documentación interactiva completa**: http://localhost:8000/docs (Swagger)

---
