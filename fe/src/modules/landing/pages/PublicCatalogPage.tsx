/**
 * Archivo: modules/landing/pages/PublicCatalogPage.tsx
 * Descripción: Página de catálogo público para clientes.
 * Permite filtrar por marca, estilo, categoría y búsqueda por texto.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, Filter, ChevronDown, Package, 
  Tag, Layers, Info, X, ShoppingCart
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import WhatsAppButton from '../components/WhatsAppButton';

import { 
  listPublicProducts, 
  listCategories, 
  listPublicBrands, 
  listPublicStyles,
  listColors,
  type Product, 
  type Category, 
  type Brand,
  type Style,
  resolveImageUrl 
} from '@/modules/dashboard-jefe/services/catalogService';

export default function PublicCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros locales
  const searchInput = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const styleId = searchParams.get('style') || '';
  const selectedColor = searchParams.get('color') || '';

  // Filtrar estilos según la marca seleccionada
  const filteredStyles = brandId 
    ? styles.filter(s => s.brand_id === brandId) 
    : styles;

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [pData, cData, bData, sData, coData] = await Promise.all([
          listPublicProducts({ 
            search: searchInput || undefined,
            category_id: categoryId || undefined,
            brand_id: brandId || undefined,
            style_id: styleId || undefined,
            color: selectedColor || undefined
          }),
          listCategories(),
          listPublicBrands(),
          listPublicStyles(),
          listColors(),
        ]);
        setProducts(pData);
        setCategories(cData);
        setBrands(bData);
        setStyles(sData);
        setColors(coData);
      } catch (err) {
        console.error("Error loading catalog data:", err);
        setError("Ocurrió un error al cargar el catálogo. Por favor intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [searchInput, categoryId, brandId, styleId, selectedColor]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    // Si cambia la marca, asegurarnos de que el estilo seleccionado (si lo hay) pertenezca a esa marca
    if (key === 'brand' && value) {
      const currentStyleId = newParams.get('style');
      if (currentStyleId) {
        const styleBelongsToBrand = styles.some(s => s.id === currentStyleId && s.brand_id === value);
        if (!styleBelongsToBrand) {
          newParams.delete('style');
        }
      }
    }

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  /** Lógica de tallas por categoría */
  const getSizeRange = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('infantil') || name.includes('niñ')) {
      return "Tallas: 21 al 32";
    }
    return "Tallas: 33 al 43";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <LandingHeader />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Encabezado de página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-500 mt-2">Explora nuestra colección de calzado de alta calidad.</p>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
              >
                <option value="">Todas</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select
                value={brandId}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
              >
                <option value="">Todas</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Estilo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estilo</label>
              <select
                value={styleId}
                onChange={(e) => handleFilterChange('style', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
              >
                <option value="">Todos</option>
                {filteredStyles.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Buscador (Producto) */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchInput}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => handleFilterChange('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
              >
                <option value="">Todos</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Limpiar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <button
                onClick={clearFilters}
                disabled={!(searchInput || categoryId || brandId || styleId || selectedColor)}
                className={`w-full px-2 py-2 text-xs border rounded-lg transition-colors font-medium flex items-center justify-center gap-1
                  ${(searchInput || categoryId || brandId || styleId || selectedColor)
                    ? 'border-gray-300 text-red-600 hover:bg-gray-50 hover:text-red-700'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  }
                `}
              >
                <X size={16} /> Limpiar
              </button>
            </div>

          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-medium text-gray-900">No se encontraron productos</h3>
            <p className="text-gray-500 mt-2">Prueba ajustando tus filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col"
              >
                {/* Imagen */}
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={resolveImageUrl(product.image_url)} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={64} />
                    </div>
                  )}
                  {/* Badge Categoría */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-blue-800 rounded shadow-sm border border-blue-50">
                      {product.category_name}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-1 flex justify-between items-start">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-tight">
                      {product.brand_name}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                    {product.color ? `Color: ${product.color}` : ''}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Layers size={14} />
                      </div>
                      <span className="font-medium">{getSizeRange(product.category_name)}</span>
                    </div>

                    <Link to="/auth/login" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
                      <ShoppingCart size={16} /> Realizar Pedido
                    </Link>
                    
                    <p className="text-[11px] text-center text-gray-500 mt-2">
                      Para realizar tus pedidos, <Link to="/auth/login" className="text-blue-600 hover:underline font-medium">inicia sesión</Link> (venta al por mayor).
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <LandingFooter />
      <WhatsAppButton />
    </div>
  );
}
