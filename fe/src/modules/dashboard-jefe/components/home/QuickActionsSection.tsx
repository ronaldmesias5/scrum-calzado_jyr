import { ClipboardList, UserPlus, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'Nuevo Pedido', icon: ClipboardList, path: '/dashboard/admin/orders', color: 'bg-blue-800 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg hover:shadow-blue-500/20' },
  { label: 'Agregar Cliente', icon: UserPlus, path: '/dashboard/admin/clients', color: 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg hover:shadow-emerald-500/20' },
  { label: 'Actualizar Stock', icon: RefreshCw, path: '/dashboard/admin/inventory', color: 'bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 shadow-lg hover:shadow-amber-500/20' },
  { label: 'Generar Reporte', icon: FileText, path: '/dashboard/admin/reports', color: 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/20' },
];

export default function QuickActionsSection() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mt-6 transition-all duration-300">
      <h2 className="font-bold text-gray-900 dark:text-white mb-4 transition-colors">Acciones Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map(({ label, icon: Icon, path, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl font-bold text-sm transition-all duration-200 ${color} active:scale-95`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
