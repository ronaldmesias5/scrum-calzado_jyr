# Arquitectura del Proyecto - Sistema de Gestión y Producción de Calzado - CALZADO J&R

**Arquitecto:** Ronald Guerrero  
**Última Actualización:** 9 de Mayo de 2026  
**Estado:** ✅ MVP Fase 1 (Sprints 1-5) | 🔄 En desarrollo (Sprints 6-7)

---

## 🎯 Resumen Arquitectónico

El sistema implementa una **arquitectura 3-tier (Presentación - Lógica - Datos)** con separación clara de responsabilidades y patrones modernos de desarrollo web. El diseño prioriza **escalabilidad, seguridad y mantenibilidad** usando container-based deployment.

```
                    ┌─────────────────────────────────┐
                    │    Frontend (React + TS)        │
                    │  - SPA con routing dinámico     │
                    │  - Context API + Hooks          │
                    └────────────┬────────────────────┘
                                 │ HTTP/HTTPS (JWT)
                    ┌────────────▼────────────────────┐
                    │  Backend (FastAPI + Python)     │
                    │  - REST API asincrónica         │
                    │  - 8 routers modulares          │
                    │  - Middleware (auth, CORS,      │
                    │    rate-limit, security)        │
                    └────────────┬────────────────────┘
                                 │ SQL/TCP
                    ┌────────────▼────────────────────┐
                    │  PostgreSQL 17 + Docker         │
                    │  - 19 tablas + audit columns    │
                    │  - Triggers y constraints       │
                    └─────────────────────────────────┘
```

---

## Stack Tecnológico - Verificado ✅

### Backend (BE)

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Python** | 3.12-slim | Runtime principal del servidor |
| **FastAPI** | 0.115.0+ | Framework HTTP asincrónico con validación automática |
| **SQLAlchemy** | 2.0+ | ORM para mapeo objeto-relacional |
| **Alembic** | 1.14.0 | Sistema de migraciones de BD |
| **Pydantic** | 2.0+ | Validación y serialización de datos |
| **PyJWT** | 2.8+ | Creación y validación de JWT tokens |
| **bcrypt** | 4.2+ | Hash criptográfico de contraseñas |
| **python-dotenv** | 1.0+ | Variables de entorno desde .env |
| **psycopg2** | 2.9+ | Driver PostgreSQL para Python |

### Frontend (FE)

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 20+ LTS | Runtime de JavaScript |
| **pnpm** | 8+ | Gestor de dependencias rápido |
| **React** | 19 | Librería de UI declarativa |
| **React Router** | 6+ | Enrutamiento de páginas (SPA) |
| **TypeScript** | 5+ | Lenguaje tipado que compila a JS |
| **Vite** | 7.3.1+ | Build tool y dev server ultra rápido |
| **Tailwind CSS** | 4+ | Utilidad CSS responsive |
| **Axios** | 1.7+ | Cliente HTTP para API calls |
| **React Context** | Nativa | State management sin Redux |

### Base de Datos

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **PostgreSQL** | 17-alpine | SGBD relacional open-source |
| **Docker** | 27+ | Containerización de servicios |
| **Docker Compose** | 2.27+ | Orquestación local 3 contenedores |

### Testing (Implementado)

| Capa | Herramientas | Descripción |
|-----|-------------|-----------|
| **Backend** | pytest + httpx | Tests unitarios e integración |
| **Frontend** | Vitest + React Testing Library | Tests componentes y utilidades |

---

## Estructura del Proyecto

