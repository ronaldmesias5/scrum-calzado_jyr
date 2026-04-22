import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../services/catalogService';
import api from '@/api/axios';

interface InventoryItem {
  size: number;
  reserved: number;
}

interface ViewManufacturedModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

// Tallas según categoría
const getSizesByCategory = (category: string | undefined): number[] => {
  if (!category) return [];
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower === 'infantil') {
    return [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
  } else if (categoryLower === 'dama' || categoryLower === 'caballero') {
    return [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
  }
  
  return [];
};

export default function ViewManufacturedModal({ isOpen, product, onClose }: ViewManufacturedModalProps) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalReserved, setTotalReserved] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      if (isOpen && product) {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(
            `/api/v1/admin/catalog/products/${product.id}/inventory-by-size`
          );
          
          setInventory(response.data.inventory || []);
          setTotalReserved(response.data.total_reserved || 0);
        } catch (err) {
          console.error('Error loading inventory by size:', err);
          setError('Error al cargar los datos');
          setInventory([]);
          setTotalReserved(0);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInventory();
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const sizes = getSizesByCategory(product.category_name);

  // Crear un map de size -> reserved para búsqueda rápida
  const sizeMap = Object.fromEntries(inventory.map(item => [item.size, item.reserved]));

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pares Fabricados por Talla</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{product.name} • {product.brand_name} • {product.color || 'Sin color'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando pares...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-bold text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mb-8 transition-colors">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  Total de Pares Fabricados: <span className="text-2xl">{totalReserved}</span>
                </p>
              </div>

              {totalReserved === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 font-bold">No hay pares fabricados aún</p>
                </div>
              ) : (
                <>
                  {/* Distribución por Talla */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">
                      Distribución por Talla
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {sizes.map(size => {
                        const quantity = sizeMap[size] || 0;
                        return (
                          <div
                            key={size}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${
                              quantity > 0
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                              T. {size}
                            </p>
                            <p className={`text-2xl font-black ${
                              quantity > 0
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-400 dark:text-gray-600'
                            }`}>
                              {quantity}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                      <span className="font-bold">Nota:</span> Estos pares entran cuando el pedido se marca como "Completado" y se descargan cuando se marca como "Entregado al Cliente".
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 transition-colors">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase hover:bg-emerald-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
