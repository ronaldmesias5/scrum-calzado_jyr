# GUÍA DE DISEÑO — CALZADO J&R

> **Propósito:** Este documento define la línea de diseño visual del proyecto para que toda nueva sección, página o componente que se cree mantenga consistencia con lo existente.  
> **Usar como referencia obligatoria** al generar cualquier UI nueva en el dashboard o landing page.

---

## 1. Estructura base de una página del dashboard

Toda página del dashboard (`dashboard-jefe`) sigue este esqueleto exacto:

```tsx
<div className="space-y-6">
  {/* ============================================================
      CABECERA: título + icono + subtítulo + botón de acción
      ============================================================ */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
        <Icono className="w-8 h-8 text-{color}-600" />
        Título de la página
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
        Descripción breve de la sección
      </p>
    </div>
    {/* Botón de acción principal (opcional) */}
    <button className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95">
      <Plus size={18} /> Nueva acción
    </button>
  </div>

  {/* ============================================================
      TARJETAS DE MÉTRICAS (opcional)
      ============================================================ */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {/* Componentes StatCard */}
  </div>

  {/* ============================================================
      PANEL DE FILTROS (opcional)
      ============================================================ */}
  <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
      {/* Filtros */}
    </div>
  </div>

  {/* ============================================================
      TABLA / CONTENIDO PRINCIPAL
      ============================================================ */}
  <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
    {/* Tabla o contenido */}
  </div>
</div>
```

### ⚠️ Reglas NO negociables para la cabecera

| Elemento | Debe ser | Nunca usar |
|----------|----------|------------|
| **Tag del título** | `<h1>` con `text-2xl sm:text-3xl font-bold` | `<h2>`, `text-4xl`, `text-5xl` |
| **Icono del título** | Lucide React, `className="w-8 h-8"` dentro del `<h1>` | Emojis, SVG inline, iconos más grandes de 32px |
| **Subtítulo** | `<p>` con `text-gray-600 dark:text-gray-400 mt-1` | Texto grande, negritas |
| **Botón de acción** | `rounded-xl`, `font-bold`, `shadow-lg`, `active:scale-95` | `rounded-lg` o `rounded-full` en acciones primarias |
| **Contenedor principal** | `space-y-6` (24px de separación entre secciones) | `space-y-8` o gaps mayores |

---

## 2. Jerarquía de títulos y tipografía

| Nivel | HTML | Clases | Dónde se usa |
|-------|------|--------|-------------|
| **Título de página** | `<h1>` | `text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors` | Cabecera de cada página |
| **Título de tarjeta/sección** | `<h2>` o `<h3>` | `font-bold text-gray-900 dark:text-white transition-colors duration-500` o `text-lg font-extrabold` | Títulos internos de cards |
| **Título de modal** | `<h3>` | `text-xl font-bold text-gray-900 dark:text-white tracking-tight` | Cabecera del modal |
| **Label de formulario** | `<label>` | `block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2` | Forms en modales |
| **Label de filtro** | `<label>` | `block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2` | Paneles de filtro |
| **Encabezado de tabla** | `<th>` | `px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider` | Todas las tablas |
| **Valor de métrica** | `<p>` | `text-4xl font-bold text-{color}-600 dark:text-{color}-400` | StatCard |
| **Texto descriptivo** | `<p>` | `text-sm text-gray-500 dark:text-gray-400` | Debajo de títulos |

- **Font family:** `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif` (global en `index.css`)
- **Font-weight dominante:** `font-bold` (NO `font-semibold`) para casi todo énfasis
- **Nunca usar** `text-4xl` o mayores en títulos de página — solo en métricas (StatCard) o Hero de landing

---

## 3. Tarjetas y contenedores

### Tarjeta estándar del dashboard
```html
<div class="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
```
- `rounded-xl` (12px) — estándar para todas las tarjetas
- `rounded-2xl` (16px) — tablas y contenedores grandes
- `rounded-3xl` (24px) — modales y settings cards
- **Siempre incluir:** `shadow-sm`, `border`, `transition-all duration-300`
- **Nunca usar:** sombras grandes (`shadow-xl`, `shadow-2xl`) en tarjetas de dashboard

### Panel de filtros
```html
<div class="bg-white dark:bg-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
```
- Grid interno: `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end`

### Tarjeta de métrica (StatCard)
```html
<div class="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
  <div class="flex items-start justify-between mb-4">
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Label</p>
      <p class="text-4xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-500">Valor</p>
    </div>
    <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl border border-transparent dark:border-white/5 transition-all shadow-sm">
      <Icon class="text-blue-600 dark:text-blue-400" />
    </div>
  </div>
</div>
```

