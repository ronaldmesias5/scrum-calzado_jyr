/**
 * LoginForm.tsx — Login form extracted for use inside AuthModals.
 * Props: onSuccess (called after successful login), onSwitchToRegister, onSwitchToForgot.
 */

import { useState } from "react";
import { Mail, Lock, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { getDashboardRoute } from "@/utils/routing";
import { requestNewInvitation } from "@/modules/auth/services/api";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgot?: () => void;
  onSwitchToReactivation?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onSwitchToForgot, onSwitchToReactivation }: LoginFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { showToast } = useToast();

  const rememberedEmail = localStorage.getItem("remembered_email") || "";
  const [formData, setFormData] = useState({ email: rememberedEmail, password: "" });
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationExpired, setInvitationExpired] = useState(false);
  const [requestingNew, setRequestingNew] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setInvitationExpired(false);
  };

  const handleRequestNewInvitation = async () => {
    setRequestingNew(true);
    try {
      await requestNewInvitation(formData.email);
      showToast("Se ha enviado una nueva invitación a tu correo electrónico.", "success");
      setInvitationExpired(false);
    } catch {
      showToast("No se pudo procesar la solicitud. Verifica tu correo.", "error");
    } finally {
      setRequestingNew(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login({ ...formData, remember_me: rememberMe });

      if (rememberMe) {
        localStorage.setItem("remembered_email", formData.email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      if (userData?.must_change_password) {
        onSuccess?.();
        navigate("/change-password", { replace: true });
        return;
      }

      const dashboardRoute = getDashboardRoute(userData);
      onSuccess?.();
      navigate(dashboardRoute, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      const isExpired = message.toLowerCase().includes("expirado") || message.toLowerCase().includes("invitación");
      if (isExpired) {
        setInvitationExpired(true);
      }
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label={t('auth.email')}
          name="email"
          type="email"
          value={formData.email}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          autoFocus
          icon={<Mail className="h-5 w-5" />}
          onChange={handleChange}
        />

        <InputField
          label={t('auth.password')}
          name="password"
          type="password"
          value={formData.password}
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock className="h-5 w-5" />}
          onChange={handleChange}
        />

        <div className="mb-6 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#1e3a8a] cursor-pointer"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('auth.rememberMe')}</span>
          </label>
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-sm font-bold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} className="py-4 text-lg font-extrabold shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all">
          {t('common.login')}
        </Button>
      </form>

      {invitationExpired && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-3">
            Tu contraseña temporal ha expirado. Solicita una nueva invitación a tu correo.
          </p>
          <button
            type="button"
            onClick={handleRequestNewInvitation}
            disabled={requestingNew || !formData.email}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
          >
            {requestingNew ? (
              <span className="animate-pulse">Enviando...</span>
            ) : (
              <>
                <Send size={14} />
                Solicitar nueva invitación
              </>
            )}
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
        {t('auth.noAccountPhrase') || "¿No tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-extrabold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4"
        >
          {t('common.register')}
        </button>
      </p>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Tu cuenta fue suspendida?{" "}
        <button
          type="button"
          onClick={onSwitchToReactivation}
          className="font-bold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-4 transition-colors cursor-pointer"
        >
          Solicita reactivación aquí
        </button>
      </p>
    </>
  );
}