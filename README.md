# Sistema de Gestión y Producción de Calzado - CALZADO J&R

---

## 📋 Descripción General

Sistema integral para la gestión y producción de calzado, diseñado con una arquitectura modular para escalar eficientemente.

**Dashboards implementados:**
- **Dashboard Jefe**: Supervisión total (14 páginas), validación de clientes, gestión de empleados, catálogo, pedidos, inventario, insumos, tareas de producción, incidencias (scrap, pérdidas, pendientes), reportes con PDF export, alertas.
- **Dashboard Empleados**: Operativo (6 páginas) — tareas disponibles, mis tareas, incidencias (maquinaria, producto), reportes de rendimiento con PDF export, configuración de perfil con avatar.
- **Dashboard Clientes**: Operativo (2 páginas) — dashboard y consulta de pedidos.

**Estado actual:** Sprints 1-7 completados. Sprints 8-16 con funcionalidad en código. Notificaciones, incidencias, vales de producción, y badges de conteo implementados.

---

## 🏗️ Estructura del Proyecto

```text
scrum/
├── be/                          # 🐍 Backend - FastAPI + Python (uv)
│   ├── app/
│   │   ├── core/                # Configuración, BD, dependencias y seguridad
│   │   ├── init_db.py           # Auto-migraciones + seed data al arrancar
│   │   ├── models/              # Modelos SQLAlchemy (23 tablas)
│   │   ├── modules/             # 📦 12 módulos feature-based
│   │   │   ├── admin/           # Catálogo admin, reportes, usuarios, creación sin contraseña
│   │   │   ├── auth/            # Login, registro, JWT, logout global, cambio de contraseña
│   │   │   ├── catalog/         # Catálogo público
│   │   │   ├── client/          # Dashboard cliente y pedidos
│   │   │   ├── dashboard_empleado/  # Tareas, incidencias, métricas empleado
│   │   │   ├── dashboard_jefe/  # Métricas y dashboard principal
│   │   │   ├── notifications/   # Notificaciones en tiempo real (WebSocket)
│   │   │   ├── orders/          # Pedidos + producción + vales + line_group
│   │   │   ├── scrap/           # Incidencias (scrap, pérdidas, pendientes)
│   │   │   ├── supplies/        # Insumos y movimientos
│   │   │   ├── type_document/   # Tipos de documento
│   │   │   └── users/           # CRUD usuarios + avatar upload
│   │   ├── utils/               # Email SMTP con aiosmtplib (Gmail + Mailpit)
│   │   └── main.py              # Punto de entrada
│   ├── alembic/versions/        # 37 migraciones versionadas
│   ├── scripts/                 # create_admin.py, heal_line_groups.py
│   └── pyproject.toml           # Dependencias (uv)
│
├── fe/                          # ⚛️ Frontend - React 19 + TypeScript (Vite + pnpm)
│   ├── src/
│   │   ├── components/          # Componentes UI reutilizables
│   │   │   └── ui/              # Modal, PageTransition, Breadcrumbs, etc.
│   │   ├── modules/             # 📦 Módulos funcionales
│   │   │   ├── auth/            # Login, Register, Password (5 páginas)
│   │   │   ├── dashboard-jefe/  # Panel admin completo (14 páginas)
│   │   │   ├── dashboard-empleado/  # Panel empleado (6 páginas + context + vales)
│   │   │   ├── dashboard-cliente/   # Panel cliente (2 páginas)
│   │   │   └── landing/         # Landing page + catálogo público (2 páginas)
│   │   ├── hooks/               # useAuth, useHeaderAnimation, useModalDialog
│   │   ├── context/             # AuthContext, ThemeProvider, RoleGuard, WebSocketProvider
│   │   ├── modules/dashboard-jefe/context/      # BadgeCountsContext (pedidos, usuarios, incidencias)
│   │   ├── modules/dashboard-empleado/context/  # EmployeeBadgeCountsContext (tareas, incidencias)
│   │   └── types/               # Tipado estricto (espejo del backend)
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
docker-compose up -d
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
