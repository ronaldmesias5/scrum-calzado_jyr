import { X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Brand, Category, Style } from '../services/publicCatalogService';

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
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-lg">
      {/* Título */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{t('landing.catalog.title')}</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('landing.catalog.subtitle')}
        </p>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        {/* Una sola fila con todos los filtros */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
          <div>
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
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="flex items-end">
            <button
              onClick={onClear}
              disabled={!isFiltering}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all font-bold text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {isFiltering && (
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold">
            <span>✓ Filtros activos aplicados</span>
          </div>
        )}
      </div>
    </div>
  );
}
