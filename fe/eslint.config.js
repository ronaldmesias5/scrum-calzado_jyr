/**
 * Archivo: eslint.config.js
 * Descripción: Configuración de ESLint para linting de código JavaScript/TypeScript.
 * 
 * ¿Para qué?
 *   - Define reglas de código limpio (naming, indentation, no-unused-vars)
 *   - Integra React-specific rules (react-hooks, react-refresh)
 *   - integra TypeScript support
 *   - Ejecutado con: npm run lint
 * 
 * ¿Impacto?
 *   MEDIO — Mejora calidad de código, pero no bloquea builds.
 *   Ignorar lint warnings puede dejar bugs silenciosos.
 */

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);
