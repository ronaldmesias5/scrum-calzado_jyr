import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product, bulkUpdateInventory, listInventory, updateProduct } from '../services/catalogService';

// Tallas según categoría
const getSizesByCategory = (category: string | undefined): number[] => {
  if (!category) return [];
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower === 'infantil') {
    return [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
  } else if (categoryLower === 'dama' || categoryLower === 'caballero') {
    return [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
  }
  
  // Por defecto mostrar todas
  return [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
};

interface AdjustInventoryModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (quantities: Record<number, number>) => Promise<void>;
}

export default function AdjustInventoryModal({ isOpen, product, onClose, onSave }: AdjustInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [sizeQuantities, setSizeQuantities] = useState<Record<number, number>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [insufficientThreshold, setInsufficientThreshold] = useState(12);

  // Cargar inventario existente cuando se abre el modal
  useEffect(() => {
    const loadExistingInventory = async () => {
      if (isOpen && product) {
        setLoadingInventory(true);
        try {
          const inventory = await listInventory(product.id);
          const quantities: Record<number, number> = {};
          
          // Precarga los valores existentes
          inventory.forEach(item => {
            const size = parseInt(item.size);
            quantities[size] = item.quantity || 0;
          });
          
          setSizeQuantities(quantities);
          
          // Cargar el umbral de insuficiencia del producto
          setInsufficientThreshold(product.insufficient_threshold || 12);
        } catch (error) {
          console.error('Error loading inventory:', error);
          setSizeQuantities({});
          setInsufficientThreshold(12);
        } finally {
          setLoadingInventory(false);
        }
      }
    };

    loadExistingInventory();
  }, [isOpen, product]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!product) return;
      
      // Convertir el Record<number, number> a Record<string, number> para el API
      const quantitiesForApi: Record<string, number> = {};
      Object.entries(sizeQuantities).forEach(([size, qty]) => {
        quantitiesForApi[size] = qty as number;
      });
      
      // Guardar inventario
      await bulkUpdateInventory(product.id, quantitiesForApi);
      
      // Guardar cambios en el umbral si cambió
      if (insufficientThreshold !== (product.insufficient_threshold || 12)) {
        await updateProduct(product.id, {
          name: product.name,
          description: product.description,
          color: product.color,
          brand_id: product.brand_id,
          style_id: product.style_id,
          category_id: product.category_id,
          insufficient_threshold: insufficientThreshold
        });
      }
      
      // Ejecutar callback opcional
      await onSave(sizeQuantities);
      onClose();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const totalPairs = Object.values(sizeQuantities).reduce((sum: number, qty: any) => sum + (qty || 0), 0);
  
  // Obtener tallas según la categoría del producto
  const shoeSize = product ? getSizesByCategory(product.category_name) : [];

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajustar Inventario</h2>
            <p className="text-sm text-gray-600">{product.name} • {product.brand_name} • {product.color}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingInventory ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Cargando inventario...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Ingresa la cantidad de pares disponibles para cada talla.</span> El total se actualizará automáticamente.
                </p>
              </div>

              {/* Sizes Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Cantidades por Talla
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {shoeSize.map(size => (
                    <div key={size} className="flex flex-col items-center">
                      <label className="text-xs text-gray-500 font-medium mb-2">T. {size}</label>
                      <input
                        type="number"
                        min="0"
                        value={sizeQuantities[size] || ''}
                        onChange={(e) => {
                          const qty = parseInt((e.target as HTMLInputElement).value) || 0;
                          setSizeQuantities((prev: Record<number, number>) => ({
                            ...prev,
                            [size]: qty
                          }));
                        }}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700 font-medium mb-1">Total de Pares</p>
                  <p className="text-3xl font-bold text-green-600">{totalPairs}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">Tallas con Stock</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {Object.values(sizeQuantities).filter((qty: any) => qty > 0).length}/{shoeSize.length}
                  </p>
                </div>
              </div>

              {/* Umbral de Insuficiencia */}
              <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Umbral de Insuficiencia (pares)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Con este valor, el producto mostrará <span className="font-semibold">Insuficiente</span> si tiene menos pares
                </p>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={insufficientThreshold}
                  onChange={(e) => setInsufficientThreshold(Math.max(1, parseInt(e.target.value) || 12))}
                  className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-semibold"
                />
                <p className="text-xs text-orange-700 mt-2">
                  Ejemplo: Total actual = {totalPairs}, Umbral = {insufficientThreshold}
                  <br />
                  Estado: <span className={insufficientThreshold > totalPairs ? "font-semibold text-orange-600" : "font-semibold text-green-600"}>
                    {insufficientThreshold > totalPairs ? "Insuficiente" : "Suficiente"}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Guardando...' : `Guardar (${totalPairs} pares)`}
          </button>
        </div>
      </div>
    </div>
  );
}