```
scrum/
│
├── 📚 docs/                 # Documentación Scrum
│   ├── historias_de_usuario.md      # 14 historias detalladas
│   ├── plan_de_trabajo.md           # Plan de 10 sprints
│   ├── arquitectura_proyecto.md     # Stack tecnológico
│   └── sprints/                     # Backlogs por sprint
│       ├── backlog_sprint_1.md
│       ├── backlog_sprint_2.md
│       └── ... (hasta sprint_10.md)
│
├── 🚀 be/                           # Backend - FastAPI + Python
│   ├── app/
│   │   ├── modules/                 # 📦 Módulos (feature-based)
│   │   │   ├── auth/                # 🔐 Autenticación
│   │   │   │   ├── routers/
│   │   │   │   │   └── auth.py
│   │   │   │   ├── services/
│   │   │   │   │   └── auth_service.py
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── admin/               # 👨‍💼 Administración
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── users/               # 👤 Gestión de Usuarios
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── type-document/       # 📋 Tipos de Documento
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── dashboard-jefe/      # 👨‍💼 Dashboard Jefe (Sprint 3+)
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── dashboard-empleados/ # 👷 Dashboard Empleados (Sprint 7+)
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   ├── dashboard-clientes/  # 🛒 Dashboard Clientes (Sprint 4+)
│   │   │   │   ├── routers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── schemas/
│   │   │   │
│   │   │   └── landing/             # 🏠 Página Inicial (Sprint 3)
│   │   │       ├── routers/
│   │   │       ├── services/
│   │   │       ├── models/
│   │   │       └── schemas/
│   │   │
│   │   ├── shared/                  # 🔄 Recursos Compartidos
│   │   │   ├── models/              # Modelos base
│   │   │   ├── schemas/             # Schemas globales
│   │   │   ├── utils/
│   │   │   │   ├── security.py
│   │   │   │   ├── validators.py
│   │   │   │   └── email.py
│   │   │   ├── exceptions/
│   │   │   │   └── custom_exceptions.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── config.py                # Configuración global
│   │   ├── database.py              # Conexión a BD
│   │   └── main.py                  # Punto de entrada
│   │
│   ├── tests/                       # Tests unitarios e integración
│   ├── alembic/                     # Migraciones de BD
│   ├── requirements.txt             # Dependencias Python
│   └── Dockerfile
│
├── 💻 fe/                           # Frontend - React + TypeScript
│   ├── src/
│   │   ├── modules/                 # 📦 Módulos (feature-based)
│   │   │   ├── auth/                # 🔐 Autenticación (Sprint 1-2)
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
│   │   │   ├── landing/             # 🏠 Página Inicial (Sprint 3)
│   │   │   │   ├── pages/
│   │   │   │   │   └── LandingPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── Hero.tsx
│   │   │   │       ├── Features.tsx
│   │   │   │       └── CatalogPreview.tsx
│   │   │   │
│   │   │   ├── dashboard-jefe/      # 👨‍💼 Dashboard Jefe (Sprint 3+)
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
│   │   │   ├── dashboard-empleados/ # 👷 Dashboard Empleados (Sprint 7+)
│   │   │   │   ├── pages/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── TasksPage.tsx
│   │   │   │   │   └── ProductionPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── TaskList/
│   │   │   │       ├── TaskDetail/
│   │   │   │       └── ProgressTracker/
│   │   │   │
│   │   │   └── dashboard-clientes/  # 🛒 Dashboard Clientes (Sprint 4+)
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
│   │   ├── shared/                  # 🔄 Recursos Compartidos
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── AuthLayout.tsx
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Alert.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       └── LoadingSpinner.tsx
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
│   │   ├── App.tsx                  # Componente raíz
│   │   └── main.tsx                 # Punto de entrada
│   │
│   ├── public/                      # Archivos estáticos
│   ├── package.json                 # Dependencias Node
│   ├── vite.config.ts               # Configuración Vite
│   ├── tsconfig.json                # Configuración TypeScript
│   ├── Dockerfile
│   └── nginx.conf
│
├── 🗄️ db/                           # Base de Datos
│   ├── init/                        # Scripts de inicialización SQL
│   │   ├── 01_create_tables.sql
│   │   ├── 02_triggers_and_indexes.sql
│   │   └── 99_seed_type_documents.sql
│   └── postgres/                    # Volumen persistente
│
├── docker-compose.yml               # Orquestación de contenedores
├── .env.example                     # Variables de ejemplo
├── .gitignore                       # Archivos ignorados
├── README.md                        # Guía principal
├── ESTRUCTURA_MODULAR.md            # Documentación de estructura
├── GUIA_RAPIDA.md                  # Referencia rápida
└── PROYECTO_STATUS.md              # Estado del proyecto

```

---

## Arquitectura Modular - Backend y Frontend

### Backend (Feature-Based Modules)

El backend está organizado en módulos por feature, cada uno con sus propias capas:

**Estructura de un módulo:**
```
be/app/modules/{nombre}/
├── routers/       # Endpoints FastAPI
├── services/      # Lógica de negocio
├── models/        # Modelos SQLAlchemy
└── schemas/       # Schemas Pydantic
```

**Módulos principales:**
- **auth/** - Autenticación, login, registro, recuperación de contraseña
- **admin/** - Funciones administrativas
- **dashboard-jefe/** - Panel de administrador con gestión de clientes, productos, pedidos
- **dashboard-empleados/** - Panel de empleados con tareas y producción
- **dashboard-clientes/** - Panel de clientes con catálogo y pedidos
- **landing/** - Página pública de inicio

**Shared (recursos comunes):**
```
be/app/shared/
├── models/        # Modelos base (User, Role, etc)
├── schemas/       # Schemas globales
├── utils/         # Funciones reutilizables (security, email, validators)
├── exceptions/    # Excepciones personalizadas
└── dependencies.py # Dependencias inyectadas
```

---

### Frontend (Feature-Based Modules)

El frontend también está organizado en módulos por feature, con estructura consistente:

**Estructura de un módulo:**
```
fe/src/modules/{nombre}/
├── pages/         # Componentes de página
├── components/    # Componentes reutilizables del módulo
├── services/      # Llamadas a API del módulo
└── hooks/         # Hooks personalizados del módulo
```
