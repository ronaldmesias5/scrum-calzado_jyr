import { useState } from 'react';
import { Search, Bell, LogOut, ShieldAlert, Loader2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NotificationsPanel from './NotificationsPanel';
import { useBadgeCounts } from '../../context/BadgeCountsContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useHeaderAnimation } from '@/hooks/useHeaderAnimation';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { t } = useTranslation();
  const { user, logout, logoutAllDevices } = useAuth();
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { counts } = useBadgeCounts();
  const { getHeaderClasses, getLogoClasses, getSearchClasses, getButtonsClasses } = useHeaderAnimation();
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
    <header className={`h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 transition-colors duration-500 ${getHeaderClasses()}`}>
      <div className="flex items-center gap-3">
        {/* Botón Hamburguesa (Móvil) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <div
          className={`flex items-center gap-3 cursor-pointer flex-shrink-0 ${getLogoClasses()}`}
          onClick={() => navigate('/dashboard/admin')}
        >
          <img src="/logo.png" alt="CALZADO J&R" className="h-8 w-8 lg:h-10 lg:w-10 object-contain" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t('dashboard.header.adminRole')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{t('dashboard.header.welcome')}, {fullName}</p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className={`hidden md:flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-48 lg:w-80 transition-colors ${getSearchClasses()}`}>
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder={t('dashboard.header.searchPlaceholder')}
          className="bg-transparent text-sm text-gray-600 dark:text-gray-200 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Notificaciones + usuario */}
      <div className={`flex items-center gap-2 lg:gap-4 ${getButtonsClasses()}`}>
        <div className="hidden sm:flex items-center gap-2">
          <LanguageSwitcher />
        </div>
        <ThemeToggle />
        
        <button
          onClick={() => setIsPanelOpen(true)}
          className="relative text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors p-1"
          title={t('dashboard.header.notifications')}
        >
          <Bell size={20} />
          {totalBadge > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center font-bold leading-none">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-gray-100 dark:border-slate-800 sm:border-0 sm:pl-0">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-blue-800 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs lg:text-sm font-bold shadow-lg">
            {initials}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.header.adminRole')}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
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
      </div>

      <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </header>
  );
}
