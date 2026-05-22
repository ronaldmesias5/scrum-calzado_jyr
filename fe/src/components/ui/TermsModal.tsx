/**
 * Archivo: components/ui/TermsModal.tsx
 * Descripción: Modal con los Términos y Condiciones de CALZADO J&R.
 * ¿Para qué? Mostrar el texto legal al usuario antes de aceptar en el registro.
 */

import { X } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface TermsModalProps {
  onClose: () => void;
}

export function TermsModal({ onClose }: TermsModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Términos y Condiciones de Uso"
      size="md"
    >
      <div className="flex flex-col">

        {/* Contenido con scroll */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 text-sm text-gray-600 space-y-4">
          <p className="text-xs text-gray-400">
            Última actualización: febrero 2026
          </p>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              1. Aceptación de los términos
            </h4>
            <p>
              Al crear una cuenta en CALZADO J&R, el usuario acepta cumplir con
              estos Términos y Condiciones. Si no está de acuerdo, no debe
              utilizar la plataforma.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              2. Uso de la cuenta
            </h4>
            <p>
              El usuario es responsable de mantener la confidencialidad de su
              contraseña y de todas las actividades realizadas bajo su cuenta.
              Deberá notificar de inmediato a CALZADO J&R sobre cualquier uso
              no autorizado.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              3. Datos personales
            </h4>
            <p>
              CALZADO J&R recopila información personal (nombre, correo
              electrónico) con el fin exclusivo de gestionar su cuenta y
              procesar pedidos. Los datos no serán compartidos con terceros sin
              su consentimiento, de acuerdo con la Ley 1581 de 2012 de
              Protección de Datos Personales de Colombia.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              4. Validación de cuenta
            </h4>
            <p>
              Las cuentas nuevas quedan en estado pendiente y deben ser
              validadas por un administrador antes de poder acceder al sistema.
              CALZADO J&R se reserva el derecho de rechazar o suspender cuentas
              a su discreción.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              5. Conducta del usuario
            </h4>
            <p>
              El usuario se compromete a no utilizar la plataforma para
              actividades ilegales, fraudulentas o que perjudiquen a terceros.
              Queda prohibido el uso de información falsa al momento del
              registro.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              6. Modificaciones
            </h4>
            <p>
              CALZADO J&R se reserva el derecho de modificar estos términos en
              cualquier momento. Los cambios serán notificados a través de la
              plataforma y entrarán en vigencia desde su publicación.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-gray-800">
              7. Contacto
            </h4>
            <p>
              Para cualquier inquietud relacionada con estos términos, puede
              contactarnos en: <strong>contacto@calzadojyr.com</strong> o en
              nuestra dirección en Bogotá, Colombia.
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
