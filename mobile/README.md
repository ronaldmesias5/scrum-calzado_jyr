# Calzado J&R — App Móvil

App móvil para **CALZADO J&R**, sistema de gestión de pedidos, producción e inventario de una
fábrica de calzado. Parte del monorepo `scrum-calzado_jyr`, consume la misma API FastAPI
del backend (`../be/`) con JWT.

- **Stack**: Expo SDK 54 · React Native 0.81 · React 19 · expo-router 6 · TypeScript strict ·
  NativeWind (Tailwind) · TanStack Query · Zustand · Axios
- **Rutas**: file-based routing con expo-router (`app/`)

## Requisitos

- Node 20+ (probado con Node 24)
- pnpm (`npm i -g pnpm`)
- Backend web corriendo (repo `scrum-calzado_jyr`): `docker compose up -d be db`

## Instalación

```bash
pnpm install
```

## Uso

```bash
pnpm start      # expo start
pnpm android    # emulador Android
pnpm ios        # simulador iOS
pnpm web        # navegador
```

### Conectar al backend

Por defecto la app usa:
- Android emulador → `http://10.0.2.2:8000/api/v1`
- iOS / web → `http://localhost:8000/api/v1`

En un **celular físico** define la IP LAN del PC en `.env`:

```bash
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api/v1
```

### Cuenta de prueba

```
Jefe:   ronald.jefe@gmail.com / Test123456!
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm start` | Arranca Metro |
| `pnpm android` / `pnpm ios` / `pnpm web` | Abre en la plataforma indicada |
| `pnpm typecheck` | TypeScript strict (`tsc --noEmit`) |
| `pnpm lint` | ESLint (eslint-config-expo) |

## Estado del desarrollo

Fases completadas: **F0** (fundación: Expo 54 + NativeWind + alias `@/`), **F1** (auth: login,
refresh JWT con SecureStore, rutas protegidas por rol), **F2** (navegación: bottom tabs + HubMenu
overlay con 13 secciones del jefe), **F3** (inicio: StatCards reales + pedidos recientes + settings).
El resto del roadmap está en `AGENTS.md`.

## Documentación

- `AGENTS.md` — guía técnica para agentes de OpenCode (stack, gotchas, plan por fases)
- Repo web: https://github.com/anomalyco/scrum-calzado_jyr (backend FastAPI y frontend web)