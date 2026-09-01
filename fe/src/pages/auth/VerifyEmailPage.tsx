/**
 * VerifyEmailPage.tsx — Página de verificación de correo electrónico.
 *
 * Se muestra cuando el usuario hace clic en el enlace de verificación
 * enviado por email después del registro.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import api from '@/services/axios';

type VerifyStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No se proporcionó un token de verificación válido.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(
          `/api/v1/auth/verify-email?token=${token}`
        );
        setStatus('success');
        setMessage(response.data.message || 'Correo verificado exitosamente.');
      } catch (err: any) {
        setStatus('error');
        const detail = err?.response?.data?.detail;
        setMessage(
          typeof detail === 'string' ? detail : 'Error al verificar el correo.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-[#1e40af] rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">J&R</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verificación de Correo
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Verificando tu correo electrónico...
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Correo Verificado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
              >
                <Mail className="w-5 h-5" />
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Error de Verificación
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                >
                  <Mail className="w-5 h-5" />
                  Ir a Iniciar Sesión
                </Link>
                <div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
