# Sistema de Gestión y Producción de Calzado - CALZADO J&R

---

## 📋 Descripción General

Sistema integral para la gestión y producción de calzado, diseñado con una arquitectura modular para escalar eficientemente.

**Dashboards implementados:**
- **Dashboard Jefe**: Supervisión total (14 páginas), validación de clientes, gestión de empleados, catálogo, pedidos, inventario, insumos, tareas de producción, incidencias (scrap, pérdidas, pendientes), reportes con PDF export, alertas.
- **Dashboard Empleados**: Operativo (6 páginas) — tareas disponibles, mis tareas, incidencias (maquinaria, producto), reportes de rendimiento con PDF export, configuración de perfil con avatar.
- **Dashboard Clientes**: Operativo (6 páginas) — dashboard, catálogo mayorista, pedidos, reportes, incidencias, configuración.

**Estado actual:** Sprints 1-7 completados. Sprints 8-16 con funcionalidad en código. Notificaciones, incidencias, vales de producción, y badges de conteo implementados.

---

## 🏗️ Estructura del Proyecto

```text
scrum/
├── be/                          # 🐍 Backend - FastAPI + Python (uv)
│   ├── app/
│   │   ├── core/                # Configuración, BD, dependencias y seguridad
│   │   ├── init_db.py           # Auto-migraciones + seed data al arrancar
│   │   ├── models/              # Modelos SQLAlchemy (23 modelos)
│   │   ├── routers/             # 📦 21 routers FastAPI
│   │   │   ├── admin.py         # Catálogo admin, reportes, usuarios, creación sin contraseña
│   │   │   ├── auth.py          # Login, registro, JWT, logout global, cambio de contraseña
│   │   │   ├── catalog*.py      # Catálogo público (5 routers: catalog, products, brands, styles, inventory)
│   │   │   ├── client.py        # Dashboard cliente y pedidos
│   │   │   ├── dashboard_*.py   # Dashboards jefe/empleado (5 routers)
│   │   │   ├── notifications.py # Notificaciones en tiempo real (WebSocket)
│   │   │   ├── orders*.py       # Pedidos + producción + vales (3 routers)
│   │   │   ├── scrap.py         # Incidencias (scrap, pérdidas, pendientes)
│   │   │   ├── supplies.py      # Insumos y movimientos
│   │   │   ├── reports.py       # Reportes admin (dashboard, empleados, clientes, producción)
│   │   │   ├── type_document.py # Tipos de documento
│   │   │   └── users.py         # CRUD usuarios + avatar upload
│   │   ├── controllers/         # Capa de controladores (14 archivos)
│   │   ├── services/            # Servicios de negocio (8 archivos)
│   │   ├── schemas/             # Esquemas Pydantic (13 archivos)
│   │   ├── middleware/          # Rate limiting, error handling, security headers
│   │   ├── utils/               # Email SMTP (Gmail + Mailpit), seguridad, crypto
│   │   └── main.py              # Punto de entrada
│   ├── alembic/versions/        # 42 migraciones versionadas
│   ├── scripts/                 # create_admin.py, heal_line_groups.py
│   └── pyproject.toml           # Dependencias (uv)
│
├── fe/                          # ⚛️ Frontend - React 19 + TypeScript (Vite + pnpm)
│   ├── src/
│   │   ├── app/                  # Entry points (App.tsx, main.tsx, i18n.ts, ProtectedRoute, RoleProtectedRoute)
│   │   ├── assets/               # Recursos estáticos
│   │   ├── components/           # Componentes UI reutilizables
│   │   │   ├── atoms/            # Átomos globales (Button, Modal, Toast, PageTransition, Pagination…)
│   │   │   └── layout/           # Layouts globales (AppLayout, AuthLayout…)
│   │   ├── features/             # Features de negocio (Atomic Design por feature)
│   │   │   ├── admin/            # Panel admin (14 páginas) — components/{atoms,molecules,organisms}, utils/reportsUtils.ts
│   │   │   ├── auth/             # Login, Register, Password Reset — components/{molecules,organisms}
│   │   │   ├── client/           # Panel cliente — components/{molecules,organisms}
│   │   │   ├── employee/         # Panel empleado (6 páginas) — components/{molecules,organisms}, utils/reportsUtils.ts
│   │   │   └── landing/          # Landing pública + catálogo — components/{atoms,molecules,organisms}, config/whatsappConfig.ts
│   │   ├── pages/                # Páginas enrutables: admin(14), auth(7), client(6), employee(6), public(2)
│   │   ├── hooks/                # Hooks reutilizables
│   │   ├── services/             # Servicios de API globales
│   │   ├── store/                # Contextos globales (Auth, Theme, Toast, BadgeCounts, EmployeeBadgeCounts)
│   │   ├── types/                # Tipos TypeScript compartidos
│   │   ├── utils/                # Utilidades
│   │   ├── styles/               # Estilos globales (TailwindCSS)
│   │   └── locales/              # Traducciones (en, es)
│   ├── package.json             # pnpm (nunca npm/yarn)
│   └── vite.config.ts           # Proxy API, polling, aliases
│
├── db/                          # 🗄️ Base de Datos
│   └── init/                    # init.sql — solo extensiones (no esquema)
│
├── docs/                        # 📚 Documentación
│   ├── project-documentation/   # Arquitectura, diccionario datos, requisitos, presentación
│   └── sprints/                 # Backlogs de 16 sprints y plan de trabajo
│
├── .opencode/                   # Configuración opencode
│   └── skills/                  # Skills personalizadas
│       └── doc-sync/            # Sincronización automática de docs
│
├── .agents/skills/              # 8 skills externas (accessibility, seo, etc.)
├── docker-compose.yml           # db + be + fe + mailpit
├── opencode.json                # Configuración agente AI
└── .env.example                 # Variables de entorno
```

