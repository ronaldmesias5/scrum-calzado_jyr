import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../services/catalogService';

interface AdjustManufacturedModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void>;
}

export default function AdjustManufacturedModal({ isOpen, product, onClose, onSave }: AdjustManufacturedModalProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(product.manufactured_pairs || 0);
    }
  }, [isOpen, product]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(quantity);
      onClose();
    } catch (error) {
      console.error('Error saving manufactured pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajustar Pares Fabricados</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{product.name} • {product.brand_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white dark:bg-slate-900">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mb-6 transition-colors">
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
              <span className="font-bold">Ingresa el número total de pares fabricados</span> para este producto.
            </p>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-3">
              Pares Fabricados
            </label>
            <input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-colors"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
              Total actual: <span className="font-black text-emerald-600 dark:text-emerald-400">{quantity}</span> pares
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 transition-colors">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold text-sm uppercase hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
