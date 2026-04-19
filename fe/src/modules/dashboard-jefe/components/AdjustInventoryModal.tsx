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
      // Podríamos añadir un estado de error específico aquí si fuera necesario
    } finally {
      setLoading(false);
    }
  };

  const totalPairs = Object.values(sizeQuantities).reduce((sum: number, qty: number) => sum + (qty || 0), 0);
  
  // Obtener tallas según la categoría del producto
  const shoeSize = product ? getSizesByCategory(product.category_name) : [];

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajustar Inventario</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{product.name} • {product.brand_name} • {product.color}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 custom-scrollbar">
          {loadingInventory ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando inventario...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 mb-8 transition-colors">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  <span className="font-bold">Ingresa la cantidad de pares disponibles para cada talla.</span> El total se actualizará automáticamente basándose en los datos del sistema.
                </p>
              </div>

              {/* Sizes Grid */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">
                  Distribución de Stock por Talla
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {shoeSize.map(size => (
                    <div key={size} className="flex flex-col items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 font-black">T. {size}</label>
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
                        className="w-full px-1 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-center text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-5 shadow-sm transition-all">
                  <p className="text-[10px] text-green-700 dark:text-green-400 font-black uppercase tracking-wider mb-1">Total Pares Stock</p>
                  <p className="text-4xl font-black text-green-600 dark:text-green-500">{totalPairs}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-all">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-black uppercase tracking-wider mb-1">Tallas Activas</p>
                  <p className="text-4xl font-black text-gray-600 dark:text-gray-300">
                    {Object.values(sizeQuantities).filter((qty: number) => qty > 0).length}<span className="text-lg text-gray-400 dark:text-gray-500 ml-1">/{shoeSize.length}</span>
                  </p>
                </div>
              </div>

              {/* Umbral de Insuficiencia */}
              <div className="mt-8 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-6 transition-all">
                <label className="block text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">
                  Configuración Umbral de Alerta
                </label>
                <p className="text-sm text-orange-800/80 dark:text-orange-300/80 mb-5 font-medium leading-relaxed">
                  Define el límite mínimo de stock global para este producto. Si el total cae por debajo de este valor, el sistema marcará el stock como <span className="font-bold underlineDecoration-wavy">Insuficiente</span>.
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={insufficientThreshold}
                      onChange={(e) => setInsufficientThreshold(Math.max(1, parseInt(e.target.value) || 12))}
                      className="w-full px-4 py-4 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none text-xl font-black text-orange-700 dark:text-orange-400 transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex-1 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Estado Visual</p>
                    <span className={`text-lg font-black flex items-center gap-2 ${insufficientThreshold > totalPairs ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
                      <div className={`w-3 h-3 rounded-full ${insufficientThreshold > totalPairs ? "bg-orange-500" : "bg-green-500"}`}></div>
                      {insufficientThreshold > totalPairs ? "INSUFICIENTE" : "SUFICIENTE"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex-shrink-0 transition-colors">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : `Guardar Cambios (${totalPairs} pares)`}
          </button>
        </div>
      </div>
    </div>
  );
}
