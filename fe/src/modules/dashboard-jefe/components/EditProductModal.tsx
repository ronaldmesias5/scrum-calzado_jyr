import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface EditProductModalProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  currentAmount: number;
  onClose: () => void;
  onSave: (productId: string, newAmount: number) => Promise<void>;
  categoryName?: string;
}

export default function EditProductModal({
  isOpen,
  productId,
  productName,
  currentAmount,
  onClose,
  onSave,
  categoryName = 'Caballero'
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [sizeAmounts, setSizeAmounts] = useState<Record<string, number>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const getAvailableSizes = () => {
    if (categoryName === 'Infantil') return Array.from({ length: 12 }, (_, i) => String(21 + i));
    return Array.from({ length: 11 }, (_, i) => String(33 + i));
  };

  const availableSizes = getAvailableSizes();

  useEffect(() => {
    if (isOpen) {
      // Distribuir cantidad actual equitativamente entre tallas
      const newSizeAmounts: Record<string, number> = {};
      const perSize = Math.floor(currentAmount / availableSizes.length);
      const remainder = currentAmount % availableSizes.length;
      availableSizes.forEach((size, idx) => {
        newSizeAmounts[size] = perSize + (idx < remainder ? 1 : 0);
      });
      setSizeAmounts(newSizeAmounts);
      setActivePreset(null);
    }
  }, [isOpen, currentAmount, categoryName]);

  const applyPreset = (preset: 'equal3' | 'equal5' | 'equal10' | 'comercial') => {
    const newAmounts: Record<string, number> = {};
    let amount = 0;

    switch (preset) {
      case 'equal3':
        amount = 3;
        break;
      case 'equal5':
        amount = 5;
        break;
      case 'equal10':
        amount = 10;
        break;
      case 'comercial':
        // Patrón comercial: 1, 2, 3, 3, 2, 1 desde la mitad
        const midIdx = Math.floor(availableSizes.length / 2);
        const pattern = [1, 2, 3, 3, 2, 1];
        availableSizes.forEach((size, idx) => {
          const offset = idx - midIdx;
          const patternIdx = Math.abs(offset);
          newAmounts[size] = pattern[patternIdx] || 0;
        });
        setSizeAmounts(newAmounts);
        setActivePreset(preset);
        return;
    }

    availableSizes.forEach(size => {
      newAmounts[size] = amount;
    });
    setSizeAmounts(newAmounts);
    setActivePreset(preset);
  };

  const getTotalAmount = () => {
    return Object.values(sizeAmounts).reduce((sum, val) => sum + val, 0);
  };

  const handleSizeChange = (size: string, value: number) => {
    setSizeAmounts({ ...sizeAmounts, [size]: Math.max(0, value) });
    setActivePreset(null);
  };

  const handleSave = async () => {
    const total = getTotalAmount();
    if (total <= 0) {
      alert('Debes asignar al menos 1 par');
      return;
    }

    setLoading(true);
    try {
      await onSave(productId, total);
      onClose();
    } catch (error) {
      console.error('Error saving product changes:', error);
      alert('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = getTotalAmount();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-800/30 transition-colors">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Cantidades</h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full transition-all text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white dark:bg-slate-900 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Numeraciones Rápidas */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Numeraciones Rápidas</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => applyPreset('equal3')}
                className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 ${
                  activePreset === 'equal3'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-500'
                    : 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-slate-700'
                }`}
              >
                3 x Talla
              </button>
              <button
                onClick={() => applyPreset('equal5')}
                className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 ${
                  activePreset === 'equal5'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-500'
                    : 'bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-slate-700'
                }`}
              >
                5 x Talla
              </button>
              <button
                onClick={() => applyPreset('equal10')}
                className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 ${
                  activePreset === 'equal10'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-500'
                    : 'bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 hover:bg-purple-100 dark:hover:bg-slate-700'
                }`}
              >
                10 x Talla
              </button>
              <button
                onClick={() => applyPreset('comercial')}
                className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 ${
                  activePreset === 'comercial'
                    ? 'bg-orange-600 text-white ring-2 ring-orange-300 dark:ring-orange-500'
                    : 'bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-slate-700'
                }`}
              >
                Comercial
              </button>
            </div>
          </div>

          {/* Grid de Tallas */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Cantidades por Talla</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 bg-gray-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
              {availableSizes.map((size) => (
                <div key={size} className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase text-center">
                    T{size}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSizeChange(size, (sizeAmounts[size] || 0) - 1)}
                      className="flex-1 px-1.5 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded font-bold text-xs hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Minus size={12} className="mx-auto" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={sizeAmounts[size] || 0}
                      onChange={(e) => handleSizeChange(size, parseInt(e.target.value) || 0)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-center text-xs font-black outline-none transition-all ${
                        (sizeAmounts[size] || 0) > 0
                          ? 'bg-white dark:bg-slate-700 border-2 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'
                      }`}
                    />
                    <button
                      onClick={() => handleSizeChange(size, (sizeAmounts[size] || 0) + 1)}
                      className="flex-1 px-1.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded font-bold text-xs hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                    >
                      <Plus size={12} className="mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between">
            <span className="font-bold text-lg">Total acumulado en el pedido:</span>
            <span className="text-3xl font-black">{total} pares</span>
          </div>

          {total !== currentAmount && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-bold">Cambio:</span> de {currentAmount} a {total} pares
                {total > currentAmount && (
                  <span className="text-green-600 dark:text-green-400 font-bold"> (+{total - currentAmount})</span>
                )}
                {total < currentAmount && (
                  <span className="text-orange-600 dark:text-orange-400 font-bold"> (-{currentAmount - total})</span>
                )}
              </p>
            </div>
          )}
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
            disabled={loading || total === currentAmount || total === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
