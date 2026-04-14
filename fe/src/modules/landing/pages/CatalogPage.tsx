/**
 * Página: CatalogPage.tsx (landing - catálogo público)
 * Descripción: Página de catálogo público con productos disponibles para venta.
 * Incluye filtros, búsqueda y tarjetas de productos.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';
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
  PublicCatalogFilters,
} from '../services/publicCatalogService';

export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    loadCatalogData();
  }, []);

  // Recargar productos cuando cambian los filtros
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedBrand, selectedStyle, selectedColor, searchTerm]);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const [categoriesData, brandsData, stylesData, colorsData] = await Promise.all([
        getCatalogCategories(),
        getCatalogBrands(),
        getCatalogStyles(),
        getCatalogColors(),
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
        search: searchTerm || undefined,
      };

      const data = await getPublicProducts(filters);
      setProducts(data);
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

  const handleOrderClick = (product: Product) => {
    // Redirigir a login si no está autenticado
    navigate('/auth/login', { state: { returnTo: '/dashboard/orders' } });
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
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <button
                onClick={() => navigate('/')}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Inicio
              </button>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">Catálogo</span>
            </div>
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
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
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
              {/* Filtros */}
              <CatalogFilters
                categories={categories}
                brands={brands}
                styles={styles}
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {products.length}{' '}
                      {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                    </p>
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
                </>
              )}
            </>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
