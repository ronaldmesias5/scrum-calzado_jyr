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

import { useState } from 'react';
import { Search, Bell, LogOut, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NotificationsPanel from './NotificationsPanel';
import { useBadgeCounts } from '../../context/BadgeCountsContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function AdminHeader() {
  const { t } = useTranslation();
  const { user, logout, logoutAllDevices } = useAuth();
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { counts } = useBadgeCounts();
  // Total de avisos = pedidos pendientes + usuarios sin validar
  const totalBadge = counts.pedidos + counts.usuarios;

  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('¿Estás seguro de cerrar sesión en TODOS tus dispositivos? Deberás volver a ingresar en este también.')) return;
    
    setIsLoggingOutAll(true);
    try {
      await logoutAllDevices();
      navigate('/auth/login');
    } catch {
      alert('Error al cerrar sesiones globales.');
    } finally {
      setIsLoggingOutAll(false);
    }
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-500">
      {/* Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer flex-shrink-0"
        onClick={() => navigate('/dashboard/admin')}
      >
        <img src="/logo.png" alt="CALZADO J&R" className="h-10 w-10 object-contain" />
        <div className="hidden lg:block">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t('dashboard.header.adminRole')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.header.welcome')}, {fullName}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-80 transition-colors">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder={t('dashboard.header.searchPlaceholder')}
          className="bg-transparent text-sm text-gray-600 dark:text-gray-200 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Notificaciones + usuario */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        
        <button
          onClick={() => setIsPanelOpen(true)}
          className="relative text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          title={t('dashboard.header.notifications')}
        >
          <Bell size={20} />
          {totalBadge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center font-bold leading-none">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-800 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.header.adminRole')}</p>
          </div>
        </div>

        <button
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-50"
          title={t('dashboard.header.logoutAllTooltip')}
        >
          {isLoggingOutAll ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShieldAlert size={18} />
          )}
        </button>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title={t('dashboard.header.logoutTooltip')}
        >
          <LogOut size={18} />
        </button>
      </div>

      <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </header>
  );
}