**Colores disponibles para StatCard:** `blue`, `green`, `red`, `orange`, `purple`, `yellow`

---

## 4. Botones — guía visual

### Botón de acción primaria (crear, guardar, enviar)
```html
<button class="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95">
  <Plus size={18} /> Label
</button>
```
- **Color:** `bg-blue-600` | **Forma:** `rounded-xl` | **Sombra:** `shadow-lg` con hover de color
- **Efecto click:** siempre `active:scale-95`
- **Ancho:** `w-full sm:w-auto`

### Botón de acción secundaria (cancelar, limpiar)
```html
<button class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm">
  Cancelar
</button>
```

### Botón de peligro (eliminar, desactivar)
```html
<button class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
  <Trash2 size={18} /> Eliminar
</button>
```

### Botón de acción verde (exportar, confirmar)
```html
<button class="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all font-bold shadow-lg hover:shadow-green-500/20 active:scale-95">
  <Download size={18} /> Exportar
</button>
```

### Botón de acción en tabla (ícono pequeño)
```html
<button class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-95 shadow-sm">
  <Edit2 size={16} />
</button>
```

### Botón de recargar/refrescar
```html
<button class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">
  <RefreshCw size={16} /> Actualizar
</button>
```

### ⚠️ Qué NUNCA hacer con botones
- ❌ Usar `rounded-full` en botones del dashboard (solo en badges y toasts)
- ❌ Usar `rounded-lg` en botones de acción principal (es para el componente `<Button>` del auth)
- ❌ Botones sin `active:scale-95` o `active:scale-[0.98]`
- ❌ Animaciones tipo `btn-pulse`, `btn-glow`, `btn-shimmer` en el dashboard (solo en landing page)
- ❌ Botones sin `font-bold`
- ❌ Botones sin sombra (`shadow-lg` o `shadow-sm`)

---

## 5. Tablas — patrón universal

```html
<div class="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Columna
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
        <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
          <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Contenido
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Estilos de celda por tipo de dato

| Tipo de dato | Clases |
|-------------|--------|
| **ID / Código** | `font-mono font-bold text-sm text-blue-600 dark:text-blue-400` |
| **Nombre / Título** | `font-bold text-gray-900 dark:text-white transition-colors` |
| **Categoría** | `inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold rounded` |
| **Cantidad** | `bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50` |
| **Texto normal** | `text-sm text-gray-700 dark:text-gray-300` |

### Badge de estado
```html
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors bg-{color}-50 dark:bg-{color}-950/30 text-{color}-700 dark:text-{color}-400 border-{color}-200 dark:border-{color}-900/50">
  <Icon size={14} /> Label
</span>
```

**Colores por estado:**
| Estado | Color | Icono |
|--------|-------|-------|
| Pendiente | `yellow` | `<Clock size={14} />` |
| En progreso | `blue` | `<Zap size={14} />` |
| Completado | `green` | `<CheckCircle size={14} />` |
| Entregado | `purple` | `<CheckCircle2 size={14} />` |
| Cancelado | `red` | `<XCircle size={14} />` |

---

## 6. Formularios

### Input estándar
```html
<label class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
  Nombre del campo
</label>
<input
  type="text"
  class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
/>
```

### Select estándar
```html
<select class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors">
```

### Input con icono de búsqueda
```html
<div class="relative">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
  <input
    class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
    placeholder="Buscar..."
  />
</div>
```

### ⚠️ Reglas de formularios
- Labels SIEMPRE en `uppercase tracking-widest`, tamaño `text-[10px]`
- Inputs con `rounded-xl` (12px) en modales y forms principales
- Selects con `rounded-lg` (8px) en filtros
- Focus ring siempre `focus:ring-2 focus:ring-blue-500`
- Placeholder: `placeholder:text-gray-400 dark:placeholder:text-gray-500`

---

## 7. Estados: vacío, carga y error

### Estado de carga
```html
<div class="flex flex-col items-center justify-center py-20 gap-3">
  <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
</div>
```
Alternativa simple: `<Loader2 className="animate-spin w-6 h-6 text-blue-600 dark:text-blue-400" />`

### Estado vacío
```html
<div class="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
  <div class="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
    <Package size={28} className="text-gray-300 dark:text-gray-600" />
  </div>
  <div>
    <p class="text-gray-900 dark:text-white font-bold text-lg">No hay datos</p>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Aquí aparecerán los registros cuando los crees.</p>
  </div>
