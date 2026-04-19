import { AlertTriangle, Trash2 } from 'lucide-react';
import { Product } from '../services/catalogService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  product,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        {/* Header with Icon */}
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-5 flex items-center gap-3 border-b border-red-100 dark:border-red-900/30 transition-all">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-inner">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eliminar Producto</h2>
            <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Acción irreversible</p>
          </div>
        </div>

        {/* Body with Product Details */}
        <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
          <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Trash2 size={48} className="text-gray-400" /></div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-4">Detalles del Producto</p>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tight mb-0.5">Referencia</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{product.style_name || product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tight mb-0.5">Categoría</p>
                  <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">{product.category_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tight mb-0.5">Marca</p>
                  <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">{product.brand_name}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/50">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tight mb-1">ID del Sistema</p>
                <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">{product.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 transition-colors">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium flex gap-2">
              <span className="font-bold flex-shrink-0">⚠️</span> 
              <span>Se eliminarán todos los datos asociados, incluyendo inventario y configuraciones de tallas.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 transition-all">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 size={18} />
            {loading ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
