# Sistema de Gestión y Producción de Calzado - CALZADO J&R

**Proyecto Scrum Modular - 10 Sprints**

---

## 📋 Descripción General

Sistema completo de gestión y producción de calzado con 3 dashboards especializados:
- **Dashboard Jefe**: Validación de cuentas, gestión de catálogo, revisión de pedidos
- **Dashboard Empleados**: Visualización de tareas asignadas, confirmación de finalización
- **Dashboard Clientes**: Visualización de catálogo, realización de pedidos, seguimiento

---

## 🏗️ Estructura del Proyecto

```
scrum/
├── be/                          # Backend - FastAPI + Python
│   ├── app/
│   │   ├── modules/             # 📦 Módulos funcionales (feature-based)
│   │   │   ├── auth/            # 🔐 Autenticación
│   │   │   ├── admin/           # 👨‍💼 Administración
│   │   │   ├── users/           # 👤 Usuarios
│   │   │   ├── type-document/   # 📋 Tipos de documento
│   │   │   ├── dashboard-jefe/  # 👨‍💼 Dashboard Jefe
│   │   │   ├── dashboard-empleados/ # 👷 Dashboard Empleados
│   │   │   ├── dashboard-clientes/  # 🛒 Dashboard Clientes
│   │   │   └── landing/         # 🏠 Página inicial
│   │   │
│   │   ├── shared/              # 🔄 Recursos compartidos
│   │   │   ├── models/          # Modelos base
│   │   │   ├── schemas/         # Schemas globales
│   │   │   ├── utils/           # Funciones auxiliares
│   │   │   ├── exceptions/      # Excepciones
│   │   │   └── dependencies.py  # Dependencias globales
│   │   │
│   │   ├── config.py            # Configuración
│   │   ├── database.py          # Conexión BD
│   │   └── main.py              # Punto de entrada
│   ├── tests/                   # Tests unitarios e integración
│   ├── alembic/                 # Migraciones de BD
│   └── requirements.txt          # Dependencias Python
│
├── fe/                          # Frontend - React + TypeScript
│   ├── src/
│   │   ├── modules/             # 📦 Módulos funcionales (feature-based)
│   │   │   ├── auth/            # 🔐 Autenticación (Sprint 1-2)
│   │   │   │   ├── pages/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── RegisterPage.tsx
│   │   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   │   ├── ResetPasswordPage.tsx
│   │   │   │   │   └── ChangePasswordPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── PasswordForm.tsx
│   │   │   │   ├── services/
│   │   │   │   │   └── authService.ts
│   │   │   │   └── hooks/
│   │   │   │       └── useAuth.ts
│   │   │   │
│   │   │   ├── landing/         # 🏠 Página inicial (Sprint 3)
│   │   │   │   ├── pages/
│   │   │   │   │   └── LandingPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── Hero.tsx
│   │   │   │       ├── Features.tsx
│   │   │   │       └── CatalogPreview.tsx
│   │   │   │
│   │   │   ├── dashboard-jefe/  # 👨‍💼 Dashboard Jefe (Sprint 3+)
│   │   │   │   ├── pages/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── ClientsPage.tsx
│   │   │   │   │   ├── ProductsPage.tsx
│   │   │   │   │   └── OrdersPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── ClientValidation/
│   │   │   │       ├── ProductCatalog/
│   │   │   │       ├── OrderManagement/
│   │   │   │       └── Stats/
│   │   │   │
│   │   │   ├── dashboard-empleados/  # 👷 Dashboard Empleados (Sprint 7+)
│   │   │   │   ├── pages/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── TasksPage.tsx
│   │   │   │   │   └── ProductionPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── TaskList/
│   │   │   │       ├── TaskDetail/
│   │   │   │       └── ProgressTracker/
│   │   │   │
│   │   │   └── dashboard-clientes/   # 🛒 Dashboard Clientes (Sprint 4+)
│   │   │       ├── pages/
│   │   │       │   ├── DashboardPage.tsx
│   │   │       │   ├── CatalogPage.tsx
│   │   │       │   ├── OrdersPage.tsx
│   │   │       │   └── OrderDetailPage.tsx
│   │   │       └── components/
│   │   │           ├── Catalog/
│   │   │           │   ├── ProductCard.tsx
│   │   │           │   ├── SearchFilter.tsx
│   │   │           │   └── ProductGrid.tsx
│   │   │           ├── Orders/
│   │   │           │   ├── OrderForm.tsx
│   │   │           │   ├── OrderList.tsx
│   │   │           │   └── OrderStatus.tsx
│   │   │           └── Favorites/
│   │   │               └── FavoritesList.tsx
│   │   │
│   │   ├── shared/              # 🔄 Recursos Compartidos
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── AuthLayout.tsx
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Alert.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── LoadingSpinner.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── services/
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── axios.ts
│   │   │   │   │   └── type-documents.ts
│   │   │   │   └── storage.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useApi.ts
│   │   │   │   └── useLocalStorage.ts
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── authContextDef.ts
│   │   │   ├── types/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── product.ts
│   │   │   │   └── order.ts
│   │   │   └── styles/
│   │   │       └── index.css
│   │   │
│   │   ├── App.tsx              # Componente raíz
│   │   └── main.tsx             # Punto de entrada
│   │
│   ├── public/                  # Archivos estáticos
│   ├── package.json             # Dependencias Node
│   ├── vite.config.ts           # Configuración Vite
│   └── tsconfig.json            # Configuración TypeScript
│
├── db/                          # Base de datos
│   ├── init/                    # Scripts de inicialización
│   └── postgres/                # Volumen de persistencia
│
├── docs/                        # Documentación Scrum
│   ├── project-documentation/   # 📚 Documentación del Proyecto
│   │   ├── historias_de_usuario.md
│   │   ├── plan_de_trabajo.md
│   │   ├── arquitectura_proyecto.md
│   │   ├── estructura_modular.md
│   │   ├── estado_proyecto.md
│   │   └── basededatos.drawio.png
│   └── sprints/                 # 📋 Backlogs de Sprints
│       ├── backlog_sprint_1.md  # Sprint 1: Autenticación
│       └── backlog_sprint_2.md  # Sprint 2: Gestión de Cuentas
│
├── docker-compose.yml           # Orquestación de contenedores
├── .env.example                 # Variables de ejemplo
└── .gitignore

```

