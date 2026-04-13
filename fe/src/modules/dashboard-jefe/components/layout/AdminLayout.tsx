import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { BadgeCountsProvider } from '../../context/BadgeCountsContext';
import { DashboardFooter } from '@/components/layout/DashboardFooter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export default function AdminLayout() {
  return (
    <BadgeCountsProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
        {/* Header full-width sticky */}
        <AdminHeader />

        {/* Sidebar + contenido debajo del header */}
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 px-4 pt-3 pb-4 overflow-y-auto flex flex-col">
            <div className="flex-1">
              <Breadcrumbs />
              <Outlet />
            </div>
            <DashboardFooter />
          </main>
        </div>
      </div>
    </BadgeCountsProvider>
  );
}
