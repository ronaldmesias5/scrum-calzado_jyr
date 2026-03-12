/**
 * Archivo: fe/src/modules/auth/pages/ChangePasswordPage.tsx
 * Descripción: Página para cambiar contraseña (requiere autenticación).
 * 
 * ¿Qué?
 *   Formulario con:
 *   - Inputs: current_password, new_password, confirmPassword
 *   - Validación: contraseñas coinciden
 *   - Success: Muestra mensaje y limpia form
 *   - Redirección: Si must_change_password=true, redirige después de cambiar
 * 
 * ¿Para qué?
 *   - Permitir usuarios cambien contraseña desde dashboard
 *   - Flow forzado: Si must_change_password=true (primer login), obligar cambio
 *   - Validar actual contraseña (seguridad, no cualquiera cambia)
 * 
 * ¿Impacto?
 *   MEDIO — Usuarios con must_change_password=true DEBEN pasar por aquí.
 *   Modificar flujo rompe: onboarding de empleados creados por admin.
 *   Dependencias: hooks/useAuth.ts (changePassword), components/ui/*
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, user } = useAuth();

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.new_password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      setSuccess("Contraseña actualizada exitosamente.");
      setFormData({ current_password: "", new_password: "", confirmPassword: "" });
      
      // Redirigir al dashboard después de 1.5 segundos
      setTimeout(() => {
        const role = user?.role_name ?? '';
        if (role === 'admin' || role === 'employee') {
          navigate("/dashboard/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cambiar la contraseña";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Cambiar contraseña
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <InputField
            label="Contraseña actual"
            name="current_password"
            type="password"
            value={formData.current_password}
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
            autoFocus
            icon={<Lock className="h-5 w-5" />}
            onChange={handleChange}
          />

          <InputField
            label="Nueva contraseña"
            name="new_password"
            type="password"
            value={formData.new_password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            icon={<KeyRound className="h-5 w-5" />}
            onChange={handleChange}
          />

          <InputField
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            placeholder="Repite la nueva contraseña"
            autoComplete="new-password"
            icon={<ShieldCheck className="h-5 w-5" />}
            onChange={handleChange}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Actualizar contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}
