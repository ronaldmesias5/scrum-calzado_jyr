import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Filter, Search, Layers, Maximize2 } from 'lucide-react';
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
  const handleSaveProduct = async (updatedData: Partial<Product>, imageFile?: File) => {
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
  const handleCreateProduct = async (productData: any, imageFile?: File) => {
    try {
      // Obtener listas de referencias
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
  const categories = Array.from(new Set(products.map(p => p.category_name).filter(Boolean))) as string[];
  const brands = Array.from(new Set(products.map(p => p.brand_name).filter(Boolean))) as string[];
  const styles = Array.from(new Set(products.map(p => p.style_name).filter(Boolean))) as string[];
  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean))) as string[];

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
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-8 h-8 text-orange-600" />
            Gestión de Catálogo
          </h1>
          <p className="text-gray-600 mt-1">Administra todos los productos del catálogo • {totalProducts} en total</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Search className="w-4 h-4 inline mr-1" />
            Buscar producto
          </label>
          <input
            type="text"
            placeholder="Nombre, ID o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-6 gap-3">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Categoría
            </label>
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

          {/* Estilo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estilo</label>
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

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
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

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                setSelectedStyle('');
                setSelectedBrand('');
                setSelectedColor('');
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
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <Package className="mx-auto mb-2 text-gray-400" size={24} />
          <p className="text-gray-500 text-sm">No se encontraron productos</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Producto</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Categoría</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Color</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Stock</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewImage(
                          resolveImageUrl(product.image_url) || '/placeholder-product.png',
                          product.name
                        )}
                        className="relative w-8 h-8 bg-gray-200 rounded flex-shrink-0 overflow-hidden group cursor-pointer hover:bg-gray-300 transition-all"
                        title="Haz click para ver la imagen"
                      >
                        {product.image_url ? (
                          <img
                            src={resolveImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                          <Maximize2 size={12} className="text-white" />
                        </div>
                      </button>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.style_name} · ID: {product.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {product.category_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {product.color && (
                        <>
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: product.color.toLowerCase() === 'blanco' ? '#FFFFFF' :
                                product.color.toLowerCase() === 'negro' ? '#000000' :
                                product.color.toLowerCase() === 'gris' ? '#808080' :
                                product.color.toLowerCase() === 'rojo' ? '#FF0000' :
                                product.color.toLowerCase() === 'azul' ? '#0000FF' :
                                product.color.toLowerCase() === 'verde' ? '#00A000' :
                                product.color.toLowerCase() === 'amarillo' ? '#FFFF00' :
                                product.color.toLowerCase() === 'naranja' ? '#FFA500' :
                                product.color.toLowerCase() === 'marrón' ? '#A52A2A' :
                                product.color.toLowerCase() === 'rosa' ? '#FFC0CB' :
                                product.color.toLowerCase() === 'púrpura' ? '#800080' :
                                '#E5E7EB'
                            }}
                            title={product.color}
                          />
                          <span className="text-xs font-medium text-gray-700">{product.color}</span>
                        </>
                      )}
                      {!product.color && (
                        <span className="text-xs text-gray-400">Sin color</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {product.stock_total || 0} unidades
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleToggleState(product)}
                      title={product.is_active ? 'Click para deshabilitar' : 'Click para habilitar'}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
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
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Editar producto"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
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
