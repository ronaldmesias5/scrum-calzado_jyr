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
// @ts-ignore
const XLSX = window.XLSX;
import { Package, TrendingUp, AlertCircle, AlertTriangle, Search, RefreshCw, Maximize2, Download, XCircle } from 'lucide-react';
import { Product, listProducts, resolveImageUrl } from '../services/catalogService';
import AdjustInventoryModal from '../components/AdjustInventoryModal';
import ViewManufacturedModal from '../components/ViewManufacturedModal';
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
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isViewManufacturedOpen, setIsViewManufacturedOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showExportError, setShowExportError] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    if (showExportError) {
      const timer = setTimeout(() => setShowExportError(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showExportError]);

  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

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
    const matchesColor = !selectedColor || product.color === selectedColor;
    
    const stock = product.stock_total || 0;
    const threshold = product.insufficient_threshold || 12;
    const matchesState = !selectedState || (
      (selectedState === 'en-stock' && stock > 0) ||
      (selectedState === 'suficiente' && stock >= threshold) ||
      (selectedState === 'insuficiente' && stock > 0 && stock < threshold) ||
      (selectedState === 'sin-stock' && stock === 0)
    );

    return matchesSearch && matchesCategory && matchesBrand && matchesStyle && matchesColor && matchesState;
  });

  // Obtener categorías, marcas, estilos y colores únicos
  const categories = Array.from(new Set(products.map(p => p.category_name).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.brand_name).filter(Boolean))).sort();
  const styles = Array.from(new Set(products.map(p => p.style_name).filter(Boolean))).sort();
  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean))).sort();

  // Calcular métricas
  const totalStock = products.reduce((sum, p) => sum + (p.stock_total || 0), 0);
  const sufficientProducts = products.filter(p => (p.stock_total || 0) >= (p.insufficient_threshold || 12)).length;
  const insufficientProducts = products.filter(p => (p.stock_total || 0) > 0 && (p.stock_total || 0) < (p.insufficient_threshold || 12)).length;
  const outOfStockProducts = products.filter(p => (p.stock_total || 0) === 0).length;

  // Manejar guardar inventario
  const handleSaveInventory = async (_quantities: Record<number, number>) => {
    void _quantities;
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

  const handleOpenViewManufacturedModal = (product: Product) => {
    setSelectedProduct(product);
    setIsViewManufacturedOpen(true);
  };

  const handleExportExcel = () => {
    // Filtrar productos con stock > 0
    const productsWithStock = filteredProducts.filter(p => (p.stock_total || 0) > 0);

    if (productsWithStock.length === 0) {
      setShowExportError(true);
      return;
    }

    // Preparar encabezados con estilo
    const headers = [
      'Nombre Producto', 'Marca', 'Estilo', 'Categoría', 'Color',
      'Stock Total', 'Mínimo Requerido', 'Estado'
    ];

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E40AF" } }, // Dark Blue
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    };

    // Crear filas de datos
    const rows = productsWithStock.map(p => {
      const stock = p.stock_total || 0;
      const threshold = p.insufficient_threshold || 12;
      const isSufficient = stock >= threshold;
      const statusText = isSufficient ? 'Suficiente' : 'Insuficiente';

      // Estilo para la celda de estado
      const statusStyle = {
        font: { bold: true, color: { rgb: isSufficient ? "15803D" : "C2410C" } },
        fill: { fgColor: { rgb: isSufficient ? "DCFCE7" : "FFEDD5" } },
        alignment: { horizontal: "center" }
      };

      const centerStyle = { alignment: { horizontal: "center" } };

      return [
        { v: p.name },
        { v: p.brand_name },
        { v: p.style_name },
        { v: p.category_name },
        { v: p.color || 'N/A' },
        { v: stock, s: centerStyle },
        { v: threshold, s: centerStyle },
        { v: statusText, s: statusStyle }
      ];
    });

    // Combinar encabezados y filas
    const data = [
      headers.map(h => ({ v: h, s: headerStyle })),
      ...rows
    ];

    // Crear libro y hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Generar nombre de archivo y descargar
    const filename = `inventario_stock_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
            Gestión de Inventario
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">Controla el stock y movimientos de productos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all font-bold shadow-lg hover:shadow-green-500/20 active:scale-95"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          <button
            onClick={loadProducts}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95"
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
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todas</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estilo</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              {styles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Producto (Búsqueda) */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Nombre, ID, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* Nivel de Stock */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Stock</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              <option value="en-stock">En Stock</option>
              <option value="suficiente">Suficiente</option>
              <option value="insuficiente">Insuficiente</option>
              <option value="sin-stock">Sin Stock</option>
            </select>
          </div>

          {/* Limpiar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSelectedStyle('');
                setSelectedColor('');
                setSelectedState('');
                setSearchTerm('');
              }}
              className="w-full px-2 py-2 text-xs border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-gray-700 dark:text-gray-300 active:scale-95 shadow-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>


      {/* Tabla de Productos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando inventario...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Package size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-lg">No se encontraron productos</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Prueba ajustando los filtros de búsqueda</p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedBrand(''); setSelectedStyle(''); setSelectedColor(''); setSelectedState(''); }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Bodega</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pares Fabricados</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredProducts.map(product => {
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
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          {product.image_url && !failedImages.has(resolveImageUrl(product.image_url) || '') ? (
                            <button
                              onClick={() => {
                                const imgUrl = resolveImageUrl(product.image_url);
                                setViewingImage(imgUrl || null);
                                setViewingProductName(product.name);
                              }}
                              className="relative w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                              title="Haz click para ver la imagen"
                            >
                              <img
                                src={resolveImageUrl(product.image_url)}
                                alt={product.name}
                                onError={() => handleImageError(resolveImageUrl(product.image_url) || '')}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                <Maximize2 size={16} className="text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                              <Package size={22} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{product.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.style_name} · {product.brand_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-medium">{product.category_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-medium">{product.brand_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-medium">{product.color || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{stock}</span>
                          <button
                            onClick={() => handleOpenAdjustModal(product)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-bold text-xs"
                          >
                            + Ajustar
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 transition-colors">{product.manufactured_pairs || 0}</span>
                          <button
                            onClick={() => handleOpenViewManufacturedModal(product)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-bold text-xs"
                          >
                            👁️
                            Ver
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Modal para ver pares fabricados por talla */}
      <ViewManufacturedModal
        isOpen={isViewManufacturedOpen}
        product={selectedProduct}
        onClose={() => {
          setIsViewManufacturedOpen(false);
          setSelectedProduct(null);
        }}
      />

      {/* Modal visor de imagen */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage || ''}
        productName={viewingProductName}
        onClose={() => setViewingImage(null)}
      />

      {/* Toast de Error de Exportación */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${showExportError ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-400/50 backdrop-blur-md">
          <AlertTriangle size={20} />
          <div className="flex flex-col">
            <p className="text-sm font-bold">Sin stock disponible</p>
            <p className="text-[10px] opacity-90 font-medium">No hay productos para exportar en el listado actual.</p>
          </div>
          <button onClick={() => setShowExportError(false)} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
            <XCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
