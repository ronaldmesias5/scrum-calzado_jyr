import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import type { UserResponse } from '@/types/auth';

interface StatusConfirmModalProps {
  isOpen: boolean;
  employee: UserResponse | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function StatusConfirmModal({
  isOpen,
  employee,
  loading,
  onConfirm,
  onCancel,
}: StatusConfirmModalProps) {
  if (!isOpen || !employee) return null;

  const isActivating = !employee.is_active;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800 transition-all">
        {/* Header with Icon */}
        <div className={`${isActivating ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} px-6 py-5 flex items-center gap-4 border-b ${isActivating ? 'border-green-100 dark:border-green-900/30' : 'border-red-100 dark:border-red-900/30'} transition-all`}>
          <div className={`p-3 ${isActivating ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-xl`}>
            {isActivating ? (
              <ShieldCheck className="text-green-600" size={28} />
            ) : (
              <ShieldAlert className="text-red-600" size={28} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
              {isActivating ? 'Activar Empleado' : 'Desactivar Empleado'}
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isActivating ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Confirmación de seguridad
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
          <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner ${employee.is_active ? 'bg-blue-600' : 'bg-gray-400 dark:bg-slate-700'}`}>
                {employee.name[0]}{employee.last_name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{employee.name} {employee.last_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{employee.occupation || 'Sin cargo'}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              {isActivating 
                ? 'Al activar a este empleado, recuperará el acceso al sistema y podrá realizar sus tareas asignadas.' 
                : 'Al desactivar a este empleado, perderá el acceso inmediato al sistema. Podrás reactivarlo en cualquier momento.'}
            </p>
          </div>

          {!isActivating && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 transition-colors">
              <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-bold leading-snug">
                Esta acción restringirá el inicio de sesión para esta cuenta hasta que sea habilitada nuevamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 transition-colors">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            No, Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 ${isActivating ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm btn-pulse`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              isActivating ? 'Sí, Activar' : 'Sí, Desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
