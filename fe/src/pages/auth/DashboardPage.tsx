// ════════════════════════════════════════
// 📄 Página de dashboard genérico (legacy, redirige automáticamente)
// ════════════════════════════════════════

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/utils/routing';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirigir automáticamente al dashboard correcto
  useEffect(() => {
    if (user) {
      const correctRoute = getDashboardRoute(user);
      if (correctRoute !== '/dashboard') {
        navigate(correctRoute, { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">
        Bienvenido, {user ? `${user.name} ${user.last_name}` : ''}
      </h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Panel de CALZADO J&R
        </h2>
        <p className="text-sm text-gray-600">
          Tu cuenta está activa. Desde aquí podrás acceder a todas las
          funcionalidades del sistema.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Rol</p>
            <p className="capitalize text-gray-900">{user?.role_name || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