</div>
```

### Estado de error
```html
<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
  <p className="text-sm text-red-800 dark:text-red-300 font-medium">{mensaje}</p>
</div>
```

---

## 8. Modales

### Estructura del modal
```html
<!-- Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
  <!-- Contenedor -->
  <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
    <!-- Cabecera -->
    <div class="px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Título del modal</h3>
      <button onClick={onClose} class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
        <XCircle className="w-6 h-6" />
      </button>
    </div>
    <!-- Cuerpo -->
    <div class="p-6 space-y-4">
      <!-- Campos del formulario -->
    </div>
    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex gap-3">
      <button class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] text-sm">
        Cancelar
      </button>
      <button class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
        Guardar
      </button>
    </div>
  </div>
</div>
```

### Modal de confirmación de eliminación
- Overlay: `bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md`
- Cabecera: `bg-red-50 dark:bg-red-900/20` con `<AlertTriangle />`
- Botón confirmar: `bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20`
- Botón cancelar: mismo patrón secundario de siempre

### ⚠️ Reglas de modales
- Siempre `rounded-3xl` (nunca `rounded-xl` ni `rounded-2xl`)
- Animación de entrada: `animate-in fade-in zoom-in duration-200`
- Backdrop: `bg-black/60 backdrop-blur-md`
- Botón cerrar: `<XCircle>` en modales de formulario, `<X>` en modales pequeños
- Footer con `border-t` y `bg-gray-50/50`

---

## 9. Iconos — Lucide React

**Todos los iconos son de `lucide-react` (`^0.563.0`).**  
NUNCA usar emojis, SVGs inline, ni otros paquetes de iconos.

### Tamaños estándar
| Contexto | Tamaño |
|----------|--------|
| Icono de título de página `<h1>` | `className="w-8 h-8"` |
| Icono en StatCard | `size={28}` o `size={32}` (pasa como `className`) |
| Icono en botón de acción | `size={18}` |
| Icono en tabla / acciones | `size={16}` |
| Icono en badge de estado | `size={14}` |
| Icono en breadcrumb | `size={14}` |

### Color del icono del título por tipo de página
| Página | Icono | Color |
|--------|-------|-------|
| Inicio / Dashboard | `<Home>` | `text-purple-600` |
| Pedidos | `<ShoppingCart>` | `text-blue-600` |
| Catálogo | `<Layers>` | `text-orange-600` |
| Inventario | `<Package>` | `text-green-600 dark:text-green-400` |
| Tareas | `<CheckSquare>` | `text-blue-600 dark:text-blue-400` |
| Empleados | `<Users>` | `text-blue-600 dark:text-blue-400` |
| Clientes | `<Users>` o `<UserCheck>` | `text-blue-600 dark:text-blue-400` |
| Insumos | `<Package2>` | `text-blue-600 dark:text-blue-400` |
| Usuarios | `<ShieldCheck>` | `text-blue-600 dark:text-blue-400` |
| Alertas | `<Bell>` | `text-orange-600` |
| Reportes | `<BarChart>` | `text-orange-600` |
| Configuración | `<Settings>` | `text-orange-600` |

---

## 10. Colores

### Paleta de colores personalizada (`@theme` en `index.css`)
| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#1e40af` | Azul principal |
| `--color-primary-dark` | `#1e3a8a` | Hover/activo |
| `--color-primary-light` | `#3b82f6` | Acentos claros |
| `--color-secondary` | `#d97706` | Dorado/ámbar |

### Modo claro → oscuro (Tailwind)
| Elemento | Modo claro | Modo oscuro |
|----------|-----------|-------------|
| Fondo de página | `bg-gray-50` | `dark:bg-slate-950` |
| Fondo de tarjeta | `bg-white` | `dark:bg-slate-900/50` |
| Borde de tarjeta | `border-gray-200` | `dark:border-slate-800` |
| Texto principal | `text-gray-900` | `dark:text-white` |
| Texto secundario | `text-gray-600` | `dark:text-gray-400` |
| Texto muted | `text-gray-500` | `dark:text-gray-400` |
| Fondo input | `bg-gray-50` | `dark:bg-slate-800` |
| Borde input | `border-gray-300` | `dark:border-slate-700` |
| Hover fila tabla | `hover:bg-gray-50` | `dark:hover:bg-slate-800/40` |

### ⚠️ Regla de oro
**Todo elemento debe tener su equivalente `dark:`** — sin excepción.  
El proyecto no tiene modo claro únicamente. Si no pones `dark:`, rompes el tema oscuro.

---

## 11. Animaciones y transiciones

