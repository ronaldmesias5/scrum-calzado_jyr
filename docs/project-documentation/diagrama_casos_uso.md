# Diagrama General de Casos de Uso (UML) — por Módulos

**Sistema:** CALZADO J&R — Sistema de Gestión y Producción de Calzado
**Autor:** Ronald Guerrero
**Última Actualización:** 2 de Agosto de 2026
**Fuente:** `casos de uso.docx.md` (CU001–CU034)

---

## 1. Simbología UML Normalizada

| Elemento | Símbolo | Descripción |
|----------|---------|-------------|
| **Actor** | 🧍 Monigote | Rol externo que interactúa con el sistema (persona u otro sistema). |
| **Caso de Uso** | ⬭ Óvalo | Funcionalidad que el sistema ofrece a un actor. |
| **Asociación** | ──── línea sólida | Comunicación entre un actor y un caso de uso. |
| **Límite del Sistema** | ⬜ Rectángulo | Marco que delimita qué funcionalidades pertenecen al software. |
| **`<<include>>`** | ┄┄▶ línea discontinua con flecha | Inclusión obligatoria: el caso base siempre ejecuta la lógica incluida. |
| **`<<extend>>`** | ┄┄▶ línea discontinua con flecha | Extensión opcional/condicional: solo se ejecuta bajo una condición. |
| **Generalización** | ──▷ línea sólida con triángulo | Herencia entre actores o entre casos de uso. |

> **Nota sobre los actores:** Cada actor se representa con su silueta de monigote. Los actores primarios (personas) usan 🧍 / 👩; los actores secundarios (sistema) usan 🏢 / 🤖. Los roles que heredan de *Usuario Registrado* comparten los casos de uso de autenticación.

---

## 2. Índice de Diagramas por Módulo

| # | Módulo | Casos de Uso | Actor(es) |
|---|--------|--------------|-----------|
| 2.1 | Autenticación y Cuentas | CU001–CU004 | 👩 Administrador, 🧍 Usuario Registrado |
| 2.2 | Catálogo y Productos | CU005–CU010 | 👩 Administrador, 🧍 Visitante, 🧍 Cliente Mayorista |
| 2.3 | Pedidos | CU011–CU014 | 🧍 Cliente Mayorista, 👩 Administrador, 🏢 Sistema |
| 2.4 | Inventario y Ventas | CU015–CU017 | 👩 Administrador, 🏢 Sistema |
| 2.5 | Calidad | CU018–CU019 | 👩 Administrador |
| 2.6 | Tareas y Producción | CU020–CU027 | 👩 Administrador, 🧍 Empleado, 🏢 Sistema |
| 2.7 | Notificaciones y Alertas | CU028–CU029 | 🧍 Todos los roles, 👩 Administrador |
| 2.8 | Reportes y Contabilidad | CU030–CU034 | 👩 Administrador, 🏢 Sistema |

---

## 2.1 Módulo: Autenticación y Cuentas

```mermaid
---
title: CASOS DE USO — Módulo Autenticación y Cuentas
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS1["SISTEMA CALZADO J&R — Autenticación"]
        direction TB
        CU001((CU001<br/>Crear Cuentas<br/>de Acceso))
        CU002((CU002<br/>Inicio de Sesión<br/>en el Sistema))
        CU003((CU003<br/>Recuperación de<br/>Contraseña))
        CU004((CU004<br/>Solicitud de<br/>Reactivación))
        %% Relaciones avanzadas
        CU003 -. <<extend>>\nSi enlace expirado .-> CU002
        CU004 -. <<extend>>\nSi cuenta suspendida .-> CU002
    end

    %% ===== ACTORES (siluetas) =====
    ADM1["👩\nAdministrador"]
    USR1["🧍\nUsuario\nRegistrado"]

    %% ===== ASOCIACIONES =====
    ADM1 --- CU001
    USR1 --- CU002
    USR1 --- CU003
    USR1 --- CU004
```

---

## 2.2 Módulo: Catálogo y Productos

