# Entregas Metodologías Ágiles - Sistema de Gestión y Producción de Calzado - CALZADO J&R

**Proyecto:** Sistema de Gestión y Producción de Calzado - CALZADO J&R  
**Equipo:** Ronald (Arquitecto) | Andrés (Scrum Master) | Santiago (Bases de Datos)  
**Última Actualización:** 19 de Marzo de 2026  
**Estado:** En Desarrollo - Sprint 6 Activo

## 20 Historias de Usuario - Plan de Trabajo

Estructura: **2 historias cada 15 días** = 10 sprints de 15 días cada uno

---

## **Estado de Progreso Global**

| Sprint | Período | Estado | Historias |
|--------|---------|--------|----------|
| Sprint 1 | Días 1-15 | ✅ **COMPLETADO** | HU-001, HU-003 |
| Sprint 2 | Días 16-30 | ✅ **COMPLETADO** | HU-002, HU-004 |
| Sprint 3 | Días 31-45 | ✅ **COMPLETADO** | HU-006, HU-009 |
| Sprint 4 | Días 46-60 | ✅ **COMPLETADO** | HU-010, HU-011 |
| Sprint 5 | Días 61-75 | ✅ **COMPLETADO** | HU-012, HU-014 |
| Sprint 6 | Días 76-90 | 🔄 **EN PROGRESO** | HU-015, HU-016 |
| Sprint 7 | Días 91-105 | ⏳ Pendiente | HU-022, HU-024 |
| Sprint 8 | Días 106-120 | ⏳ Pendiente | HU-029, HU-030 |
| Sprint 9 | Días 121-135 | ⏳ Pendiente | HU-025, HU-026 |
| Sprint 10 | Días 136-150 | ⏳ Pendiente | HU-031, HU-033 |

---

## **Sprint 1 (Días 1-15): Autenticación** ✅ COMPLETADO
- **HU-001** - Creación de Cuentas de Usuario ✅
- **HU-003** - Inicio de Sesión ✅

## **Sprint 2 (Días 16-30): Gestión de Cuentas** ✅ COMPLETADO
- **HU-002** - Validación y Activación de Cuentas ✅
- **HU-004** - Recuperación de Contraseñas ✅

## **Sprint 3 (Días 31-45): Catálogo Base y Dashboard** ✅ COMPLETADO
- **HU-006** - Creación de Catálogo (Landing Page) ✅
- **HU-009** - Visualización de Catálogo (Dashboard Jefe) ✅

## **Sprint 4 (Días 46-60): Búsqueda y Filtrado** ✅ COMPLETADO
- **HU-010** - Consulta de Catálogo ✅
- **HU-011** - Sistema de Filtrado ✅

## **Sprint 5 (Días 61-75): Gestión de Pedidos** ✅ COMPLETADO
- **HU-012** - Realización de Pedidos ✅
- **HU-014** - Consulta de Estado de Pedidos ✅

## **Sprint 6 (Días 76-90): Producción e Inventario** 🔄 EN PROGRESO
- **HU-015** - Actualización de Estado de Producción 🔄
- **HU-016** - Gestión de Inventario 🔄

## **Sprint 7 (Días 91-105): Asignación de Tareas** ⏳ PENDIENTE
- **HU-022** - Asignación de Tareas de Producción
- **HU-024** - Reporte de Avances

## **Sprint 8 (Días 106-120): Notificaciones** ⏳ PENDIENTE
- **HU-029** - Módulo de Notificaciones
- **HU-030** - Alertas al Jefe

## **Sprint 9 (Días 121-135): Confirmación de Tareas** ⏳ PENDIENTE
- **HU-025** - Confirmación de Finalización de Tareas
- **HU-026** - Notificación al Jefe de Tareas Completadas

## **Sprint 10 (Días 136-150): Reportes** ⏳ PENDIENTE
- **HU-031** - Reportes de Pedidos
- **HU-033** - Suma de Producción

---

## Estructura de Carpetas

```
entregas_metodologias_agiles/
│
├── 📚 documentación/                 # Documentación
│   ├── plan_de_trabajo.md            # Plan de sprints
│   ├── historias-usuario.md          # Historias de usuario
│   ├── arquitectura_proyecto.md      # Tecnologías y estructura
│   ├── bsededatos.drawio.svg         # MER
│   └── Sprints/                      # Backlogs sprints
│       └── backlog_sprint_1.md       # Backlog
│
├── 🚀 backend/                       # API y Lógica de Negocio
│   ├── src/
│   │   ├── controllers/              # Controladores
│   │   ├── services/                 # Lógica de negocio
│   │   ├── models/                   # Esquemas
│   │   ├── routes/                   # Rutas
│   │   ├── middleware/               # Autenticación, validación
│   │   ├── utils/                    # Funciones auxiliares
│   │   └── config/                   # Configuración
│   ├── tests/                        # Tests unitarios e integración
│   ├── .env                          # Variables de entorno
│   ├── package.json                  # Dependencias
│   └── server.js                     # Punto de entrada
│
├── 💻 frontend/                      # Interfaz de Usuario
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   ├── pages/                    # Páginas
│   │   ├── services/                 # Llamadas a API
│   │   ├── styles/                   # CSS/Tailwind
│   │   ├── utils/                    # Funciones auxiliares
│   │   └── App.js                    # Componente raíz
│   ├── public/                       # Archivos estáticos
│   ├── package.json                  # Dependencias
│   └── .env                          # Variables de entorno
│
├── 🗄️ database/                      # Base de Datos
│   ├── migrations/                   # Migrations de esquema
│   ├── seeds/                        # Datos iniciales
│   └── schema.sql                    # Esquema completo
│
├── .gitignore                        # Archivos ignorados
├── docker-compose.yml                # Orquestación de contenedores
├── README.MD                         # Introducción proyecto
└── package.json                      # Root dependencies

```
