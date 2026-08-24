import { X, Search } from "lucide-react";
import { Brand, Category, Style } from "@/services/wholesaleCatalogApi";

interface WholesaleCatalogFiltersProps {
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

const selectClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200";

export function WholesaleCatalogFilters({
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
}: WholesaleCatalogFiltersProps) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Filtros
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Encuentra los modelos disponibles para tu pedido mayorista.
        </p>
        </div>
        {isFiltering && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Filtros activos</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Marca
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Estilo
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => onStyleChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Color
          </label>
          <select
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nombre o marca..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

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

    </section>
  );
}
