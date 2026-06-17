/**
 * Archivo: fe/src/modules/auth/pages/ReactivationPage.tsx
 * Descripción: Página pública para solicitar reactivación de cuenta (RF-005).
 *
 * ¿Qué?
 *   Formulario para que usuarios con cuentas inactivas/suspendidas
 *   soliciten reactivación. Campos: email, motivo, teléfono, documento,
 *   evidencia (opcional). Sin autenticación requerida.
 *
 * ¿Para qué?
 *   RF-005 — Permitir a usuarios con cuenta inactiva solicitar reactivación
 *   mediante ticket revisado por admin.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, FileText, Phone, ShieldAlert, RotateCcw } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { requestReactivation, type ReactivationRequest } from "../services/api";

export function ReactivationPage() {
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
    phone: "",
    identity_document: "",
    evidence_url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.reason || !formData.phone || !formData.identity_document) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (formData.reason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres.");
      return;
    }

    if (formData.phone.trim().length < 7) {
      setError("El teléfono debe tener al menos 7 caracteres.");
      return;
    }

    if (formData.identity_document.trim().length < 8) {
      setError("El documento de identidad debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: ReactivationRequest = {
        email: formData.email.trim(),
        reason: formData.reason.trim(),
        phone: formData.phone.trim(),
        identity_document: formData.identity_document.trim(),
        evidence_url: formData.evidence_url.trim() || undefined,
      };
      const response = await requestReactivation(payload);
      setSuccess(response.message);
      setFormData({ email: "", reason: "", phone: "", identity_document: "", evidence_url: "" });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(". "));
      } else {
        setError("Error al enviar la solicitud. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Solicitar reactivación de cuenta"
      subtitle="Completa el formulario para solicitar la reactivación de tu cuenta"
    >
      {success ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6 mx-auto">
            <RotateCcw size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Solicitud enviada
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {success}
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert type="error" message={error} />}

          <InputField
            label="Correo electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tucorreo@ejemplo.com"
            icon={<Mail size={18} />}
          />

          <InputField
            label="Número de teléfono"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="3001234567"
            icon={<Phone size={18} />}
          />

          <InputField
            label="Documento de identidad"
            name="identity_document"
            type="text"
            value={formData.identity_document}
            onChange={handleChange}
            placeholder="1234567890"
            icon={<FileText size={18} />}
          />

          <InputField
            label="Enlace de evidencia (opcional)"
            name="evidence_url"
            type="url"
            value={formData.evidence_url}
            onChange={handleChange}
            placeholder="https://drive.google.com/..."
            icon={<FileText size={18} />}
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              <ShieldAlert size={16} className="inline mr-1.5" />
              Motivo de la solicitud
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explica por qué necesitas reactivar tu cuenta (mínimo 10 caracteres)..."
              rows={5}
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              {formData.reason.length}/10 caracteres mínimo
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Importante:</strong> Solo puedes solicitar reactivación si tu cuenta está{" "}
              <strong>inactiva o suspendida</strong>. Si tu cuenta está activa, simplemente{" "}
              <Link to="/auth/login" className="underline font-bold">
                inicia sesión
              </Link>{" "}
              o{" "}
              <Link to="/auth/forgot-password" className="underline font-bold">
                recupera tu contraseña
              </Link>
              .
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Enviando solicitud..." : "Enviar solicitud"}
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <Link
              to="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
