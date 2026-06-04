import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import AdminHeader from '@/modules/dashboard-jefe/components/layout/AdminHeader';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageTransition from '@/components/ui/PageTransition';
import { DashboardFooter } from '@/components/layout/DashboardFooter';

export default function ClientLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      <AdminHeader onMenuClick={toggleSidebar} />

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
        <ClientSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main id="main-content" className="flex-1 flex flex-col min-h-full">
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
  );
}