---

## 🎯 Plan de Sprints (10 Sprints = 150 días)

| Sprint | Duración | Historias | Módulo Principal |
|--------|----------|-----------|-----------------|
| **1** | Días 1-15 | HU-001, HU-003 | auth (Registro, Login) |
| **2** | Días 16-30 | HU-002, HU-004 | auth (Validación, Recuperación) |
| **3** | Días 31-45 | HU-006, HU-009 | dashboard-jefe, landing |
| **4** | Días 46-60 | HU-010, HU-011 | dashboard-clientes |
| **5** | Días 61-75 | HU-012, HU-014 | dashboard-clientes |
| **6** | Días 76-90 | HU-015, HU-016 | Producción e Inventario |
| **7** | Días 91-105 | HU-022, HU-024 | dashboard-empleados |
| **8** | Días 106-120 | HU-029, HU-030 | Notificaciones |
| **9** | Días 121-135 | HU-025, HU-026 | dashboard-empleados |
| **10** | Días 136-150 | HU-031, HU-033 | Reportes |

---

## 🛠️ Stack Tecnológico

### Backend
- **Python 3.12+**
- **FastAPI** - Framework web asincrónico
- **SQLAlchemy 2.0** - ORM
- **Alembic** - Migraciones de BD
- **JWT** - Autenticación

### Frontend
- **React 18+**
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **TailwindCSS 4+** - Estilos
- **React Router** - Rutas

### Base de Datos
- **PostgreSQL 17+**
- **Docker Compose** - Orquestación

### Testing
- **pytest** + **httpx** (Backend)
- **Vitest** + **Testing Library** (Frontend)

---

## 🚀 Inicio Rápido

### 1. Clonar y configurar

```bash
cd scrum
cp .env.example .env
```

### 2. Levantar contenedores

```bash
docker-compose up -d
```

### 3. Backend


```bash
cd be
uv pip install --system --no-cache -r requirements.txt
uv run uvicorn app.main:app --reload
```

Estará disponible en: `http://localhost:8000`


### 4. Frontend

```bash
cd fe
pnpm install
pnpm run dev
```

Estará disponible en: `http://localhost:5173`

---

## 📚 Documentación de Módulos

### 🔐 Módulo de Autenticación (`fe/src/modules/auth/`)

Cubre las historias:
- **HU-001**: Creación de Cuentas
- **HU-003**: Inicio de Sesión
- **HU-004**: Recuperación de Contraseña
- **HU-002**: Validación de Cuentas (Backend)

**Archivos principales:**
- `pages/LoginPage.tsx` - Pantalla de login
- `pages/RegisterPage.tsx` - Pantalla de registro
- `pages/ForgotPasswordPage.tsx` - Recuperación de contraseña
- `pages/ResetPasswordPage.tsx` - Resetear contraseña
- `pages/ChangePasswordPage.tsx` - Cambiar contraseña
- `services/` - Llamadas a API de autenticación
- `hooks/` - Lógica reutilizable de auth

