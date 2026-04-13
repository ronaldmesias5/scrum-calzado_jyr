/**
 * Archivo: fe/src/modules/auth/pages/LoginPage.tsx
 * Descripción: Página de login para usuarios registrados de CALZADO J&R.
 * 
 * ¿Qué?
 *   Formulario de autenticación con:
 *   - Inputs: email, password
 *   - Checkbox "Recordarme" (no implementado, UI only)
 *   - Manejo de errores (Alert component)
 *   - Redirección automática a dashboard según rol/ocupación
 *   - Redirección a /auth/change-password si must_change_password=true
 * 
 * ¿Para qué?
 *   - Permitir login de usuarios existentes (admin, employee, client)
 *   - Validar credenciales con backend POST /api/v1/auth/login
 *   - Guardar tokens en sessionStorage (via AuthContext)
 *   - Redirigir automáticamente al dashboard correcto
 * 
 * ¿Impacto?
 *   CRÍTICO — Sin login funcional, usuarios no pueden acceder al sistema.
 *   Modificar formData rompe: validación, envío a backend.
 *   Modificar getDashboardRoute() debe sincronizarse con utils/routing.ts
 *   Dependencias: hooks/useAuth.ts, components/ui/*, utils/routing.ts
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getDashboardRoute } from "@/utils/routing";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userData = await login(formData);
      
      // Si el usuario debe cambiar contraseña en el primer inicio
      if (userData?.must_change_password) {
        navigate("/auth/change-password", { replace: true });
        return;
      }
      
      // Redirigir al dashboard correspondiente según rol y ocupación
      const dashboardRoute = getDashboardRoute(userData);
      navigate(dashboardRoute, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('common.login')}
      subtitle={t('auth.subtitleLogin') || "Ingresa tus credenciales para acceder a tu panel"}
    >
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

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
          <Link
            to="/auth/forgot-password"
            className="text-sm font-bold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} className="py-4 text-lg font-extrabold shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all">
          {t('common.login')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
        {t('auth.noAccountPhrase') || "¿No tienes cuenta?"}{" "}
        <Link
          to="/auth/register"
          className="font-extrabold text-[#1e40af] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4"
        >
          {t('common.register')}
        </Link>
      </p>
    </AuthLayout>
  );
}
