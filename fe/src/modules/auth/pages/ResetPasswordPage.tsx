/**
 * Archivo: pages/ResetPasswordPage.tsx
 * Descripción: Página para restablecer la contraseña con un token de recuperación.
 * ¿Para qué? Completar el flujo de forgot password.
 */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    new_password: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast("Token de recuperación no encontrado en la URL.", "error");
      return;
    }

    if (formData.new_password !== formData.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, new_password: formData.new_password });
      const msg = "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.";
      setSuccess(msg);
      showToast(msg, "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al restablecer la contraseña";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña"
    >
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          {success}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            label="Nueva contraseña"
            name="new_password"
            type="password"
            value={formData.new_password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            autoFocus
            icon={<Lock className="h-5 w-5" />}
            onChange={handleChange}
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
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Restablecer contraseña
          </Button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-[#1e40af] hover:text-[#1e3a8a]"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