```mermaid
---
title: CASOS DE USO — Módulo Catálogo y Productos
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS2["SISTEMA CALZADO J&R — Catálogo"]
        direction TB
        CU005((CU005<br/>Registro de<br/>Productos))
        CU006((CU006<br/>Clasificación por<br/>Categorías))
        CU007((CU007<br/>Gestión de Marcas<br/>y Estilos))
        CU008((CU008<br/>Catálogo<br/>Público))
        CU009((CU009<br/>Catálogo<br/>Cliente))
        CU010((CU010<br/>Filtrado y<br/>Búsqueda Avanzada))
        %% Relaciones avanzadas
        CU005 -. <<include>>\nVerificar Referencia .-> CU006
        CU008 -. <<include>>\nAplicar Filtros .-> CU010
        CU009 -. <<include>>\nAplicar Filtros .-> CU010
    end

    %% ===== ACTORES (siluetas) =====
    ADM2["👩\nAdministrador"]
    VIS2["🧍\nVisitante"]
    CLM2["🧍\nCliente\nMayorista"]

    %% ===== ASOCIACIONES =====
    ADM2 --- CU005
    ADM2 --- CU006
    ADM2 --- CU007
    VIS2 --- CU008
    VIS2 --- CU010
    CLM2 --- CU009
    CLM2 --- CU010
```

---

## 2.3 Módulo: Pedidos

```mermaid
---
title: CASOS DE USO — Módulo Pedidos
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS3["SISTEMA CALZADO J&R — Pedidos"]
        direction TB
        CU011((CU011<br/>Creación de<br/>Pedidos))
        CU012((CU012<br/>Notificación de<br/>Nuevos Pedidos))
        CU013((CU013<br/>Consulta de Estado<br/>de Mis Pedidos))
        CU014((CU014<br/>Actualización de<br/>Estado de Pedidos))
        %% Relaciones avanzadas
        CU011 -. <<include>>\nSeleccionar Productos .-> CU009
        CU013 -. <<include>>\nConsultar Estado Actual .-> CU014
        CU012 -. <<extend>>\nSi pedido confirmado .-> CU011
    end

    %% ===== ACTORES (siluetas) =====
    CLM3["🧍\nCliente\nMayorista"]
    ADM3["👩\nAdministrador"]
    SIS3A["🏢\nSistema"]

    %% ===== ASOCIACIONES =====
    CLM3 --- CU011
    CLM3 --- CU013
    ADM3 --- CU014
    SIS3A --- CU012
```

---

## 2.4 Módulo: Inventario y Ventas

```mermaid
---
title: CASOS DE USO — Módulo Inventario y Ventas
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS4["SISTEMA CALZADO J&R — Inventario y Ventas"]
        direction TB
        CU015((CU015<br/>Control de<br/>Inventario))
        CU016((CU016<br/>Actualización Automática<br/>de Inventario))
        CU017((CU017<br/>Registro de<br/>Ventas Directas))
        %% Relaciones avanzadas
        CU017 -. <<extend>>\nSi stock insuficiente .-> CU015
        CU016 -. <<include>>\nValidar Combinaciones .-> CU015
    end

    %% ===== ACTORES (siluetas) =====
    ADM4["👩\nAdministrador"]
    SIS4A["🏢\nSistema"]

    %% ===== ASOCIACIONES =====
    ADM4 --- CU015
    ADM4 --- CU017
    SIS4A --- CU016
```

---

## 2.5 Módulo: Calidad

```mermaid
---
title: CASOS DE USO — Módulo Calidad
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS5["SISTEMA CALZADO J&R — Calidad"]
        direction TB
        CU018((CU018<br/>Registro de Pérdidas<br/>por Defecto))
        CU019((CU019<br/>Restauración de<br/>Calzado Defectuoso))
        %% Relaciones avanzadas
        CU019 -. <<include>>\nSeleccionar Unidades .-> CU018
    end

    %% ===== ACTORES (siluetas) =====
    ADM5["👩\nAdministrador"]

    %% ===== ASOCIACIONES =====
    ADM5 --- CU018
    ADM5 --- CU019
```

---

## 2.6 Módulo: Tareas y Producción

