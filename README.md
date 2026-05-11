# Sistema de Gestión y Producción de Calzado - CALZADO J&R

---

## 📋 Descripción General

Sistema integral para la gestión y producción de calzado, diseñado con una arquitectura modular para escalar eficientemente.

**Dashboards implementados:**
- **Dashboard Jefe**: Supervisión total, validación de clientes, gestión de empleados, catálogo, pedidos, inventario, insumos, tareas de producción.
- **Dashboard Empleados**: (En desarrollo)
- **Dashboard Clientes**: (En desarrollo)

**Estado actual:** Sprints 1-5 completados. Sprint 6-7 en progreso.

---

## 🏗️ Estructura del Proyecto

```text
scrum/
├── be/                          # 🐍 Backend - FastAPI + Python (uv)
│   ├── app/
│   │   ├── core/                # Configuración, BD, dependencias y seguridad
│   │   ├── models/              # Modelos SQLAlchemy (entidades)
│   │   ├── modules/             # 📦 Módulos de lógica de negocio (feature-based)
│   │   │   ├── auth/            # Registro, login, logout global, consentimientos
│   │   │   ├── admin/           # Gestión de usuarios y validaciones
│   │   │   └── ...              # Catálogo, Pedidos, Producción
│   │   ├── utils/               # Sanitizado, emails, seguridad
│   │   └── main.py              # Punto de entrada
│   ├── pyproject.toml           # Gestión de dependencias (uv)
│   └── .env.example             # Plantilla de variables de entorno
│
├── fe/                          # ⚛️ Frontend - React + TypeScript (Vite + pnpm)
│   ├── src/
│   │   ├── modules/             # 📦 Módulos funcionales
│   │   │   ├── auth/            # Login, Registro (con términos), Password
│   │   │   ├── dashboard-jefe/  # Gestión total (incluye borrar usuarios)
│   │   │   └── ...              # Landing, Clientes, Empleados
│   │   ├── shared/              # Componentes UI, hooks, servicios API
│   │   ├── context/             # AuthContext (estado Global)
│   │   └── types/               # Tipado estricto (espejo del backend)
│   └── package.json             # Dependencias Node.js
│
├── db/                          # 🗄️ Base de Datos
│   └── init/                    # Scripts DDL y Semillas (SQL)
│
├── docs/                        # 📚 Documentación Scrum
│   ├── project-documentation/   # Historias, MER, Arquitectura
│   └── sprints/                 # Backlogs y Estados
│
├── docker-compose.yml           # Orquestación de contenedores
└── .env.example                 # Variables globales de ejemplo
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
- **Docker / Docker Compose**: Despliegue consistente en cualquier entorno.

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
- **Email**: `admin@calzadojyr.com`
- **Contraseña**: `AdminSegura123!`

---

## 👥 Equipo y Autores
- **Ronald Mesias** - Líder de Proyecto / Arquitecto FullStack
- **Andrés** - Scrum Master
- **Santiago** - DB / Infra

---

© 2026 CALZADO J&R - Calidad y Estilo en cada paso.
