import { Layers } from 'lucide-react';

interface CategoryFilterProps {
  value: string | null;
  onChange: (category: string | null) => void;
  size?: 'sm' | 'md';
}

const CATEGORIES = [
  { label: 'Todas', value: null, color: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600', active: 'bg-gray-800 dark:bg-slate-500 text-white border-gray-800 dark:border-slate-500' },
  { label: 'Dama', value: 'Dama', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-300 dark:border-pink-700', active: 'bg-pink-600 dark:bg-pink-600 text-white border-pink-600' },
  { label: 'Caballero', value: 'Caballero', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700', active: 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600' },
  { label: 'Infantil', value: 'Infantil', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700', active: 'bg-amber-600 dark:bg-amber-600 text-white border-amber-600' },
];

export default function CategoryFilter({ value, onChange, size = 'md' }: CategoryFilterProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs gap-1'
    : 'px-3 py-1.5 text-sm gap-1.5';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
        <Layers className="w-3.5 h-3.5" />
        Categoría
      </span>
      {CATEGORIES.map((cat) => {
        const isActive = value === cat.value;
        return (
          <button
            key={cat.label}
            onClick={() => onChange(cat.value)}
            className={`rounded-full border font-medium transition-all duration-200 cursor-pointer whitespace-nowrap
              ${sizeClasses}
              ${isActive ? cat.active : cat.color}
              hover:opacity-80
            `}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
