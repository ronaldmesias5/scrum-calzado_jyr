/**
 * Página: InventoryPage.tsx
 * Descripción: Página de gestión de inventario con alertas de bajo stock.
 * 
 * ¿Qué?
 *   Muestra:
 *   - Grid de productos con stock actual, mínimo, estado
 *   - Alertas visuales (rojo si stock ≤ minimum)
 *   - Modal para ajustar stock manualmente
 *   - Búsqueda y filtrado por producto
 * 
 * ¿Para qué?
 *   - Monitoreo en tiempo real de inventario
 *   - Alertar sobre bajo stock antes que se agote
 *   - Ajustes rápidos sin ir a catálogo
 * 
 * ¿Impacto?
 *   ALTO — Crítico para operaciones (evita overselling).
 */

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, AlertTriangle, Search, Plus, RefreshCw, Maximize2, Download } from 'lucide-react';
import { Product, listProducts, resolveImageUrl } from '../services/catalogService';
import AdjustInventoryModal from '../components/AdjustInventoryModal';
import ImageViewerModal from '../components/ImageViewerModal';
import StatCard from '../components/StatCard';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  // Cargar productos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await listProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.color && product.color.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.category_name === selectedCategory;
    const matchesBrand = !selectedBrand || product.brand_name === selectedBrand;
    const matchesStyle = !selectedStyle || product.style_name === selectedStyle;
    
    const stock = product.stock_total || 0;
    const threshold = product.insufficient_threshold || 12;
    const matchesState = !selectedState || (
      (selectedState === 'en-stock' && stock > 0) ||
      (selectedState === 'suficiente' && stock >= threshold) ||
      (selectedState === 'insuficiente' && stock > 0 && stock < threshold) ||
      (selectedState === 'sin-stock' && stock === 0)
    );

    return matchesSearch && matchesCategory && matchesBrand && matchesStyle && matchesState;
  });

  // Obtener categorías, marcas y estilos únicos
  const categories = Array.from(new Set(products.map(p => p.category_name)));
  const brands = Array.from(new Set(products.map(p => p.brand_name))).sort();
  const styles = Array.from(new Set(products.map(p => p.style_name))).sort();

  // Calcular métricas
  const totalStock = products.reduce((sum, p) => sum + (p.stock_total || 0), 0);
  const sufficientProducts = products.filter(p => (p.stock_total || 0) >= (p.insufficient_threshold || 12)).length;
  const insufficientProducts = products.filter(p => (p.stock_total || 0) > 0 && (p.stock_total || 0) < (p.insufficient_threshold || 12)).length;
  const outOfStockProducts = products.filter(p => (p.stock_total || 0) === 0).length;

  // Manejar guardar inventario
  const handleSaveInventory = async (quantities: Record<number, number>) => {
    try {
      // El guardado ya se hizo en AdjustInventoryModal via bulkUpdateInventory
      // Solo recargar productos para actualizar el stock
      await loadProducts();
    } catch (error) {
      console.error('Error reloading products:', error);
    }
  };

  const handleOpenAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setIsAdjustModalOpen(true);
  };

  const handleExportExcel = () => {
    // Filtrar productos con stock > 0
    const productsWithStock = filteredProducts.filter(p => (p.stock_total || 0) > 0);

    if (productsWithStock.length === 0) {
      alert('No hay productos con stock disponible para exportar');
      return;
    }

    // Preparar datos para el CSV
    const headers = ['Nombre Producto', 'Marca', 'Estilo', 'Categoría', 'Color', 'Stock Total', 'Mínimo Requerido', 'Estado'];
    const rows = productsWithStock.map(p => [
      p.name,
      p.brand_name,
      p.style_name,
      p.category_name,
      p.color || 'N/A',
      (p.stock_total || 0).toString(),
      (p.insufficient_threshold || 12).toString(),
      (p.stock_total || 0) >= (p.insufficient_threshold || 12) ? 'Suficiente' : 'Insuficiente',
    ]);

    // Crear CSV
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `inventario_stock_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-green-600" />
            Gestión de Inventario
          </h1>
          <p className="text-gray-600 mt-1">Controla el stock y movimientos de productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Stock Total"
          value={totalStock}
          icon={<Package size={24} />}
          color="blue"
        />
        <StatCard
          label="Suficiente"
          value={sufficientProducts}
          icon={<TrendingUp size={24} />}
          color="green"
        />
        <StatCard
          label="Insuficiente"
          value={insufficientProducts}
          icon={<AlertCircle size={24} />}
          color="orange"
        />
        <StatCard
          label="Sin Stock"
          value={outOfStockProducts}
          icon={<AlertTriangle size={24} />}
          color="red"
        />
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, estilo, marca o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              {styles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todas</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Stock</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              <option value="en-stock">En Stock (cualquier cantidad)</option>
              <option value="suficiente">Suficiente</option>
              <option value="insuficiente">Insuficiente</option>
              <option value="sin-stock">Sin Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSelectedStyle('');
                setSelectedState('');
                setSearchTerm('');
              }}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Marca</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Color</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700">Stock Actual</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const stock = product.stock_total || 0;
                  const threshold = product.insufficient_threshold || 12;
                  let statusColor = 'bg-green-100 text-green-700';
                  let statusText = 'Suficiente';
                  
                  if (stock === 0) {
                    statusColor = 'bg-red-100 text-red-700';
                    statusText = 'Sin Stock';
                  } else if (stock < threshold) {
                    statusColor = 'bg-orange-100 text-orange-700';
                    statusText = 'Insuficiente';
                  }

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {product.image_url && !failedImages.has(resolveImageUrl(product.image_url) || '') ? (
                            <button
                              onClick={() => {
                                const imgUrl = resolveImageUrl(product.image_url);
                                setViewingImage(imgUrl);
                                setViewingProductName(product.name);
                              }}
                              className="relative w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden group cursor-pointer border border-gray-300"
                              title="Haz click para ver la imagen"
                            >
                              <img
                                src={resolveImageUrl(product.image_url)}
                                alt={product.name}
                                onError={() => handleImageError(resolveImageUrl(product.image_url) || '')}
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                <Maximize2 size={16} className="text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-16 h-16 rounded-lg flex-shrink-0 border border-gray-300 bg-white flex items-center justify-center">
                              <Package size={24} className="text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.style_name} · {product.brand_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.brand_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.color || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-lg text-gray-900">{stock}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenAdjustModal(product)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                        >
                          <Plus size={16} />
                          Ajustar Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para ajustar inventario */}
      <AdjustInventoryModal
        isOpen={isAdjustModalOpen}
        product={selectedProduct}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveInventory}
      />

      {/* Modal visor de imagen */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage || ''}
        productName={viewingProductName}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
}
