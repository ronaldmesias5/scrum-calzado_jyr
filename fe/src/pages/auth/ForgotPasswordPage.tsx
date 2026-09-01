/**
 * Archivo: pages/ForgotPasswordPage.tsx
 * Descripción: Página de recuperación de contraseña de CALZADO J&R.
 * ¿Para qué? Permitir al usuario solicitar un enlace de reset por email.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/atoms/Alert';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(
        'Si el email está registrado, recibirás un enlace de recuperación.'
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al enviar el enlace';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo y te enviaremos un enlace de recuperación"
    >
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} />
        </div>
      )}

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
            setError(null);
          }}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Enviar enlace
        </Button>
      </form>

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
