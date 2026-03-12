/**
 * Archivo: fe/src/modules/dashboard-jefe/components/layout/AdminHeader.tsx
 * Descripción: Header del dashboard administrativo (jefe).
 * 
 * ¿Qué?
 *   Header sticky con:
 *   - Título: "Panel de Administración" + Bienvenido, {fullName}
 *   - Barra de búsqueda (placeholder: "Buscar pedidos, clientes, productos...")
 *   - Notificaciones: Icono Bell con badge "4" (hardcoded, UI only)
 *   - Avatar: Círculo azul con iniciales (user.name[0] + user.last_name[0])
 *   - Dropdown: Perfil, Configuración, Cerrar sesión
 * 
 * ¿Para qué?
 *   - Mostrar nombre completo del usuario (not email)
 *   - Proveer acceso rápido a logout
 *   - Búsqueda global (TODO, no implementada)
 *   - Notificaciones (TODO, hardcoded "4")
 * 
 * ¿Impacto?
 *   ALTO — Visible en TODAS las páginas del dashboard jefe.
 *   Modificar fullName extraccción rompe: visualización de nombre.
 *   Cambiar logout flow debe sincronizarse con AuthContext.
 *   Dependencias: hooks/useAuth.ts, lucide-react, react-router-dom
 */

import { Search, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const initials = user?.name && user?.last_name
    ? `${user.name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  const fullName = user?.name && user?.last_name 
    ? `${user.name} ${user.last_name}` 
    : user?.email?.split('@')[0] ?? 'Administrador';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Título + bienvenida */}
      <div>
        <h1 className="text-sm font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-xs text-gray-500">
          Bienvenido, {fullName}
        </p>
      </div>

      {/* Búsqueda */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar pedidos, clientes, productos..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Notificaciones + usuario */}
      <div className="flex items-center gap-4">
        <button className="relative text-gray-500 hover:text-gray-800">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            4
          </span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {fullName}
            </p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
