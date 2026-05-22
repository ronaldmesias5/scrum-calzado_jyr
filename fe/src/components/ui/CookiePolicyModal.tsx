/**
 * Archivo: components/ui/CookiePolicyModal.tsx
 * Descripción: Modal con la Política de Cookies de CALZADO J&R.
 */

import { X } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface CookiePolicyModalProps {
  onClose: () => void;
}

export function CookiePolicyModal({ onClose }: CookiePolicyModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Política de Cookies"
      size="md"
    >
      <div className="flex flex-col">

        {/* Contenido con scroll */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 text-sm text-gray-600 space-y-4">
          <p className="text-xs text-gray-400">
            Última actualización: marzo 2026
          </p>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              1. ¿Qué son las cookies?
            </h4>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en su
              navegador al visitar nuestro sitio. Permiten mejorar su experiencia
              de usuario y recordar sus preferencias.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              2. Tipos de cookies que usamos
            </h4>
            <p>
              <strong>Cookies esenciales:</strong> Necesarias para el funcionamiento
              básico (autenticación, seguridad, sesiones).
            </p>
            <p className="mt-2">
              <strong>Cookies de análisis:</strong> Ayudan a entender cómo usa el
              sitio para mejorar el servicio.
            </p>
            <p className="mt-2">
              <strong>Cookies de preferencia:</strong> Recordamos sus
              configuraciones y preferencias.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              3. Información almacenada
            </h4>
            <p>
              Las cookies almacenan:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Token de autenticación (JWT)</li>
              <li>Preferencias de idioma y tema</li>
              <li>ID de sesión</li>
              <li>Información de carrito (si aplica)</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              4. Consentimiento
            </h4>
            <p>
              Al utilizar CALZADO J&R, usted acepta el uso de cookies. Puede
              deshabilitarlas en su navegador, pero esto puede afectar el
              funcionamiento correcto del sitio.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              5. Duración
            </h4>
            <p>
              <strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador.
            </p>
            <p className="mt-2">
              <strong>Cookies persistentes:</strong> Permanecen hasta 30 días o
              hasta que las elimine manualmente.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              6. Control de cookies
            </h4>
            <p>
              Puede:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Habilitar o deshabilitar cookies en su navegador</li>
              <li>Establecer cookies como "Solicitar consentimiento"</li>
              <li>Limpiar cookies automáticamente al salir</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              7. Terceros
            </h4>
            <p>
              No compartimos cookies con terceros sin su consentimiento. Nuestro
              sitio no incluye herramientas de terceros que almacenen datos.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              8. Cambios en esta política
            </h4>
            <p>
              CALZADO J&R puede actualizar esta política en cualquier momento.
              Los cambios serán efectivos inmediatamente.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              9. Contacto
            </h4>
            <p>
              Para preguntas sobre cookies, contáctenos en:
              <strong> contacto@calzadojyr.com</strong>
            </p>
          </section>
        </div>

        {/* Pie del modal */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
