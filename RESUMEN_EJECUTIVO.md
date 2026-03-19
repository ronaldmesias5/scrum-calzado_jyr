# Resumen Ejecutivo - CALZADO J&R
## Sistema de Gestión y Producción de Calzado

**Fecha:** 19 de Marzo de 2026  
**Equipo:** Ronald Guerrero (Arquitecto), Santiago (DBA), Andrés Gil (Scrum Master)  
**Institución:** SENA - Programa de Metodología Ágil  

---

## 🎯 Descripción del Proyecto

**CALZADO J&R** es un sistema integral de gestión y producción de calzado diseñado para empresas mayoristas. Permite a clientes crear pedidos de volumen, gestionar catálogos de productos, y facilita a la empresa controlar inventario, asignar tareas de producción y generar reportes de eficiencia.

**Objetivo:** Digitalizar completamente el proceso de venta mayorista y producción de calzado, desde el registro de clientes hasta la entrega de pedidos.

---

## 📊 Estado Actual del Proyecto

### Sprints Completados ✅
| Sprint | Historias | Período | Estado |
|--------|-----------|---------|--------|
| **Sprint 1** | HU-001, HU-003 | Días 1-15 | ✅ COMPLETADO |
| **Sprint 2** | HU-002, HU-004 | Días 16-30 | ✅ COMPLETADO |
| **Sprint 3** | HU-006, HU-009 | Días 31-45 | ✅ COMPLETADO |
| **Sprint 4** | HU-010, HU-011 | Días 46-60 | ✅ COMPLETADO |
| **Sprint 5** | HU-012, HU-014 | Días 61-75 | ✅ COMPLETADO |

**Total Completado:** 50% del proyecto (10 historias de 20 planeadas)

---

## 🎁 Características Entregadas

### Autenticación Segura (Sprints 1-2)
✅ Registro de clientes con validación de datos  
✅ Sistema de 2 niveles: Solicitud + Aprobación del jefe  
✅ Login seguro con JWT y manejo de sesiones  
✅ Recuperación de contraseña por email  
✅ Auditoría completa de accesos  

### Catálogo de Productos (Sprint 3-4)
✅ 150+ productos con imágenes  
✅ Clasificación en 8 categorías  
✅ Organización por 5 marcas y 10+ estilos  
✅ Búsqueda full-text por nombre/referencia  
✅ Filtros avanzados por talla, color, marca  
✅ Dashboard administrativo para jefe  

### Gestión de Órdenes (Sprint 5)
✅ Creación de pedidos mayoristas con múltiples líneas  
✅ Validación de stock en tiempo real  
✅ Estados de orden: Pendiente, En Producción, Completado  
✅ Visualización detallada con imágenes de productos  
✅ Paginación y filtros por estado  

---

## 🏗️ Arquitectura Técnica

### Stack Verified ✅

```
┌─────────────────────────────────────────┐
│  Frontend: React 19 + TypeScript        │
│  Build: Vite 7.3.1                     │
│  Styling: Tailwind CSS 4+              │
│  Port: 5173                             │
└────────────┬────────────────────────────┘
             │ HTTP/JWT
┌────────────▼────────────────────────────┐
│  Backend: FastAPI 0.115.0+              │
│  Runtime: Python 3.12-slim              │
│  ORM: SQLAlchemy 2.0+                   │
│  Port: 8000                             │
└────────────┬────────────────────────────┘
             │ PostgreSQL
┌────────────▼────────────────────────────┐
│  Database: PostgreSQL 17-alpine         │
│  Container: Docker Compose              │
│  Port: 5432                             │
└─────────────────────────────────────────┘
```

### Infraestructura
- **Containerización:** Docker + Docker Compose
- **Orquestación:** 3 servicios (db, backend, frontend)
- **Persistencia:** PostgreSQL 17 con 19 tablas completamente sincronizadas y relacionadas
---


## 📋 Documentación Entregada

✅ **Historias de Usuario** - 20 HU documentadas (HU-001 a HU-033)  
✅ **Plan de Trabajo** - 10 sprints planificados  
✅ **Arquitectura del Proyecto** - Stack y decisiones técnicas  
✅ **Estructura Modular** - Organización de código  
✅ **Diccionario de Datos** - Schema de 10 tablas  
✅ **Backlog de Sprints** - 5 sprints completados documentados  
✅ **Estado del Proyecto** - Overview actual  
✅ **Guías de Ejecución** - COMO_CORRER_PROYECTO.md  

---

## 🎯 Próximas Fases (Planificado)

### Sprint 6: Gestión de Producción e Inventario
- Actualización de estado de producción
- Control de materia prima (cueros, hilos, suelas, cierres)
- Alertas por stock bajo

### Sprint 7: Asignación de Tareas
- Dashboard de operarios
- Asignación de trabajos
- Reportes de avance diario

### Sprint 8: Notificaciones
- Sistema de notificaciones en tiempo real (WebSocket)
- Alertas críticas al jefe
- Email de confirmación

### Sprint 9: Confirmación de Trabajo
- Operarios marcan tareas completadas
- Revisión de calidad por jefe
- Dashboard de eficiencia

### Sprint 10: Reportes Ejecutivos
- Reportes de órdenes (por período, cliente, producto)
- Suma de producción diaria/semanal/mensual
- Análisis de desempeño de operarios

---

## 🚀 Cómo Ejecutar el Proyecto

```bash
# 1. Activar ambiente virtual
.\.venv\Scripts\Activate

# 2. Levantar contenedores
docker-compose up --build

# 3. Acceder a los servicios
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs
Database:  localhost:5432
```

**Credenciales de Prueba:**
- Email: `jefe@calzado.com` / Contraseña: `Admin123!`
- Email: `cliente@mayorista.com` / Contraseña: `Cliente123!`

---

## 📞 Contacto y Soporte

**Equipo de Desarrollo:**
- Ronald Guerrero - Arquitecto Backend/Frontend
- Santiago - Especialista en Base de Datos
- Andrés Gil - Scrum Master

**Institución:**
- SENA
- Programa: Análisis y Desarrollo de Software
- Modalidad: Ágil - Scrum

---

**Preparado por:** Andrés Gil, Scrum Master  
**Aprobado por:** Ronald Guerrero, Arquitecto  
**Última Actualización:** 19 de Marzo de 2026  


