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
    <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* Header with Icon */}
        <div className={`${isActivating ? 'bg-green-50' : 'bg-red-50'} px-6 py-5 flex items-center gap-4 border-b ${isActivating ? 'border-green-100' : 'border-red-100'}`}>
          <div className={`p-3 ${isActivating ? 'bg-green-100' : 'bg-red-100'} rounded-xl`}>
            {isActivating ? (
              <ShieldCheck className="text-green-600" size={28} />
            ) : (
              <ShieldAlert className="text-red-600" size={28} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {isActivating ? 'Activar Empleado' : 'Desactivar Empleado'}
            </h2>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isActivating ? 'text-green-700' : 'text-red-700'}`}>
              Confirmación de seguridad
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${employee.is_active ? 'bg-blue-600' : 'bg-gray-400'}`}>
                {employee.name[0]}{employee.last_name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{employee.name} {employee.last_name}</p>
                <p className="text-xs text-gray-500 font-medium">{employee.occupation || 'Sin cargo'}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              {isActivating 
                ? 'Al activar a este empleado, recuperará el acceso al sistema y podrá realizar sus tareas asignadas.' 
                : 'Al desactivar a este empleado, perderá el acceso inmediato al sistema. Podrás reactivarlo en cualquier momento.'}
            </p>
          </div>

          {!isActivating && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-amber-800 font-medium">
                Esta acción restringirá el inicio de sesión para esta cuenta hasta que sea habilitada nuevamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-white hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            No, Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 ${isActivating ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
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
