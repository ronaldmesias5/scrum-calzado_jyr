import { Filter, X, Search } from 'lucide-react';
import { Brand, Category, Style } from '@/services/publicCatalogService';

interface CatalogFiltersProps {
  categories: Category[];
  brands: Brand[];
  styles: Style[];
  colors: string[];
  selectedCategory: string;
  selectedBrand: string;
  selectedStyle: string;
  selectedColor: string;
  searchTerm: string;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  isFiltering: boolean;
}

export default function CatalogFilters({
  categories,
  brands,
  styles,
  colors,
  selectedCategory,
  selectedBrand,
  selectedStyle,
  selectedColor,
  searchTerm,
  onCategoryChange,
  onBrandChange,
  onStyleChange,
  onColorChange,
  onSearchChange,
  onClear,
  isFiltering,
}: CatalogFiltersProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
      <div className="pointer-events-none absolute right-0 top-0 h-1 w-1/3 bg-blue-500" />
      {/* Título */}
      <div className="relative mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Filter className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Explorar por</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Refine your selection
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a category, brand or style to narrow the collection.
          </p>
        </div>
        {isFiltering && (
          <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 sm:inline-flex">
            Filtros activos
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="relative space-y-5">
        {/* Una sola fila con todos los filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => onBrandChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
            >
              <option value="">Todas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Estilo
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => onStyleChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
            >
              <option value="">Todos</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Color
            </label>
            <select
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
            >
              <option value="">Todos</option>
              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="flex items-end">
            <button
              onClick={onClear}
              disabled={!isFiltering}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-bold text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {isFiltering && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <span>Filtros activos aplicados</span>
            <span className="text-xs font-medium opacity-75">Actualizado</span>
          </div>
        )}
      </div>
    </section>
  );
}
