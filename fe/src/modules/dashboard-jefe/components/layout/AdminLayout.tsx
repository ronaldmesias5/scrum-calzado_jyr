import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { BadgeCountsProvider } from '../../context/BadgeCountsContext';
import { DashboardFooter } from '@/components/layout/DashboardFooter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageTransition from '@/components/ui/PageTransition';

const LS_KEY = 'admin_sidebar_width';
const MIN_WIDTH = 72;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 240;

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (!isNaN(w) && w >= MIN_WIDTH && w <= MAX_WIDTH) return w;
      }
    } catch {}
    return DEFAULT_WIDTH;
  });

  const isCollapsed = sidebarWidth < 100;

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <BadgeCountsProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
        <AdminHeader onMenuClick={toggleSidebar} />

        <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            width={sidebarWidth}
            isCollapsed={isCollapsed}
          />

          <div
            onMouseDown={handleResizeMouseDown}
            className="hidden lg:block w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400/30 active:bg-blue-500/50 transition-colors flex-shrink-0"
          />

          <main id="main-content" className="flex-1 flex flex-col min-h-full min-w-0">
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-3 pb-8">
              <Breadcrumbs />
              <PageTransition>
                <Outlet />
              </PageTransition>
              <DashboardFooter />
            </div>
          </main>
        </div>
      </div>
    </BadgeCountsProvider>
  );
}
