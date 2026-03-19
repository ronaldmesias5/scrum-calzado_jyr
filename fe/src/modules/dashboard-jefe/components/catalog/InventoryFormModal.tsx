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
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Error al guardar inventario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              {inventory ? 'Editar Inventario' : 'Agregar Inventario'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <select
                required
                disabled={inventory ? true : false}
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {inventory && (
                <p className="text-xs text-gray-500 mt-1">
                  No puedes cambiar el producto en un registro existente
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talla *
              </label>
              <div className="space-y-2">
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona o ingresa una talla</option>
                  {commonSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="O ingresa una talla personalizada"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 50"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {inventory ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
