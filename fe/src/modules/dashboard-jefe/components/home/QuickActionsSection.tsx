import { ClipboardList, UserPlus, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'Nuevo Pedido', icon: ClipboardList, path: '/dashboard/admin/orders', primary: true },
  { label: 'Agregar Cliente', icon: UserPlus, path: '/dashboard/admin/clients', primary: false },
  { label: 'Actualizar Stock', icon: RefreshCw, path: '/dashboard/admin/inventory', primary: false },
  { label: 'Generar Reporte', icon: FileText, path: '/dashboard/admin/reports', primary: false },
];

export default function QuickActionsSection() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mt-6 transition-all duration-300">
      <h2 className="font-bold text-gray-900 dark:text-white mb-4 transition-colors">Acciones Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map(({ label, icon: Icon, path, primary }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl font-bold text-sm transition-all duration-200
              ${primary
                ? 'bg-blue-800 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg hover:shadow-blue-500/20 active:scale-95'
                : 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-md active:scale-95'
              }`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
