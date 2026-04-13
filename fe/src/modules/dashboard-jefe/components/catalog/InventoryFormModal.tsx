/**
 * Modal: InventoryFormModal.tsx
 * Crear/editar inventario (stock por talla)
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import {
  createOrUpdateInventory,
  InventoryItem,
  Product,
} from '../../services/catalogService';

interface InventoryFormModalProps {
  isOpen: boolean;
  inventory?: InventoryItem | null;
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}

export default function InventoryFormModal({
  isOpen,
  inventory,
  products,
  onClose,
  onSave,
}: InventoryFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: '',
    size: '',
    quantity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tallas comunes
  const commonSizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  ];

  useEffect(() => {
    if (inventory) {
      setFormData({
        product_id: inventory.product_id,
        size: inventory.size,
        quantity: inventory.quantity,
      });
    } else {
      setFormData({
        product_id: '',
        size: '',
        quantity: 0,
      });
    }
    setError(null);
  }, [inventory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.product_id || !formData.size) {
        throw new Error('Debes seleccionar producto y talla');
      }

      if (formData.quantity < 0) {
        throw new Error('La cantidad no puede ser negativa');
      }

      await createOrUpdateInventory(
        formData.product_id,
        formData.size,
        formData.quantity
      );
      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar inventario';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {inventory ? 'Editar Inventario' : 'Agregar Inventario'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Producto *
              </label>
              <select
                required
                disabled={inventory ? true : false}
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-900"
              >
                <option value="" className="dark:bg-slate-800">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-800">
                    {p.name}
                  </option>
                ))}
              </select>
              {inventory && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  No puedes cambiar el producto en un registro existente
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Talla *
              </label>
              <div className="space-y-2">
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
                >
                  <option value="" className="dark:bg-slate-800">Selecciona o ingresa una talla</option>
                  {commonSizes.map((size) => (
                    <option key={size} value={size} className="dark:bg-slate-800">
                      {size}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="O ingresa una talla personalizada"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
                placeholder="Ej: 50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 btn-pulse"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {inventory ? 'Actualizar' : 'Agregar Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
