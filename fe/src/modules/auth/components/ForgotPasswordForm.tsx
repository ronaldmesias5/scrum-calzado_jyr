/**
 * ForgotPasswordForm.tsx — Forgot password form extracted for use inside AuthModals.
 * Props: onSwitchToLogin (switch back to login modal).
 */

import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

interface ForgotPasswordFormProps {
  onSwitchToLogin?: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      showToast("Si el email está registrado, recibirás un enlace de recuperación.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar el enlace";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Correo electrónico"
          name="email"
          type="email"
          value={email}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          autoFocus
          icon={<Mail className="h-5 w-5" />}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Enviar enlace
        </Button>
      </form>

      <p className="mt-6 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-medium text-[#1e40af] hover:text-[#1e3a8a] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Volver al inicio de sesión
        </button>
      </p>
    </>
  );
}