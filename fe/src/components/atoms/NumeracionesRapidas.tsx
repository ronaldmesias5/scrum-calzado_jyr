import { Package } from 'lucide-react';
import { resolveCategory, getSizesList } from '@/utils/shoeSizes';

interface NumeracionesRapidasProps {
  /** Nombre de la categoría del producto (Dama / Caballero / Infantil) */
  categoryName: string;
  /** Cantidades actuales por talla, ej: { '33': 2, '34': 0, ... } */
  amounts: Record<string, number>;
  /** Id del preset actualmente activo (o null) */
  activePreset: string | null;
  /** Callback al seleccionar/deseleccionar un preset */
  onPresetChange: (id: string | null) => void;
  /** Callback con las nuevas cantidades tras aplicar un preset */
  onApply: (newAmounts: Record<string, number>) => void;
}

const COLORS = [
  'bg-orange-600 shadow-orange-500/30',
  'bg-blue-600 shadow-blue-500/30',
  'bg-emerald-600 shadow-emerald-500/30',
  'bg-purple-600 shadow-purple-500/30',
  'bg-rose-600 shadow-rose-500/30',
  'bg-amber-600 shadow-amber-500/30',
  'bg-indigo-600 shadow-indigo-500/30'
];

const COMERCIAL_PATTERN: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 3,
  '5': 2,
  '6': 1
};

function applyRelativeCurve(
  curve: Record<string, number>,
  startSize: string,
  availableSizes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  const startIdx = availableSizes.indexOf(startSize);
  availableSizes.forEach((size, idx) => {
    const offset = idx - startIdx + 1;
    result[size] = curve[String(offset)] ?? 0;
  });
  return result;
}

function applyFixedX(
  amount: number,
  range: string[],
  availableSizes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  availableSizes.forEach((size) => {
    result[size] = range.includes(size) ? amount : 0;
  });
  return result;
}

function applySpecificCurve(
  curve: Record<string, number>,
  availableSizes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  availableSizes.forEach((size) => {
    result[size] = curve[size] ?? 0;
  });
  return result;
}