### Transiciones estándar
| Contexto | Clase |
|----------|-------|
| Tarjetas / contenedores | `transition-all duration-300` |
| Colores (modo claro/oscuro) | `transition-colors duration-200` |
| Páginas del dashboard | `transition-colors duration-500` |
| Hover de elementos | `transition-all duration-200` |

### Animaciones de entrada (animaciones CSS personalizadas)
| Clase | Efecto |
|-------|--------|
| `animate-in fade-in duration-500` | Entrada con fade |
| `animate-in fade-in slide-in-from-top-4 duration-300` | Entrada desde arriba |
| `animate-in fade-in zoom-in duration-200` | Entrada con zoom (modales) |

### ⚠️ Animaciones exclusivas del landing page
Las siguientes **NO se usan en el dashboard**:
- `btn-pulse` (pulso de sombra)
- `btn-glow` / `btn-glow-white` (resplandor)
- `btn-shimmer` (barrido dorado)
- `scroll-mouse` / `scroll-wheel`
- `animate-in fade-in slide-in-from-right-2`
- `animate-in fade-in zoom-in-75`
- `animate-in fade-in scale-95`

---

## 12. Breadcrumbs

```html
<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
  <Link to="/dashboard/admin" class="flex items-center hover:text-blue-600 transition-colors">
    <Home size={14} class="mr-1" />
    <span class="hidden sm:inline">Escritorio</span>
  </Link>
  <ChevronRight size={14} class="text-gray-400" />
  <span class="font-semibold text-blue-800 dark:text-blue-400 capitalize">Página Actual</span>
</nav>
```

---

## 13. Toast de notificación

### Toast de éxito (centrado arriba)
```html
<div class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500">
  <div class="bg-white dark:bg-slate-900 border-2 border-green-500 rounded-full px-6 py-4 shadow-2xl flex items-center gap-4 border-b-4">
    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
      <CheckCircle class="w-6 h-6 text-white" />
    </div>
    <p class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">¡Operación exitosa!</p>
  </div>
</div>
```

### Toast de error (centrado abajo)
```html
<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
  <div class="bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-400/50 backdrop-blur-md">
    <AlertTriangle size={20} />
    <p class="text-sm font-bold">Error al procesar</p>
  </div>
</div>
```

---

## 14. Plantilla rápida para nueva sección

```tsx
// ============================================================
// NuevaSeccionPage.tsx — Plantilla para crear páginas del dashboard
// ============================================================

import { useState } from "react";
import { IconoPagina, Plus, Search, Loader2, AlertCircle, Edit2, Trash2 } from "lucide-react";

export default function NuevaSeccionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <IconoPagina className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Nueva Sección
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Descripción breve de lo que se gestiona aquí.
          </p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95">
          <Plus size={18} /> Nuevo
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            placeholder="Buscar..."
          />
        </div>
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* ESTADO DE CARGA */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
        </div>
      )}

      {/* TABLA */}
      {!loading && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {/* Si no hay datos: */}
                <tr>
                  <td colSpan={4} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        <IconoPagina size={28} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">No hay registros</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Crea tu primer registro para empezar.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 15. Checklist de verificación para nuevas secciones

Antes de dar por terminada una nueva página del dashboard, verificar:

- [ ] ¿El `<h1>` usa `text-2xl sm:text-3xl font-bold` y tiene su icono `w-8 h-8` de Lucide?
- [ ] ¿El subtítulo usa `text-gray-600 dark:text-gray-400 mt-1`?
- [ ] ¿El contenedor principal es `space-y-6`?
- [ ] ¿Todas las tarjetas tienen `rounded-xl`, `shadow-sm`, `border`, `transition-all duration-300`?
- [ ] ¿TODOS los elementos tienen su variante `dark:`?
- [ ] ¿Los botones de acción usan `rounded-xl`, `font-bold`, `shadow-lg`, `active:scale-95`?
- [ ] ¿Las tablas usan `<thead>` con `bg-gray-50 dark:bg-slate-800/80` y `uppercase tracking-wider`?
- [ ] ¿Los badges de estado usan `rounded-full` con el color semántico correcto?
- [ ] ¿Los inputs tienen `focus:ring-2 focus:ring-blue-500`?
- [ ] ¿NO se usaron animaciones del landing (`btn-pulse`, `btn-shimmer`, `btn-glow`)?
- [ ] ¿Los iconos son todos de `lucide-react`?
- [ ] ¿Los modales usan `rounded-3xl` con `backdrop-blur-md`?
- [ ] ¿Existen estados de carga, vacío y error?
- [ ] ¿Los breadcrumbs están presentes si la página tiene navegación anidada?