**Ver documentación completa en:** [docs/sprints/backlog_sprint_1.md](docs/sprints/backlog_sprint_1.md)

---

### 🏠 Módulo de Landing Page (`fe/src/modules/landing/`)

Página inicial pública sin requerir autenticación.

**Historias cubiertas:** (Sprint 3)
- Catálogo público básico
- Información general de la empresa

---

### 👨‍💼 Dashboard Jefe (`fe/src/modules/dashboard-jefe/`)

Panel administrativo para el jefe de la empresa.

**Historias cubiertas:**
- **HU-002**: Validación y Activación de Cuentas (Sprint 2)
- **HU-006**: Creación de Catálogo (Sprint 3)
- **HU-007**: Clasificación por Categorías (Sprint 3)
- **HU-008**: Gestión de Marcas y Estilos (Sprint 3)

---

### 👷 Dashboard Empleados (`fe/src/modules/dashboard-empleados/`)

Panel para empleados de producción.

**Historias cubiertas:**
- **HU-022**: Asignación de Tareas de Producción (Sprint 7)
- **HU-025**: Confirmación de Finalización de Tareas (Sprint 9)
- **HU-026**: Notificación de Tareas Completadas (Sprint 9)

---

### 🛒 Dashboard Clientes (`fe/src/modules/dashboard-clientes/`)

Panel para clientes mayoristas.

**Historias cubiertas:**
- **HU-010**: Consulta de Catálogo (Sprint 4)
- **HU-011**: Sistema de Filtrado (Sprint 4)
- **HU-012**: Realización de Pedidos (Sprint 5)
- **HU-014**: Consulta de Estado de Pedidos (Sprint 5)

---

### 🔗 Módulo Compartido (`fe/src/shared/`)

Recursos reutilizables en toda la aplicación.

**Contiene:**
- `components/` - Componentes UI reutilizables
- `services/` - Cliente HTTP (axios) y funciones de API
- `hooks/` - Hooks React reutilizables
- `context/` - Contextos globales (AuthContext)
- `styles/` - Estilos CSS globales

---

## 📖 Historias de Usuario

Consulta el documento completo de historias en:
[docs/historias_de_usuario.md](docs/historias_de_usuario.md)

---

## 📝 Backlogs por Sprint

- [Sprint 1 - Autenticación](docs/sprints/backlog_sprint_1.md)
- [Sprint 2 - Gestión de Cuentas](docs/sprints/backlog_sprint_2.md)
- [Sprint 3-10](docs/plan_de_trabajo.md) - Por crear

---

## 🔧 Arquitectura de Backend

### Estructura de carpetas - `be/app/`

```
be/app/
├── models/           # Modelos SQLAlchemy
├── routers/          # Rutas FastAPI por módulo
├── schemas/          # Schemas Pydantic (request/response)
├── services/         # Lógica de negocio
├── utils/            # Funciones auxiliares
├── middleware/       # JWT, CORS, etc
├── config/           # Configuración
└── database.py       # Conexión a BD
```

### Endpoints API

#### Autenticación
```
POST /api/v1/auth/register       - Registro de usuario
POST /api/v1/auth/login          - Iniciar sesión
POST /api/v1/auth/logout         - Cerrar sesión
POST /api/v1/auth/forgot-password - Solicitar recuperación
POST /api/v1/auth/reset-password  - Resetear contraseña
```

#### Administración (Protegido)
```
GET  /api/v1/admin/clients/pending          - Clientes pendientes
PATCH /api/v1/admin/clients/{id}/validate  - Validar cliente
```

---

## 🗄️ Base de Datos

Diagrama ER disponible en: [docs/diagrama ER.drawio](docs/)

**Tablas principales:**
- `users` - Usuarios del sistema
- `roles` - Roles (jefe, empleado, cliente)
- `products` - Catálogo de productos
- `orders` - Pedidos
- `order_details` - Detalle de pedidos
- `tasks` - Tareas de producción
- `inventory` - Inventario

---

## 🧪 Testing

### Backend
```bash
cd be
pytest tests/
```


### Frontend
```bash
cd fe
pnpm run test
```

---

## 🐳 Docker

### Levantar todo
```bash
docker-compose up -d
```

### Servicios disponibles
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Docs API**: http://localhost:8000/docs

### Detener
```bash
docker-compose down
```

---

## 👥 Equipo

- **Ronald** - Arquitecto
- **Andrés** - Scrum Master
- **Santiago** - Bases de Datos

---

## 📚 Recursos

- [Historias de Usuario Completas](docs/historias_de_usuario.md)
- [Plan de Trabajo](docs/plan_de_trabajo.md)
- [Arquitectura del Proyecto](docs/arquitectura_proyecto.md)

---
