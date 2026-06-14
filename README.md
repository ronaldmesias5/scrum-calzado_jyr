# Sistema de Gestión y Producción de Calzado - CALZADO J&R

---

## 📋 Descripción General

Sistema integral para la gestión y producción de calzado, diseñado con una arquitectura modular para escalar eficientemente.

**Dashboards implementados:**
- **Dashboard Jefe**: Supervisión total, validación de clientes, gestión de empleados, catálogo, pedidos, inventario, insumos, tareas de producción, reportes con PDF export.
- **Dashboard Empleados**: Operativo (6 páginas) — tareas disponibles, mis tareas, incidencias, reportes de rendimiento con PDF export, configuración de perfil con avatar.
- **Dashboard Clientes**: Operativo (2 páginas) — dashboard y consulta de pedidos.

**Estado actual:** Sprints 1-7 completados. Funcionalidad completa de dashboard jefe, dashboard empleado y dashboard cliente operativas.

---

## 🏗️ Estructura del Proyecto

```text
scrum/
├── be/                          # 🐍 Backend - FastAPI + Python (uv)
│   ├── app/
│   │   ├── core/                # Configuración, BD, dependencias y seguridad
│   │   ├── init_db.py           # Auto-migraciones + seed data al arrancar
│   │   ├── models/              # Modelos SQLAlchemy (22 tablas)
│   │   ├── modules/             # 📦 8 módulos feature-based
│   │   │   ├── admin/           # Catálogo admin, reportes, usuarios
│   │   │   ├── auth/            # Login, registro, JWT, logout global
│   │   │   ├── catalog/         # Catálogo público
│   │   │   ├── dashboard_jefe/  # Métricas y dashboard principal
│   │   │   ├── orders/          # Pedidos + producción + vales
│   │   │   ├── supplies/        # Insumos y movimientos
│   │   │   ├── type_document/   # Tipos de documento
│   │   │   └── users/           # CRUD usuarios
│   │   ├── utils/               # Email SMTP, sanitizado, seguridad
│   │   └── main.py              # Punto de entrada
│   ├── alembic/versions/        # 27 migraciones versionadas
│   ├── scripts/                 # create_admin.py, heal_line_groups.py
│   └── pyproject.toml           # Dependencias (uv)
│
├── fe/                          # ⚛️ Frontend - React 19 + TypeScript (Vite + pnpm)
│   ├── src/
│   │   ├── components/          # Componentes UI reutilizables
│   │   │   └── ui/              # Modal, PageTransition, Breadcrumbs, etc.
│   │   ├── modules/             # 📦 Módulos funcionales
│   │   │   ├── auth/            # Login, Register, Password (5 páginas)
│   │   │   ├── dashboard-jefe/  # Panel admin completo (12 páginas)
│   │   │   ├── dashboard-empleado/  # Panel empleado (6 páginas + utils)
│   │   │   ├── dashboard-cliente/   # Panel cliente (2 páginas)
│   │   │   └── landing/         # Landing page + catálogo público
│   │   ├── hooks/               # useAuth, useHeaderAnimation, useModalDialog
│   │   ├── context/             # AuthContext, BadgeCounts, ThemeProvider
│   │   └── types/               # Tipado estricto (espejo del backend)
│   ├── package.json             # pnpm (nunca npm/yarn)
│   └── vite.config.ts           # Proxy API, polling, aliases
│
├── db/                          # 🗄️ Base de Datos
│   └── init/                    # init.sql — solo extensiones (no esquema)
│
├── docs/                        # 📚 Documentación
│   ├── project-documentation/   # Arquitectura, diccionario datos, requisitos
│   ├── sprints/                 # Backlogs y plan de trabajo
│   ├── GUIA_DISENO.md           # Guía visual — OBLIGATORIA para UI
│   └── delete_data_queries.md   # Consultas SQL para limpieza
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

- **React 19+ (Vite)**: Interfaz reactiva y rápida.
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
