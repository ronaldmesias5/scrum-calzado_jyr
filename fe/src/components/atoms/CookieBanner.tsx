/**
 * Archivo: components/ui/CookieBanner.tsx
 * Descripción: Banner de cookies premium para consentimiento global.
 * 
 * ¿Qué? Banner persistente para gestionar el consentimiento de cookies (GDPR/Privacidad).
 * ¿Para qué? Cumplir con normativas de privacidad y centralizar el aviso global de la app.
 * ¿Impacto? Evita intrusión repetitiva y garantiza que el usuario acepte las políticas antes de navegar.
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
    // Usamos el mismo key que antes para consistencia
    const cookieConsent = localStorage.getItem("calzado_jyr_cookie_consent");
    if (!cookieConsent) {
      // Pequeño delay para que no aparezca de golpe
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("calzado_jyr_cookie_consent", JSON.stringify({
      all: true,
      necessary: true,
      timestamp: new Date().toISOString(),
    }));
    onAcceptAll();
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem("calzado_jyr_cookie_consent", JSON.stringify({
      all: false,
      necessary: true,
      timestamp: new Date().toISOString(),
    }));
    onAcceptNecessary();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 font-sans">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">
              Valoramos tu privacidad
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Utilizamos cookies para mejorar tu experiencia de navegación, ofrecerte contenido personalizado y analizar nuestro tráfico. Al hacer clic en "Aceptar todas", consientes el uso de todas las cookies. Lee nuestra{" "}
              <button
                type="button"
                onClick={onShowPolicy}
                className="text-[#1e40af] font-semibold hover:underline"
              >
                Política de Cookies
              </button>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onShowPolicy}
              className="px-5 py-2.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all shadow-sm"
            >
              Personalizar
            </button>
            <button
              type="button"
              onClick={handleAcceptNecessary}
              className="px-5 py-2.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all shadow-sm"
            >
              Rechazar todas
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-6 py-2.5 text-[13px] font-semibold text-white bg-[#1e40af] rounded-full hover:bg-[#1e3a8a] transition-all shadow-md active:scale-95"
            >
              Aceptar todas
            </button>
            
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
