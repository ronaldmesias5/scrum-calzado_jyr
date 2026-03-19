/**
 * Archivo: components/ui/PrivacyPolicyModal.tsx
 * Descripción: Modal con la Política de Privacidad de CALZADO J&R.
 */

import { X } from "lucide-react";
import { useEffect } from "react";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">
            Política de Privacidad
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 text-sm text-gray-600 space-y-4">
          <p className="text-xs text-gray-400">
            Última actualización: marzo 2026
          </p>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              1. Responsable del tratamiento
            </h4>
            <p>
              CALZADO J&R es responsable del tratamiento de sus datos personales.
              Nos comprometemos a cumplir con la Ley 1581 de 2012 y sus decretos
              reglamentarios en Colombia.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              2. Datos que recopilamos
            </h4>
            <p>
              Recopilamos información personal proporcionada voluntariamente:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Nombre y apellido</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Tipo y número de documento de identidad</li>
              <li>Razón social (si aplica)</li>
              <li>Información de pedidos y transacciones</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              3. Finalidad del tratamiento
            </h4>
            <p>
              Sus datos se utilizan exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Crear y gestionar su cuenta</li>
              <li>Procesar pedidos y pagos</li>
              <li>Comunicaciones relacionadas con su cuenta</li>
              <li>Cumplimiento de obligaciones legales</li>
              <li>Envío de actualizaciones y notificaciones</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              4. Compartición de datos
            </h4>
            <p>
              Sus datos personales NO serán compartidos con terceros sin su
              consentimiento expreso, salvo cuando sea requerido por ley o
              autoridades regulatorias.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              5. Seguridad de datos
            </h4>
            <p>
              Implementamos medidas de seguridad técnicas y administrativas para
              proteger sus datos contra acceso no autorizado, alteración,
              divulgación o destrucción.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              6. Derechos del usuario
            </h4>
            <p>
              Tiene derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Acceder a sus datos personales</li>
              <li>Solicitar corrección o actualización</li>
              <li>Solicitar eliminación (derecho al olvido)</li>
              <li>Presentar reclamaciones ante la Superintendencia de Industria</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              7. Retención de datos
            </h4>
            <p>
              Los datos se conservarán durante el tiempo necesario para cumplir
              con las finalidades descritas o según lo requiera la ley.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              8. Contacto
            </h4>
            <p>
              Para ejercer sus derechos o consultas sobre privacidad, contáctenos en:
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
    </div>
  );
}
