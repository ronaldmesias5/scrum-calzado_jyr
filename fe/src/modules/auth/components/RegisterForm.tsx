/**
 * RegisterForm.tsx — Register form extracted for use inside AuthModals.
 * Uses 2-column grid layout with compact document type selector.
 * Props: onSuccess (called after successful registration), onSwitchToLogin.
 */

import { useState, useEffect } from "react";
import { User, Mail, Lock, KeyRound, Phone, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { TermsModal } from "@/components/ui/TermsModal";
import { PrivacyPolicyModal } from "@/components/ui/PrivacyPolicyModal";
import { getTypeDocuments } from "@/api/type-documents";
import { TypeDocument } from "@/types/auth";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { useTranslation } from "react-i18next";
import { getDocAbbreviation } from "@/utils/type-documents";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
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
  const { showToast } = useToast();

  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    getTypeDocuments()
      .then((data) => setTypeDocuments(data))
      .catch((err) => console.error("Error loading document types:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    if (!acceptedPolicies) {
      showToast("Debes aceptar los términos y la política de privacidad para continuar", "error");
      return;
    }

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
        accepted_terms: true,
      });
      setFormData({
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
      setAcceptedPolicies(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la cuenta";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
          {/* Row 1: Names */}
          <InputField
            label={t('auth.names') || "Nombres"}
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
            label={t('auth.lastNames') || "Apellidos"}
            name="last_name"
            type="text"
            value={formData.last_name}
            placeholder="García Rodríguez"
            autoComplete="family-name"
            icon={<User className="h-5 w-5" />}
            onChange={handleChange}
          />

          {/* Row 2: Contact */}
          <InputField
            label={t('auth.email')}
            name="email"
            type="email"
            value={formData.email}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            icon={<Mail className="h-5 w-5" />}
            onChange={handleChange}
          />

          <InputField
            label={t('auth.phone') || "Teléfono"}
            name="phone"
            type="tel"
            value={formData.phone}
            placeholder="+57 3001234567"
            autoComplete="tel"
            icon={<Phone className="h-5 w-5" />}
            onChange={handleChange}
          />

          {/* Row 3: Doc type + Num (left) | Business name (right) */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.docType') || "Tipo Doc"} / {t('auth.idDoc') || "N° Documento"}
            </label>
            <div className="flex gap-2">
              <div className="relative w-24">
                <select
                  id="identity_document_type_id"
                  name="identity_document_type_id"
                  value={formData.identity_document_type_id}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-center text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">...</option>
                  {typeDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {getDocAbbreviation(doc.name)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                name="identity_document"
                type="text"
                value={formData.identity_document}
                placeholder="1234567890"
                onChange={handleChange}
                className="block flex-1 rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-4 text-sm text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <InputField
            label={t('auth.businessName') || "Nombre del comercio (opcional)"}
            name="business_name"
            type="text"
            value={formData.business_name}
            placeholder="Ej: Tienda Mi Calzado"
            icon={<Store className="h-5 w-5" />}
            onChange={handleChange}
          />

          {/* Row 4: Passwords */}
          <InputField
            label={t('auth.password')}
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
            label={t('auth.confirmPassword') || "Confirmar contraseña"}
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
        </div>

        {formData.password && (
          <div className="mb-4">
            <PasswordStrengthIndicator password={formData.password} />
          </div>
        )}

        <div className="mb-4">
          <label className="flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(e) => {
                setAcceptedPolicies(e.target.checked);
              }}
              className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 accent-[#1e3a8a] cursor-pointer"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('auth.acceptTermsPart1') || "He leído y acepto los"}{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-extrabold text-[#1e40af] dark:text-blue-400 underline decoration-2 underline-offset-4 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {t('auth.termsAndConditions') || "Términos y Condiciones"}
              </button>{" "}
              {t('auth.acceptTermsPart2') || "y la"}{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="font-extrabold text-[#1e40af] dark:text-blue-400 underline decoration-2 underline-offset-4 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {t('auth.privacyPolicy') || "Política de Privacidad"}
              </button>{" "}
              {t('auth.acceptTermsPart3') || "de CALZADO J&R."}
            </span>
          </label>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} disabled={!acceptedPolicies} className="py-3 text-base font-extrabold shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all">
          {t('common.register')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
        {t('auth.haveAccountPhrase') || "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-extrabold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4"
        >
          {t('common.login')}
        </button>
      </p>
    </>
  );
}