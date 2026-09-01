/**
 * Página: CatalogPage.tsx (landing - catálogo público)
 * Descripción: Página de catálogo público con productos disponibles para venta.
 * Incluye filtros, búsqueda y tarjetas de productos.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LandingHeader from '@/features/landing/components/organisms/LandingHeader';
import LandingFooter from '@/features/landing/components/organisms/LandingFooter';
import ProductCard from '@/features/landing/components/molecules/ProductCard';
import CatalogFilters from '@/features/landing/components/molecules/CatalogFilters';
import OrderFormModal from '@/features/admin/components/organisms/OrderFormModal';
import Pagination from '@/components/atoms/Pagination';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import {
  getPublicProducts,
  getCatalogCategories,
  getCatalogBrands,
  getCatalogStyles,
  getCatalogColors,
  Product,
  Category,
  Brand,
  Style,
  PublicCatalogFilters
} from '@/services/publicCatalogService';

export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estilos filtrados según la marca seleccionada
  const filteredStyles = selectedBrand
    ? styles.filter((s) => s.brand_id === selectedBrand)
    : styles;

  // Cargar datos iniciales
  useEffect(() => {
    loadCatalogData();
  }, []);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    selectedBrand,
    selectedStyle,
    selectedColor,
    searchTerm
  ]);

  // Resetear estilo si cambia la marca y el estilo ya no es válido
  useEffect(() => {
    if (selectedStyle) {
      const isValidStyle = filteredStyles.some((s) => s.id === selectedStyle);
      if (!isValidStyle) {
        setSelectedStyle('');
      }
    }
  }, [selectedBrand, filteredStyles, selectedStyle]);

  // Recargar productos cuando cambian los filtros o página
  useEffect(() => {
    loadProducts();
  }, [
    selectedCategory,
    selectedBrand,
    selectedStyle,
    selectedColor,
    searchTerm,
    page
  ]);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const [categoriesData, brandsData, stylesData, colorsData] =
        await Promise.all([
          getCatalogCategories(),
          getCatalogBrands(),
          getCatalogStyles(),
          getCatalogColors()
        ]);

      setCategories(categoriesData);
      setBrands(brandsData);
      setStyles(stylesData);
      setColors(colorsData);

      // Cargar productos iniciales
      await loadProducts();
      setError(null);
    } catch (err) {
      console.error('Error cargando datos del catálogo:', err);
      setError('No se pudieron cargar los datos del catálogo');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const filters: PublicCatalogFilters = {
        category_id: selectedCategory || undefined,
        brand_id: selectedBrand || undefined,
        style_id: selectedStyle || undefined,
        color: selectedColor || undefined,
        search: searchTerm || undefined
      };

      const data = await getPublicProducts(filters, page);
      setProducts(data.products);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('No se pudieron cargar los productos');
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStyle('');
    setSelectedColor('');
    setSearchTerm('');
  };

  const isFiltering =
    !!selectedCategory ||
    !!selectedBrand ||
    !!selectedStyle ||
    !!selectedColor ||
    !!searchTerm;

  const handleOrderClick = () => {
    if (user?.id) {
      setOrderModalOpen(true);
      return;
    }
    navigate('/?login=true');
  };

  // Función para obtener nombre de marca
  const getBrandName = (brandId?: string): string => {
    if (!brandId) return '';
    return brands.find((b) => b.id === brandId)?.name || '';
  };

  // Función para obtener nombre de estilo
  const getStyleName = (styleId?: string): string => {
    if (!styleId) return '';
    return styles.find((s) => s.id === styleId)?.name || '';
  };

  // Función para obtener nombre de categoría
  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return '';
    return categories.find((c) => c.id === categoryId)?.name || '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      <LandingHeader />

      <main className="flex-1">
        {/* Header de catálogo with Breadcrumb */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Breadcrumbs />
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('common.back') || 'Volver'}
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {t('common.loading') || 'Cargando...'}
              </p>
            </div>
          ) : (
            <>
              <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-200/60 bg-slate-950 px-6 py-8 text-white shadow-xl shadow-blue-950/10 dark:border-blue-900/60 sm:px-9 sm:py-10">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-900/40 to-transparent" />
                <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                  <div className="max-w-2xl">
                    <div className="mb-4 flex items-center gap-2 text-blue-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.25em]">
                        Calzado J&R / colección actual
                      </span>
                    </div>
                    <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                      {t('landing.catalog.title')}
                    </h1>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                      {t('landing.catalog.subtitle')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-8">
                    <div className="border-l border-blue-400/50 pl-4">
                      <p className="text-2xl font-bold text-white">
                        {products.length}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                        Modelos visibles
                      </p>
                    </div>
                    <div className="border-l border-blue-400/50 pl-4">
                      <p className="text-2xl font-bold text-white">
                        {brands.length}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                        Marcas
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Filtros */}
              <CatalogFilters
                categories={categories}
                brands={brands}
                styles={filteredStyles}
                colors={colors}
                selectedCategory={selectedCategory}
                selectedBrand={selectedBrand}
                selectedStyle={selectedStyle}
                selectedColor={selectedColor}
                searchTerm={searchTerm}
                onCategoryChange={setSelectedCategory}
                onBrandChange={setSelectedBrand}
                onStyleChange={setSelectedStyle}
                onColorChange={setSelectedColor}
                onSearchChange={setSearchTerm}
                onClear={handleClearFilters}
                isFiltering={isFiltering}
              />

              {/* Productos */}
              {products.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {t('landing.catalog.noProducts')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Contador de resultados */}
                  <div className="flex items-end justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                        Selección disponible
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {products.length}{' '}
                        {products.length === 1
                          ? 'producto encontrado'
                          : 'productos encontrados'}
                      </p>
                    </div>
                    <Tag className="h-5 w-5 text-slate-400" />
                  </div>

                  {/* Grilla de productos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        brandName={getBrandName(product.brand_id)}
                        styleName={getStyleName(product.style_id)}
                        categoryName={getCategoryName(product.category_id)}
                        onOrderClick={handleOrderClick}
                      />
                    ))}
                  </div>

                  {/* Paginación */}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              )}
            </>
          )}
        </div>
        <OrderFormModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          onSuccess={() => {
            setOrderModalOpen(false);
            window.dispatchEvent(new Event('orders-updated'));
          }}
          fixedCustomerId={user?.id ?? null}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
