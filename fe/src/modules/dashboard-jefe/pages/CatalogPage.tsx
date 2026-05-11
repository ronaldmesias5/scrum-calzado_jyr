import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, Filter, Search, Layers, Maximize2 } from 'lucide-react';
import { Product, listProducts, updateProduct, deleteProduct, createProduct, listBrands, listStyles, listCategories, createStyle, uploadProductImage, resolveImageUrl, toggleProductState } from '../services/catalogService';
import ProductEditModal from '../components/ProductEditModal';
import ProductCreateModal from '../components/ProductCreateModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ImageViewerModal from '../components/ImageViewerModal';
import StatCard from '../components/StatCard';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [brandList, setBrandList] = useState<string[]>([]);
  const [styleList, setStyleList] = useState<string[]>([]);

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

  // Cargar opciones de filtros
  const loadFilterOptions = async () => {
    try {
      const [categories, brands, styles] = await Promise.all([
        listCategories(),
        listBrands(),
        listStyles(),
      ]);

      setCategoryList(categories.map(c => c.name));
      setBrandList(brands.map(b => b.name));
      setStyleList(styles.map(s => s.name));
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Ver imagen en grande
  const handleViewImage = (imageUrl: string, productName: string) => {
    setViewingImage(imageUrl);
    setViewingProductName(productName);
  };

  // Manejar edición de producto
  const handleEditProduct = async (product: Product) => {
    try {
      // Recargar el producto específico para obtener todos los datos actualizados
      const allProducts = await listProducts({ category_id: product.category_id });
      const fullProduct = allProducts.find(p => p.id === product.id);
      if (fullProduct) {
        setEditingProduct(fullProduct);
      } else {
        setEditingProduct(product);
      }
    } catch (error) {
      console.error('Error loading full product data:', error);
      setEditingProduct(product);
    }
    setIsEditModalOpen(true);
  };

  // Toggle habilitado/deshabilitado directo desde la tabla
  const handleToggleState = async (product: Product) => {
    try {
      await toggleProductState(product.id);
      await loadProducts();
    } catch (error: any) {
      console.error('Error toggling product state:', error);
      alert('Error al cambiar el estado del producto');
    }
  };

  // Guardar cambios del producto
  const handleSaveProduct = async (updatedData: Partial<Product>, imageFile?: File, supplyLinks?: Record<string, number>) => {
    if (!editingProduct) return;

    try {
      // Resolver brand_id, style_id y category_id a partir de los nombres
      const [brands, styles, categories] = await Promise.all([
        listBrands(),
        listStyles(),
        listCategories(),
      ]);

      const brandName = (updatedData as any).brand_name || editingProduct.brand_name;
      const styleName = (updatedData as any).style_name || editingProduct.style_name;
      const categoryName = (updatedData as any).category_name || editingProduct.category_name;

      const brand = brands.find(b => b.name === brandName);
      const style = styles.find(s => s.name === styleName);
      const category = categories.find(c => c.name === categoryName);

      const brand_id = brand?.id || editingProduct.brand_id;
      const style_id = style?.id || editingProduct.style_id;
      const category_id = category?.id || editingProduct.category_id;

      // 1) Enviar datos de texto como JSON
      const dataToSend = {
        name: updatedData.name || editingProduct.name,
        description: updatedData.description ?? '',
        color: updatedData.color ?? '',
        brand_id,
        style_id,
        category_id,
        insufficient_threshold: editingProduct.insufficient_threshold || 12,
        task_prices: (updatedData as any).task_prices ?? editingProduct.task_prices ?? {},
      };

      await updateProduct(editingProduct.id, dataToSend);

      // 2) Si cambió el estado (is_active), llamar toggle-state
      const newActive = (updatedData as any).is_active;
      const currentActive = editingProduct.is_active ?? editingProduct.state;
      if (newActive !== undefined && newActive !== currentActive) {
        await toggleProductState(editingProduct.id);
      }

      // 3) Subir imagen por separado si el usuario seleccionó una
      if (imageFile) {
        await uploadProductImage(editingProduct.id, imageFile);
      }

      // 4) Sincronizar Insumos
      if (supplyLinks) {
        try {
          const { checkProductSupplies, linkSupplyToProduct, unlinkSupplyFromProduct } = await import('../services/suppliesService');
          
          // Obtener actuales para saber qué desvincular
          const currentRes = await checkProductSupplies(editingProduct.id);
          const currentIds = currentRes.supplies.map(s => s.supply_id);
          const newIds = Object.keys(supplyLinks);
          
          // Eliminar los que ya no están
          for (const oldId of currentIds) {
            if (!newIds.includes(oldId)) {
              await unlinkSupplyFromProduct(editingProduct.id, oldId);
            }
          }
          
          // Vincular o actualizar todos los seleccionados
          for (const [supplyId, qty] of Object.entries(supplyLinks)) {
            await linkSupplyToProduct(editingProduct.id, supplyId, qty);
          }
        } catch (suppError) {
          console.error('Error sincronizando insumos:', suppError);
        }
      }

      // Recargar productos
      await loadProducts();
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      const detail = error?.response?.data?.detail;
      alert(detail ? `Error: ${detail}` : 'Error al guardar el producto');
    }
  };

  // Crear nuevo producto
  const handleCreateProduct = async (productData: any, imageFile?: File, supplyLinks?: Record<string, number>) => {
    try {
      // 1. Obtener la marca primeroencias
      const brands = await listBrands();
      let styles = await listStyles();
      const categories = await listCategories();

      // Buscar los IDs por nombre
      let brand = brands.find(b => b.name === productData.brand_name);
      let style = styles.find(s => s.name === productData.style_name);
      const category = categories.find(c => c.name === productData.category_name);

      if (!brand) {
        alert('Error: Marca no encontrada');
        return;
      }

      if (!category) {
        alert('Error: Categoría no encontrada');
        return;
      }

      // Si el estilo no existe, crearlo automáticamente
      if (!style) {
        try {
          style = await createStyle(productData.style_name, brand.id);
        } catch (error) {
          console.error('Error creating style:', error);
          alert('Error al crear el estilo automáticamente');
          return;
        }
      }

      // 1) Crear el producto con todos los campos de texto
      const newProduct = await createProduct(
        brand.id,
        style.id,
        category.id,
        productData.name || style.name,
        productData.description,
        productData.color,
        undefined,
        productData.task_prices,
      );

      // 2) Subir imagen por separado si hay una
      if (imageFile && newProduct.id) {
        try {
          await uploadProductImage(newProduct.id, imageFile);
        } catch (imgError) {
          console.error('Error uploading image:', imgError);
          // No bloqueamos — el producto fue creado, solo falla la imagen
        }
      }
      
      // 3) Vincular insumos
      if (supplyLinks && Object.keys(supplyLinks).length > 0 && newProduct.id) {
        try {
          const { linkSupplyToProduct } = await import('../services/suppliesService');
          for (const [supplyId, qty] of Object.entries(supplyLinks)) {
            await linkSupplyToProduct(newProduct.id, supplyId, qty);
          }
        } catch (err) {
          console.error('Error al vincular insumos:', err);
        }
      }

      // Recargar productos
      await loadProducts();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('Error creating product:', error);
      const detail = error?.response?.data?.detail;
      alert(detail ? `Error: ${detail}` : 'Error al crear el producto. Verifica que todos los datos sean válidos.');
    }
  };

  // Abrir modal de confirmar eliminación
  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación de producto
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      
      // Recargar productos
      await loadProducts();
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extraer valores únicos para los filtros
  const categories = categoryList;
  const brands = brandList;
  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean))) as string[];

  // Obtener estilos filtrando por marca (si hay una seleccionada)
  const styles = selectedBrand 
    ? styleList.filter(s => {
        // Filtrar estilos que pertenecen a la marca seleccionada
        return products.some(p => p.style_name === s && p.brand_name === selectedBrand);
      })
    : styleList;

  // Si se selecciona una marca y el estilo actual no pertenece a esa marca, limpiar el estilo
  useEffect(() => {
    if (selectedBrand && selectedStyle) {
      const styleBelongsToBrand = products.some(p => p.brand_name === selectedBrand && p.style_name === selectedStyle);
      if (!styleBelongsToBrand) {
        setSelectedStyle('');
      }
    }
  }, [selectedBrand, selectedStyle, products]);

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_name === selectedCategory;
    const matchesBrand = !selectedBrand || p.brand_name === selectedBrand;
    const matchesStyle = !selectedStyle || p.style_name === selectedStyle;
    const matchesColor = !selectedColor || p.color === selectedColor;
    const matchesState = !selectedState || (selectedState === 'active' ? p.is_active : !p.is_active);
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStyle && matchesColor && matchesState;
  });

  // Calcular métricas
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const inactiveProducts = products.filter(p => !p.is_active).length;

  // Inicializar
  useEffect(() => {
    loadProducts();
    loadFilterOptions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Layers className="w-8 h-8 text-orange-600" />
            Gestión de Catálogo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">Administra todos los productos del catálogo • {totalProducts} en total</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Plus size={18} /> Agregar Producto
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Productos"
          value={totalProducts}
          icon={<Package size={24} />}
          color="blue"
        />
        <StatCard
          label="Habilitados"
          value={activeProducts}
          icon={<Eye size={24} />}
          color="green"
        />
        <StatCard
          label="Deshabilitados"
          value={inactiveProducts}
          icon={<EyeOff size={24} />}
          color="red"
        />
        <StatCard
          label="Stock Total"
          value={products.reduce((sum, p) => sum + (p.stock_total || 0), 0)}
          icon={<Package size={24} />}
          color="purple"
        />
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Categoría
            </label>
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

          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              <option value="active">Habilitado</option>
              <option value="inactive">Deshabilitado</option>
            </select>
          </div>

          {/* Limpiar Filtros */}
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
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center shadow-sm">
          <Package className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron productos</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm transition-all duration-300">
          <table className="w-full text-sm min-w-max md:min-w-0">
            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewImage(
                          resolveImageUrl(product.image_url) || '/placeholder-product.png',
                          product.name
                        )}
                        className="relative w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                        title="Haz click para ver la imagen"
                      >
                        {product.image_url ? (
                          <img
                            src={resolveImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                          <Maximize2 size={16} className="text-white" />
                        </div>
                      </button>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.style_name} · ID: {product.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold rounded transition-colors">
                      {product.category_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {product.color || <span className="text-gray-400 dark:text-gray-500">Sin color</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold rounded transition-colors">
                      {product.stock_total || 0} unidades
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleToggleState(product)}
                      title={product.is_active ? 'Click para deshabilitar' : 'Click para habilitar'}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      }`}
                    >
                      {product.is_active ? (
                        <><Eye size={12} /> Habilitado</>
                      ) : (
                        <><EyeOff size={12} /> Deshabilitado</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Editar producto"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edición */}
      <ProductEditModal
        isOpen={isEditModalOpen}
        product={editingProduct}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Modal de Creación */}
      <ProductCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProduct}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        product={deletingProduct}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
      />

      {/* Modal de Visualización de Imagen */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage}
        productName={viewingProductName}
        onClose={() => {
          setViewingImage(null);
          setViewingProductName('');
        }}
      />
    </div>
  );
}
