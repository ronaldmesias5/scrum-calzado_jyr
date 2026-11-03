// ════════════════════════════════════════
// 📄 Configuración de Vite para build y dev server del frontend
// ════════════════════════════════════════

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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "axios"],
        },
      },
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
