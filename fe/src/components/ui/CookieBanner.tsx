/**
 * Archivo: components/ui/CookieBanner.tsx
 * Descripción: Banner de cookies flotante para consentimiento de cookies.
 * Se muestra solo una vez al visitante, luego se almacena en localStorage.
 */

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface CookieBannerProps {
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  onShowPolicy: () => void;
}

export function CookieBanner({
  onAcceptAll,
  onAcceptNecessary,
  onShowPolicy,
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya tomó una decisión
    const cookieConsent = localStorage.getItem("calzado_jyr_cookie_consent");
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("calzado_jyr_cookie_consent", JSON.stringify({
      all: true,
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    onAcceptAll();
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem("calzado_jyr_cookie_consent", JSON.stringify({
      all: false,
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    onAcceptNecessary();
    setIsVisible(false);
  };

  const handleShowPolicy = () => {
    onShowPolicy();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 text-white border-t-2 border-[#1e3a8a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-2">
              🍪 Usamos cookies
            </h3>
            <p className="text-xs text-gray-300">
              Utilizamos cookies para mejorar tu experiencia de navegación,
              analizar el uso del sitio y personalizar contenido. Algunas cookies
              son esenciales, mientras que otras son opcionales. Lee nuestra{" "}
              <button
                type="button"
                onClick={handleShowPolicy}
                className="underline hover:text-gray-100 font-medium"
              >
                política de cookies
              </button>{" "}
              para más información.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptNecessary}
              className="px-3 py-2 text-xs font-medium text-gray-900 bg-gray-300 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Solo necesarias
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3 py-2 text-xs font-medium text-white bg-[#1e40af] rounded hover:bg-[#1e3a8a] transition-colors whitespace-nowrap"
            >
              Aceptar todo
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-gray-800 transition-colors"
              aria-label="Cerrar banner de cookies"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
