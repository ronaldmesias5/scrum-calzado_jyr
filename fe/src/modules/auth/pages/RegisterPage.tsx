/**
 * Archivo: fe/src/modules/auth/pages/RegisterPage.tsx
 * Descripción: Página de registro de nuevos clientes de CALZADO J&R.
 * 
 * ¿Qué?
 *   Formulario extenso con:
 *   - Inputs: name, last_name, email, phone, identity_document, business_name, password
 *   - SELECT: identity_document_type_id (carga desde GET /api/v1/type-documents)
 *   - Checkbox: Aceptar términos y condiciones (TermsModal)
 *   - Validaciones: contraseñas coinciden, términos aceptados
 * 
 * ¿Para qué?
 *   - Permitir auto-registro de clientes (role=client automático)
 *   - Validar datos con backend POST /api/v1/auth/register
 *   - Mostrar success message: "Cuenta creada, pendiente de validación"
 *   - Cargar dinámicamente tipos de documento desde backend
 * 
 * ¿Impacto?
 *   ALTO — Sin registro, clientes no pueden crear cuentas (solo admin los crearía).
 *   Cuenta creada queda is_validated=false hasta que admin valide.
 *   Modificar formData debe sincronizarse con backend UserCreate schema.
 *   Dependencias: hooks/useAuth.ts, api/type-documents.ts, types/auth.ts,
 *                components/ui/TermsModal.tsx
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, KeyRound, Phone, FileText, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TermsModal } from "@/components/ui/TermsModal";
import { PrivacyPolicyModal } from "@/components/ui/PrivacyPolicyModal";
import { CookiePolicyModal } from "@/components/ui/CookiePolicyModal";
import { getTypeDocuments } from "@/api/type-documents";
import { TypeDocument } from "@/types/auth";

export function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    phone: "",
    identity_document_type_id: "",
    identity_document: "",
    business_name: "",
    password: "",
    confirmPassword: "",
  });
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Cargar tipos de documentos al montar
  useEffect(() => {
    const loadTypeDocuments = async () => {
      try {
        const docs = await getTypeDocuments();
        setTypeDocuments(docs);
      } catch (err) {
        console.error("Error loading type documents:", err);
      }
    };
    loadTypeDocuments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // El consentimiento se da al hacer clic en el botón, según el nuevo diseño UX.

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        identity_document_type_id: formData.identity_document_type_id || undefined,
        identity_document: formData.identity_document || undefined,
        business_name: formData.business_name || undefined,
        password: formData.password,
      });
      setSuccess(
        "Cuenta creada exitosamente. Pendiente de validación por el administrador. Revisa tu correo para la confirmación de tu cuenta."
      );
      setFormData({ 
        name: "",
        last_name: "",
        email: "", 
        phone: "",
        identity_document_type_id: "",
        identity_document: "",
        business_name: "",
        password: "", 
        confirmPassword: "" 
      });
      // Estados de aceptación ya no se resetean manualmente ya que son implícitos
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear la cuenta";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    <AuthLayout
      title="Crear cuenta"
      subtitle="Completa tus datos para registrarte"
    >
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Nombres"
          name="name"
          type="text"
          value={formData.name}
          placeholder="Juan Carlos"
          autoComplete="given-name"
          autoFocus
          icon={<User className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label="Apellidos"
          name="last_name"
          type="text"
          value={formData.last_name}
          placeholder="García Rodríguez"
          autoComplete="family-name"
          icon={<User className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label="Correo electrónico"
          name="email"
          type="email"
          value={formData.email}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          icon={<Mail className="h-5 w-5" />}
          onChange={handleChange}
        />

        {/* Selector de tipo de documento */}
        <div className="mb-4">
          <label htmlFor="identity_document_type_id" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de documento
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              id="identity_document_type_id"
              name="identity_document_type_id"
              value={formData.identity_document_type_id}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent outline-none transition"
            >
              <option value="">Selecciona tu tipo de documento</option>
              {typeDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <InputField
          label="Documento de identidad"
          name="identity_document"
          type="text"
          value={formData.identity_document}
          placeholder="1234567890"
          icon={<FileText className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label="Teléfono"
          name="phone"
          type="tel"
          value={formData.phone}
          placeholder="+57 3001234567"
          autoComplete="tel"
          icon={<Phone className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label="Nombre del comercio (opcional)"
          name="business_name"
          type="text"
          value={formData.business_name}
          placeholder="Ej: Tienda Mi Calzado"
          icon={<Store className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label="Contraseña"
          name="password"
          type="password"
          value={formData.password}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          icon={<Lock className="h-5 w-5" />}
          onChange={handleChange}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
        />

        <InputField
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          icon={<KeyRound className="h-5 w-5" />}
          onChange={handleChange}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
        />

        {/* Texto de aceptación consolidado */}
        <div className="mb-6 text-[13px] text-gray-500 leading-relaxed text-center sm:text-left">
          Al hacer clic en "Crear cuenta", acepto los{" "}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="font-medium text-[#1e40af] underline hover:text-[#1e3a8a]"
          >
            Términos y Condiciones
          </button>{" "}
          de CALZADO J&R, y autorizo el tratamiento de mis datos personales de acuerdo con la{" "}
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="font-medium text-[#1e40af] underline hover:text-[#1e3a8a]"
          >
            Política de Privacidad
          </button>.
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="font-medium text-[#1e40af] hover:text-[#1e3a8a]"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
    </>
  );
}
