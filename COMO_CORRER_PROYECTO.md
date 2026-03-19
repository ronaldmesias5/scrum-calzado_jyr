# � Cómo Correr el Proyecto CALZADO J&R

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
FRONTEND_URL=http://localhost

# EMAIL (dejar como está o configurar con tu servidor SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=noreply@calzadojyr.com
```

**Para desarrollo local**: Los valores por defecto funcionan. Solo cambiar si necesitas usar puertos diferentes.

**Para producción**: Cambiar `SECRET_KEY` a un valor seguro aleatorio.

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

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| BD | PostgreSQL | 17 |
| Backend | FastAPI | 0.115+ |
| ORM | SQLAlchemy | 2.0+ |
| Frontend | React | 19 |
| Bundler | Vite | 7.2 |
| CSS | TailwindCSS | 4 |
| TypeScript | TS | 5.9 |
| Router | React Router | 7.13 |
| HTTP Client | Axios | 1.13 |
| Containerización | Docker | Compose 3.0+ |

---

## ✅ Resumen

1. `git clone` + `cd scrum`
2. `cp .env.example .env`
3. Editar `.env` (cambiar valores si es necesario)
4. `docker compose up --build`
5. Esperar 1-2 minutos
6. Abrir http://localhost:5173
7. Login: `ronald.jefe@gmail.com` / `Test123456!`

**¡Listo! El proyecto está corriendo.**

Desde el dashboard del Jefe puedes:
└── Crear empleados
└── Crear clientes
└── Gestionar tipos de documento
└── Ver métricas y pedidos

**Nota**: Cuando se crea un nuevo usuario (empleado o cliente), debe cambiar contraseña en el primer login (campo `must_change_password=true`).

---

## 8️⃣ Verificar que Todo Funciona

### Checklist
- [ ] `docker compose ps` muestra 3 servicios en estado "Up"
- [ ] Frontend carga en http://localhost:5173 (logo de "Calzado J&R")
- [ ] Login con `ronald.jefe@gmail.com` / `Test123456!` funciona correctamente

---

## 🛠️S** | TailwindCSS | 4 |
| **HTTP Client** | Axios | 1.13.4 |
| **Router** | React Router | 7.13 |
| **Language** | TypeScript | 5.9 |
| **Security** | JWT + bcrypt | HS256 |
| **Containerización** | Docker Compose | 3.0+ |

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

**Documentación interactiva**: http://localhost:8000/docs (Swagger)

---