```mermaid
---
title: CASOS DE USO — Módulo Tareas y Producción
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS6["SISTEMA CALZADO J&R — Tareas y Producción"]
        direction TB
        CU020((CU020<br/>Creación y Planificación<br/>de Tareas))
        CU021((CU021<br/>Asignación de<br/>Tareas))
        CU022((CU022<br/>Consulta de<br/>Tareas Asignadas))
        CU023((CU023<br/>Reporte de Avances<br/>e Incidencias))
        CU024((CU024<br/>Confirmación de<br/>Finalización))
        CU025((CU025<br/>Notificación de<br/>Tareas Finalizadas))
        CU026((CU026<br/>Modificación y<br/>Eliminación))
        CU027((CU027<br/>Incidencias de<br/>Maquinaria e Insumos))
        %% Relaciones avanzadas
        CU023 -. <<include>>\nSeleccionar Tarea Activa .-> CU022
        CU024 -. <<include>>\nRegistrar Avance 100% .-> CU023
        CU027 -. <<extend>>\nSi falla operativa .-> CU023
        CU025 -. <<extend>>\nSi tarea completada .-> CU024
        CU021 -. <<include>>\nValidar Disponibilidad .-> CU020
    end

    %% ===== ACTORES (siluetas) =====
    ADM6["👩\nAdministrador"]
    EMP6["🧍\nEmpleado"]
    SIS6A["🏢\nSistema"]

    %% ===== ASOCIACIONES =====
    ADM6 --- CU020
    ADM6 --- CU021
    ADM6 --- CU026
    EMP6 --- CU022
    EMP6 --- CU023
    EMP6 --- CU024
    EMP6 --- CU027
    SIS6A --- CU025
```

---

## 2.7 Módulo: Notificaciones y Alertas

```mermaid
---
title: CASOS DE USO — Módulo Notificaciones y Alertas
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS7["SISTEMA CALZADO J&R — Notificaciones y Alertas"]
        direction TB
        CU028((CU028<br/>Centro de<br/>Notificaciones))
        CU029((CU029<br/>Alertas Críticas<br/>para Administrador))
        %% Relaciones avanzadas
        CU028 -. <<extend>>\nSi evento crítico .-> CU029
    end

    %% ===== ACTORES (siluetas) =====
    USR7["🧍\nTodos los<br/>Usuarios"]
    ADM7["👩\nAdministrador"]

    %% ===== ASOCIACIONES =====
    USR7 --- CU028
    ADM7 --- CU029
```

---

## 2.8 Módulo: Reportes y Contabilidad

```mermaid
---
title: CASOS DE USO — Módulo Reportes y Contabilidad
---
flowchart LR
    %% ===== LIMITE DEL SISTEMA =====
    subgraph SIS8["SISTEMA CALZADO J&R — Reportes y Contabilidad"]
        direction TB
        CU030((CU030<br/>Reportes de Pedidos<br/>e Inventario))
        CU031((CU031<br/>Reportes de Desempeño<br/>de Empleados))
        CU032((CU032<br/>Contabilidad de<br/>Producción por Empleado))
        CU033((CU033<br/>Contabilidad de Pares<br/>Fabricados Semanalmente))
        CU034((CU034<br/>Contabilidad de Pares<br/>Pedidos por Cliente))
        %% Relaciones avanzadas
        CU032 -. <<include>>\nTareas Aprobadas .-> CU031
        CU033 -. <<include>>\nConsolidar Producción .-> CU032
        CU034 -. <<include>>\nConsolidar Pedidos .-> CU030
    end

    %% ===== ACTORES (siluetas) =====
    ADM8["👩\nAdministrador"]
    SIS8A["🏢\nSistema"]

    %% ===== ASOCIACIONES =====
    ADM8 --- CU030
    ADM8 --- CU031
    SIS8A --- CU032
    SIS8A --- CU033
    SIS8A --- CU034
```

---

## 3. Generalización de Actores

```mermaid
---
title: Generalización de Actores
---
flowchart TB
    VIS["🧍\nVisitante"]
    USR["🧍\nUsuario\nRegistrado"]
    CLM["🧍\nCliente\nMayorista"]
    EMP["🧍\nEmpleado"]
    ADM["👩\nAdministrador"]
    SIS["🏢\nSistema\n(secundario)"]

    USR ---|generaliza| CLM
    USR ---|generaliza| EMP
    USR ---|generaliza| ADM
    VIS -. "se registra para convertirse" .-> USR
    SIS -. "actor secundario" .-> USR
```

