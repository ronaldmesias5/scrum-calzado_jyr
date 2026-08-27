/**
 * Archivo: components/ui/Footer.tsx
 * Descripción: Footer común para toda la aplicación con links a políticas y términos.
 */

import { useState } from "react";
import { TermsModal } from "./TermsModal";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { CookiePolicyModal } from "./CookiePolicyModal";

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
      {showCookies && <CookiePolicyModal onClose={() => setShowCookies(false)} />}

      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Información */}
            <div>
              <h4 className="text-lg font-bold mb-4">CALZADO J&R</h4>
              <p className="text-sm text-gray-400">
                Tu tienda en línea de confianza para calzado de calidad.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Bogotá, Colombia
                <br />
                contacto@calzadojyr.com
              </p>
            </div>

            {/* Políticas Legales */}
            <div>
              <h5 className="font-semibold mb-4">Políticas</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowCookies(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Política de Cookies
                  </button>
                </li>
              </ul>
            </div>

            {/* Información Legal */}
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <p className="text-xs text-gray-400">
                Cumplimos con la Ley 1581 de 2012 de Colombia (Habeas Data).
              </p>
              <p className="text-xs text-gray-400 mt-2">
                © 2026 CALZADO J&R. Todos los derechos reservados.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500 text-center">
              Plataforma de gestión de ventas y catálogo para tiendas de calzado
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
