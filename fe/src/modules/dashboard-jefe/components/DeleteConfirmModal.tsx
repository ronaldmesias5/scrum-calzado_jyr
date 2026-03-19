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
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header with Icon */}
        <div className="bg-red-50 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eliminar Producto</h2>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
          </div>
        </div>

        {/* Body with Product Details */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-2">PRODUCTO A ELIMINAR</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Referencia</p>
                <p className="font-semibold text-gray-900">{product.style_name || product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Categoría</p>
                  <p className="font-medium text-gray-700 text-sm">{product.category_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marca</p>
                  <p className="font-medium text-gray-700 text-sm">{product.brand_name}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID</p>
                <p className="font-mono text-xs text-gray-600">{product.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <span className="font-semibold">⚠️ Advertencia:</span> Se eliminarán todos los datos asociados a este producto incluyendo inventario y tallas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