---

## 🛠️ Stack Tecnológico

### 🐍 Backend

- **FastAPI**: Alto rendimiento y validación automática con Pydantic.
- **Python 3.12+ (uv)**: Gestión de paquetes moderna y veloz.
- **SQLAlchemy 2.0**: ORM robusto con tipado estático.
- **JWT (python-jose)**: Autenticación segura con versionado de sesiones (Logout Global).

### ⚛️ Frontend

- **React 19+ (Vite)**: Interfaz reactiva y rápida, con polling para Docker en Windows.
- **TypeScript**: Seguridad en tiempo de desarrollo.
- **TailwindCSS 4**: Diseño premium, moderno y responsive.
- **Lucide Icons**: Iconografía profesional.

### 🗄️ Infraestructura y Base de Datos

- **PostgreSQL 17+**: Base de datos relacional robusta.
- **Docker / Docker Compose**: Despliegue consistente en cualquier entorno (db + be + fe + mailpit).
- **Mailpit**: Captura de correos en desarrollo en http://localhost:8025

---

## 🚀 Inicio Rápido (Local)

### 1. Variables de Entorno

```bash
cp .env.example .env
```

### 2. Infraestructura (Docker)

Levante la base de datos y/o todo el entorno:
```bash
docker compose up -d
```

### 3. Backend (Vía uv)

```bash
cd be
uv sync
uv run uvicorn app.main:app --reload
```
*API Docs:* `http://localhost:8000/docs`

### Mailpit (Correos en desarrollo)

Los correos no se envían realmente en desarrollo. Captúralos en:
- **Web UI**: http://localhost:8025

### Gmail SMTP (Correos reales)

Configurar en `.env`:
```env
MAIL_USERNAME=jyrcalzado@gmail.com
MAIL_PASSWORD=tu_app_password_16_caracteres
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```
Generar App Password en: https://myaccount.google.com/apppasswords

### 4. Frontend (Vía pnpm)

```bash
cd fe
pnpm install
pnpm run dev
```
*App URL:* `http://localhost:5173`

---

## 🔐 Credenciales de Prueba (Default)

Al iniciar por primera vez, el sistema autosemilla un usuario administrador:

**Jefe/Admin (acceso completo al dashboard):**
- **Email**: `ronald.jefe@gmail.com`
- **Contraseña**: `Test123456!`

---

## 👥 Equipo y Autores
- **Ronald Mesias** - Líder de Proyecto / Arquitecto FullStack
- **Andrés** - Scrum Master
- **Santiago** - DB / Infra

---

© 2026 CALZADO J&R - Calidad y Estilo en cada paso.
