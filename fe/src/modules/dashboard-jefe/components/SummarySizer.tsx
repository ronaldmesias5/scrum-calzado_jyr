import { useState } from 'react';
import { Package } from 'lucide-react';

interface SummarySizerProps {
  categoryName: string;
  initialItems: Array<{ size: string; amount: number }>;
  onChange: (newItems: Array<{ size: string; amount: number }>) => void;
}

const PRESETS_CONFIG = {
  COMERCIAL_PATTERN: { '1': 1, '2': 2, '3': 3, '4': 3, '5': 2, '6': 1 }
};

export default function SummarySizer({ categoryName, initialItems, onChange }: SummarySizerProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Determinar tamaños disponibles basados en la categoría
  let availableSizes: string[] = [];
  if (categoryName === 'Infantil') {
    availableSizes = Array.from({ length: 12 }, (_, i) => String(21 + i));
  } else {
    availableSizes = Array.from({ length: 11 }, (_, i) => String(33 + i));
  }

  // Convertir items a mapa de amounts
  const sizeAmounts = availableSizes.reduce((acc, size) => {
    const found = initialItems.find(i => i.size === size);
    acc[size] = found ? String(found.amount) : '0';
    return acc;
  }, {} as Record<string, string>);

  const triggerChange = (newAmounts: Record<string, string>) => {
    const newItems = Object.entries(newAmounts)
      .filter(([, amount]) => {
        const val = parseInt(amount as string) || 0;
        return val > 0;
      })
      .map(([size, amount]) => ({ size, amount: parseInt(amount as string) }));
    onChange(newItems);
  };

  const handleSizeAmountChange = (size: string, value: string) => {
    const newAmounts = { ...sizeAmounts, [size]: value };
    triggerChange(newAmounts);
    setActivePreset(null);
  };

  const clearAll = () => {
    const newAmounts: Record<string, string> = {};
    availableSizes.forEach(s => newAmounts[s] = '0');
    triggerChange(newAmounts);
    setActivePreset(null);
  };

  const applyRelativeCurve = (curve: Record<string, number>, startSize: string, presetId: string) => {
    const newAmounts = { ...sizeAmounts };
    const startIndex = availableSizes.indexOf(startSize);
    if (startIndex !== -1) {
      availableSizes.forEach((size, idx) => {
        const offset = idx - startIndex + 1;
        newAmounts[size] = curve[String(offset)] ? String(curve[String(offset)]) : '0';
      });
      triggerChange(newAmounts);
    }
    setActivePreset(presetId);
  };

  const applyFixedX = (amount: number, range: string[], presetId: string) => {
    const newAmounts = { ...sizeAmounts };
    availableSizes.forEach(size => {
      if (range.includes(size)) newAmounts[size] = String(amount);
      else newAmounts[size] = '0';
    });
    triggerChange(newAmounts);
    setActivePreset(presetId);
  };

  const applySpecificCurve = (curve: Record<string, number>, presetId: string) => {
    const newAmounts = { ...sizeAmounts };
    availableSizes.forEach(size => {
      newAmounts[size] = String(curve[size] || '0');
    });
    triggerChange(newAmounts);
    setActivePreset(presetId);
  };

  return (
    <div className="space-y-4">
      {/* Botones de Numeración Rápida con Colores */}
      <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-slate-800">
           <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
             <Package className="w-3 h-3 text-blue-500" /> Numeraciones Rápidas
           </label>
           <button onClick={clearAll} className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase">Limpiar</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const damaRange = ['33', '34', '35', '36', '37', '38'];
            const cabFullRange = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];
            
            const colors = [
              'bg-orange-600 shadow-orange-500/30',
              'bg-blue-600 shadow-blue-500/30',
              'bg-emerald-600 shadow-emerald-500/30',
              'bg-purple-600 shadow-purple-500/30',
              'bg-rose-600 shadow-rose-500/30',
              'bg-amber-600 shadow-amber-500/30',
              'bg-indigo-600 shadow-indigo-500/30'
            ];

            const getBtnClass = (id: string, colorIdx: number) => {
              const active = activePreset === id;
              const safeColor = colors[colorIdx % colors.length];
              return `px-2 py-1.5 rounded-lg text-[9px] uppercase transition-all shadow-sm ${safeColor} text-white ${
                active ? `ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-600 font-black scale-[1.05]` : `font-bold opacity-80 hover:opacity-100`
              }`;
            };

            if (categoryName === 'Dama') {
              return (
                <>
                  <button onClick={() => applyRelativeCurve(PRESETS_CONFIG.COMERCIAL_PATTERN, '33', 'com-dama')} className={getBtnClass('com-dama', 0)}>Comercial</button>
                  {[2, 3, 4, 5].map((num, i) => (
                    <button key={num} onClick={() => applyFixedX(num, damaRange, `fixed-${num}-dama`)} className={getBtnClass(`fixed-${num}-dama`, i + 1)}>{num}xTalla</button>
                  ))}
                </>
              );
            }

            if (categoryName === 'Caballero') {
              return (
                <>
                  <button onClick={() => applyRelativeCurve(PRESETS_CONFIG.COMERCIAL_PATTERN, '33', 'com-cab-peq')} className={getBtnClass('com-cab-peq', 0)}>Comer. (33-38)</button>
                  <button onClick={() => applySpecificCurve({'37':1, '38':2, '39':3, '40':3, '41':2, '42':1}, 'com-cab-grande')} className={getBtnClass('com-cab-grande', 5)}>Comer. G (37-42)</button>
                  <button onClick={() => {
                    const curve: Record<string, number> = {};
                    cabFullRange.forEach(s => curve[s] = (s === '38' || s === '39') ? 2 : 1);
                    applySpecificCurve(curve, 'curva-cab');
                  }} className={getBtnClass('curva-cab', 6)}>Curva (33-42)</button>
                  {[2, 3, 4, 5].map((num, i) => (
                    <button key={num} onClick={() => applyFixedX(num, cabFullRange, `fixed-${num}-cab`)} className={getBtnClass(`fixed-${num}-cab`, i + 1)}>{num}xTalla</button>
                  ))}
                </>
              );
            }
            if (categoryName === 'Infantil') {
              const infSmall = ['21', '22', '23', '24', '25', '26'];
              const infLarge = ['27', '28', '29', '30', '31', '32'];
              const infFull = [...infSmall, ...infLarge];
              
              return (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 3, 4, 5, 6].map((num, i) => (
                      <button key={`s-${num}`} onClick={() => applyFixedX(num, infSmall, `fixed-${num}-inf-s`)} className={getBtnClass(`fixed-${num}-inf-s`, i)}>{num}xT (21-26)</button>
                    ))}
                    {[2, 3, 4, 5, 6].map((num, i) => (
                      <button key={`l-${num}`} onClick={() => applyFixedX(num, infLarge, `fixed-${num}-inf-l`)} className={getBtnClass(`fixed-${num}-inf-l`, i + 1)}>{num}xT (27-32)</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => applyFixedX(1, infFull, 'curve-1-inf')} className={getBtnClass('curve-1-inf', 2)}>1xT (21-32)</button>
                    <button onClick={() => applyFixedX(2, infFull, 'curve-2-inf')} className={getBtnClass('curve-2-inf', 3)}>2xT (21-32)</button>
                    <button onClick={() => applyFixedX(3, infFull, 'curve-3-inf')} className={getBtnClass('curve-3-inf', 4)}>3xT (21-32)</button>
                    <button onClick={() => applyFixedX(4, infFull, 'curve-4-inf')} className={getBtnClass('curve-4-inf', 5)}>4xT (21-32)</button>
                  </div>
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>

      {/* Grid de Inputs de Tallas */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl">
        {availableSizes.map((size) => {
          const val = parseInt(sizeAmounts[size] || '0');
          const hasValue = val > 0;
          return (
            <div key={size} className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase text-center">T{size}</label>
              <input 
                type="number" 
                min="0" 
                placeholder="0" 
                value={val || ''} 
                onChange={(e) => handleSizeAmountChange(size, e.target.value)} 
                className={`w-full px-1 py-1.5 rounded-lg text-xs font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm ${
                  hasValue
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 border' 
                    : 'bg-gray-50 dark:bg-slate-800 border-transparent text-gray-900 dark:text-white border'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