export default function NumeracionesRapidas({
  categoryName,
  amounts: _amounts,
  activePreset,
  onPresetChange,
  onApply
}: NumeracionesRapidasProps) {
  const availableSizes = getSizesList(categoryName);
  const cat = resolveCategory(categoryName);

  const getBtnClass = (id: string, colorIdx: number) => {
    const safeColor = COLORS[colorIdx % COLORS.length];
    return `px-2.5 py-1.5 rounded-xl text-[10px] uppercase transition-all shadow-sm ${safeColor} text-white ${
      activePreset === id
        ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-600 font-extrabold scale-[1.05]'
        : 'font-bold opacity-80 hover:opacity-100 hover:scale-[1.02]'
    }`;
  };

  const damaRange = ['33', '34', '35', '36', '37', '38'];
  const cabFullRange = [
    '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'
  ];

  const clearAll = () => {
    const zeroed: Record<string, number> = {};
    availableSizes.forEach((s) => (zeroed[s] = 0));
    onApply(zeroed);
    onPresetChange(null);
  };

  const renderButtons = () => {
    if (cat === 'Dama') {
      return (
        <>
          <button
            onClick={() => {
              onApply(
                applyRelativeCurve(COMERCIAL_PATTERN, '33', availableSizes)
              );
              onPresetChange('com-dama');
            }}
            className={getBtnClass('com-dama', 0)}
          >
            Comercial
          </button>
          {[2, 3, 4, 5].map((num, i) => (
            <button
              key={num}
              onClick={() => {
                onApply(applyFixedX(num, damaRange, availableSizes));
                onPresetChange(`fixed-${num}-dama`);
              }}
              className={getBtnClass(`fixed-${num}-dama`, i + 1)}
            >
              {num}xTalla
            </button>
          ))}
        </>
      );
    }

    if (cat === 'Caballero') {
      return (
        <>
          <button
            onClick={() => {
              onApply(
                applyRelativeCurve(COMERCIAL_PATTERN, '33', availableSizes)
              );
              onPresetChange('com-cab-peq');
            }}
            className={getBtnClass('com-cab-peq', 0)}
          >
            Comercial (33-38)
          </button>
          <button
            onClick={() => {
              onApply(
                applySpecificCurve(
                  { '37': 1, '38': 2, '39': 3, '40': 3, '41': 2, '42': 1 },
                  availableSizes
                )
              );
              onPresetChange('com-cab-grande');
            }}
            className={getBtnClass('com-cab-grande', 5)}
          >
            Comercial Grande (37-42)
          </button>
          <button
            onClick={() => {
              const curve: Record<string, number> = {};
              cabFullRange.forEach(
                (s) => (curve[s] = s === '38' || s === '39' ? 2 : 1)
              );
              onApply(applySpecificCurve(curve, availableSizes));
              onPresetChange('curva-cab');
            }}
            className={getBtnClass('curva-cab', 6)}
          >
            Curva (33-42)
          </button>
          {[2, 3, 4, 5].map((num, i) => (
            <button
              key={num}
              onClick={() => {
                onApply(applyFixedX(num, cabFullRange, availableSizes));
                onPresetChange(`fixed-${num}-cab`);
              }}
              className={getBtnClass(`fixed-${num}-cab`, i + 1)}
            >
              {num}xTalla (33-42)
            </button>
          ))}
        </>
      );
    }

    if (cat === 'Infantil') {
      const infSmall = ['21', '22', '23', '24', '25', '26'];
      const infLarge = ['27', '28', '29', '30', '31', '32'];
      const infFull = [...infSmall, ...infLarge];

      return (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-wrap gap-1.5">
            {[2, 3, 4, 5, 6].map((num, i) => (
              <button
                key={`s-${num}`}
                onClick={() => {
                  onApply(applyFixedX(num, infSmall, availableSizes));
                  onPresetChange(`fixed-${num}-inf-s`);
                }}
                className={getBtnClass(`fixed-${num}-inf-s`, i)}
              >
                {num}xT (21-26)
              </button>
            ))}
            {[2, 3, 4, 5, 6].map((num, i) => (
              <button
                key={`l-${num}`}
                onClick={() => {
                  onApply(applyFixedX(num, infLarge, availableSizes));
                  onPresetChange(`fixed-${num}-inf-l`);
                }}
                className={getBtnClass(`fixed-${num}-inf-l`, i + 1)}
              >
                {num}xT (27-32)
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                onApply(applyFixedX(1, infFull, availableSizes));
                onPresetChange('curve-1-inf');
              }}
              className={getBtnClass('curve-1-inf', 2)}
            >
              Curva Sencilla (1xT)
            </button>
            <button
              onClick={() => {
                onApply(applyFixedX(2, infFull, availableSizes));
                onPresetChange('curve-2-inf');
              }}
              className={getBtnClass('curve-2-inf', 3)}
            >
              Curva Doble (2xT)
            </button>
            <button
              onClick={() => {
                onApply(applyFixedX(3, infFull, availableSizes));
                onPresetChange('curve-3-inf');
              }}
              className={getBtnClass('curve-3-inf', 4)}
            >
              Curva Triple (3xT)
            </button>
            <button
              onClick={() => {
                onApply(applyFixedX(4, infFull, availableSizes));
                onPresetChange('curve-4-inf');
              }}
              className={getBtnClass('curve-4-inf', 5)}
            >
              Curva Cuádruple (4xT)
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-slate-800">
        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-blue-500" /> Numeraciones
          Rápidas
        </label>
        <button
          onClick={clearAll}
          className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase"
        >
          Limpiar Todo
        </button>
      </div>
      <div className="flex flex-wrap gap-2">{renderButtons()}</div>
    </div>
  );
}