---

## 4. Relaciones Avanzadas entre Casos de Uso (resumen)

### 4.1 Relaciones `<<include>>` (Inclusión Obligatoria)

| Caso Padre | Caso Incluido | Lógica compartida | Módulo |
|------------|---------------|-------------------|--------|
| CU005 Registro de Productos | CU006 Verificar Referencia | Validación de unicidad de referencia | Catálogo |
| CU008 Catálogo Público | CU010 Aplicar Filtros | Filtrado y búsqueda del catálogo | Catálogo |
| CU009 Catálogo Cliente | CU010 Aplicar Filtros | Filtrado y búsqueda del catálogo | Catálogo |
| CU011 Creación de Pedidos | CU009 Seleccionar Productos | Búsqueda y selección de referencias | Pedidos |
| CU013 Consulta de Estado | CU014 Consultar Estado Actual | Obtener estado vigente del pedido | Pedidos |
| CU016 Actualización Inventario | CU015 Validar Combinaciones | Validar combinaciones referencia-talla-color | Inventario |
| CU019 Restauración | CU018 Seleccionar Unidades | Elegir unidades defectuosas a restaurar | Calidad |
| CU023 Reporte de Avances | CU022 Seleccionar Tarea Activa | Elegir la tarea en progreso a reportar | Tareas |
| CU024 Finalización | CU023 Registrar Avance 100% | Registrar el avance antes de finalizar | Tareas |
| CU032 Contabilidad Empleado | CU031 Tareas Aprobadas | Tareas aprobadas por supervisión | Reportes |
| CU033 Contabilidad Semanal | CU032 Consolidar Producción | Consolidar producción aprobada | Reportes |
| CU034 Contabilidad Cliente | CU030 Consolidar Pedidos | Consolidar pedidos del mes | Reportes |

### 4.2 Relaciones `<<extend>>` (Extensión Opcional / Condicional)

| Caso Base | Caso Extendido | Condición de Activación | Módulo |
|-----------|----------------|--------------------------|--------|
| CU002 Inicio de Sesión | CU003 Recuperación | El enlace de recuperación expira | Autenticación |
| CU002 Inicio de Sesión | CU004 Reactivación | La cuenta está "Suspendida" | Autenticación |
| CU011 Creación de Pedidos | CU012 Notificación | El pedido se confirma | Pedidos |
| CU017 Registro de Ventas | CU015 Consulta Inventario | El stock resulta insuficiente | Inventario |
| CU023 Reporte de Avances | CU027 Incidencias | Se detecta falla operativa o falta de insumo | Tareas |
| CU024 Finalización | CU025 Notificación | La tarea se completa | Tareas |
| CU028 Centro de Notificaciones | CU029 Alertas Críticas | Se genera un evento crítico | Notificaciones |

### 4.3 Generalización / Herencia

| Padre | Hijo | Relación |
|-------|------|----------|
| Usuario Registrado | Cliente Mayorista | Un cliente mayorista es un usuario registrado |
| Usuario Registrado | Empleado | Un empleado es un usuario registrado |
| Usuario Registrado | Administrador | Un administrador es un usuario registrado |
| CU010 Búsqueda Avanzada | CU008 Catálogo Público | El catálogo público usa la búsqueda |
| CU010 Búsqueda Avanzada | CU009 Catálogo Cliente | El catálogo de cliente usa la búsqueda |

---

## 5. Notas Importantes

1. **Límite del Sistema:** Cada módulo tiene su propio límite (`subgraph`) que delimita las funcionalidades que pertenecen al software CALZADO J&R. Los actores siempre quedan **fuera** del límite.

2. **Siluetas de actores:** Los actores primarios (personas) se representan con 🧍 / 👩 y los actores secundarios (procesos automáticos) con 🏢.

3. **Actor Sistema:** Los casos CU012, CU016, CU025, CU032, CU033 y CU034 son **automatizados** y no requieren intervención humana; el actor "Sistema" los dispara por eventos o programación (corte semanal/mensual).

4. **Herencia de Actores:** Cliente Mayorista, Empleado y Administrador heredan automáticamente los casos de uso de Usuario Registrado (CU002, CU003, CU004, CU028) vistos en el módulo de Autenticación y Notificaciones.
