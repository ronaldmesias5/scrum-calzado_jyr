import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeSidebar from './EmployeeSidebar';
import AdminHeader from '@/features/admin/components/organisms/AdminHeader';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs';
import PageTransition from '@/components/atoms/PageTransition';
import { DashboardFooter } from '@/components/layout/DashboardFooter';
import { EmployeeBadgeCountsProvider } from '@/store/EmployeeBadgeCountsContext';

const LS_KEY = 'employee_sidebar_width';
const MIN_WIDTH = 72;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 240;

export default function EmployeeLayout() {
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
    try {
      localStorage.setItem(LS_KEY, String(sidebarWidth));
    } catch {}
  }, [sidebarWidth]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setSidebarWidth(
        Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
      );
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
    <EmployeeBadgeCountsProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
        <AdminHeader onMenuClick={toggleSidebar} />

<<<<<<< HEAD
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <EmployeeSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          width={sidebarWidth}
          isCollapsed={isCollapsed}
        />

          <div
            onMouseDown={handleResizeMouseDown}
            className="hidden lg:block w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400/30 active:bg-blue-500/50 transition-colors flex-shrink-0"
          />

        <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col bg-gray-50 dark:bg-slate-950">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 sm:px-8 pb-6">
              <Breadcrumbs />
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            <DashboardFooter className="shrink-0 border-t border-gray-100 dark:border-slate-800/50" />
        </main>
      </div>
    </EmployeeBadgeCountsProvider>
  );
}
