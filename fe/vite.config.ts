/**
 * Archivo: fe/vite.config.ts
 * Descripción: Configuración de Vite para build y dev server del frontend.
 * 
 * ¿Qué?
 *   Configuración con:
 *   - Plugins: @vitejs/plugin-react (JSX transform), @tailwindcss/vite (JIT)
 *   - Alias: @ = ./src (import from "@/components/...")
 *   - Dev server: port 5173, host 0.0.0.0, watch polling (Windows/Docker)
 *   - Test: Vitest con jsdom, coverage V8, globals enabled
 * 
 * ¿Para qué?
 *   - Compilar TypeScript + JSX sin config adicional
 *   - Hot reload rápido en desarrollo (HMR)
 *   - Polling para Windows/Docker (inotify no funciona)
 *   - Path alias @ para imports limpios
 *   - Testing unitario con Vitest (compatible con Vite)
 * 
 * ¿Impacto?
 *   CRÍTICO — Sin este archivo, Vite no compila ni arranca dev server.
 *   Modificar alias @ rompe: TODOS los imports (import ... from "@/...")
 *   Cambiar port requiere: actualizar docker-compose.yml (5173:5173)
 *   watch.usePolling=true necesario para Docker en Windows (sin esto, no detecta cambios).
 *   Dependencias: package.json (vite, vitest, @vitejs/plugin-react)
 */

/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    open: false,
    proxy: {
      "/api": {
        target: "http://be:8000",
        changeOrigin: true,
      },
    },
    watch: {
      // En Windows con Docker, inotify no funciona — polling detecta cambios de archivos
      usePolling: true,
      interval: 500,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/types/**",
      ],
    },
  },
});
