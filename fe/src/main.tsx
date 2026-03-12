/**
 * Archivo: src/main.tsx
 * Descripción: Punto de entrada de la aplicación React.
 * 
 * ¿Qué?
 *   Monta (renderiza) el componente <App> en el elemento HTML con id="root".
 *   Envuelve en <StrictMode> para detectar potenciales bugs en desarrollo.
 * 
 * ¿Para qué?
 *   Inicializar la aplicación React. Puente entre:
 *   - Archivo HTML (index.html) que tiene <div id="root">
 *   - Componente React (App.tsx) que define la interfaz
 * 
 * ¿Impacto?
 *   Crítico. Sin esto:
 *   - React no se renderiza en el navegador
 *   - Ves una página en blanco
 *   - Nada funciona
 *   
 *   Este archivo NO debe modificarse a menudo.
 *   El cambio real está en App.tsx y sus componentes hijos.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ════════════════════════════════════════
// 🚀 Renderizar la aplicación
// ════════════════════════════════════════

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
