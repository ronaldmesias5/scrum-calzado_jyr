# CALZADO J&R — Frontend

Frontend React para el sistema de gestión de calzado. SPA con routing por rol, i18n y asistente IA Águila J&R.

## Stack

- React 19 + TypeScript 5.9 (strict) + Vite 7
- TailwindCSS 4 (vía `@tailwindcss/vite`, sin `tailwind.config.js`)
- React Router 7 + Axios + i18next + Lucide React
- pnpm (obligatorio, nunca npm/yarn) + Husky + lint-staged
- Vitest + Testing Library + jsdom

## Estructura

```
fe/src/
├── app/                  # Entry points (App.tsx, main.tsx, i18n.ts, ProtectedRoute, RoleProtectedRoute)
├── assets/               # Recursos estáticos
├── components/
│   ├── atoms/            # Átomos globales (Button, Modal, Toast, PageTransition, Pagination…)
│   └── layout/           # Layouts globales (AppLayout, AuthLayout…)
├── features/             # Features de negocio (Atomic Design por feature)
│   ├── admin/            # Panel admin (14 páginas)
│   ├── auth/             # Login, Register, Password Reset
│   ├── client/           # Panel cliente (6 páginas)
│   ├── employee/         # Panel empleado (6 páginas)
│   └── landing/          # Landing pública + catálogo
├── pages/                # Páginas enrutables (admin, auth, client, employee, public)
├── hooks/                # Hooks reutilizables (useAuth, useModalDialog, useChat…)
├── services/             # Servicios API (authService, aiApi, ordersApi, catalogService…)
├── store/                # Contextos globales (Auth, Theme, Toast, BadgeCounts…)
├── types/                # Tipos TypeScript compartidos
├── utils/                # Utilidades (format, routing…)
├── styles/               # Estilos globales (Tailwind)
└── locales/              # Traducciones (en, es)
```

**Alias:** `@` → `fe/src/` (definido en `vite.config.ts` y `tsconfig.json`).

## Comandos

```bash
# Instalar (pnpm obligatorio)
pnpm install

# Desarrollo (HMR, polling para Docker en Windows)
pnpm dev

# Build (typecheck + bundle)
pnpm build

# Preview del build
pnpm preview

# Tests
pnpm test              # vitest run (single pass)
pnpm test:watch        # vitest watch
pnpm test:coverage     # coverage v8

# Lint + formato
pnpm lint              # ESLint
pnpm format            # Prettier write
pnpm format:check      # Prettier check

# Typecheck
npx tsc -b
```

## Variables de entorno

```env
VITE_API_URL=http://localhost:8000
VITE_USE_PROXY=true   # axios usa URLs relativas, Vite proxea /api → be:8000
```

## Patrones

- **Modal base** (`components/atoms/Modal.tsx`): `createPortal`, `role="dialog"`, focus trap, Escape. Usar con `useModalDialog`.
- **PageTransition** (`components/atoms/PageTransition.tsx`): envuelve `<Outlet />` en layouts, `fade-in` + `slide-in-from-top-4`.
- **ChatWidget** (`features/ai/components/organisms/ChatWidget.tsx`): Águila J&R 🦅, FAB con tooltip, `position` left (landing) / right (dashboards).
- **Tailwind v4**: `@theme` en `styles/index.css`, sin `tailwind.config.js`.

## Docker

```bash
# Dev (con hot-reload)
docker compose up -d --build

# Prod (nginx + dist)
docker compose -f docker-compose.prod.yml up -d --build
```

Vite en Docker usa `usePolling: true` (Windows) y volumen anónimo para `node_modules`.
