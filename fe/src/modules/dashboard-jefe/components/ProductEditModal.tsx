import { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Product, listBrands, listCategories, Brand, Category } from '../services/catalogService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const resolveImg = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
};

interface ProductEditModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (updatedProduct: Partial<Product>, imageFile?: File) => Promise<void>;
}

export default function ProductEditModal({ isOpen, product, onClose, onSave }: ProductEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category_name: '',
    style_name: '',
    brand_name: '',
    color: '',
    stock: 0,
    description: '',
    image_url: '',
    is_active: true,
  });

  // Cargar marcas y categorías
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandsData, categoriesData] = await Promise.all([
          listBrands(),
          listCategories(),
        ]);
        setBrands(brandsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Inicializar formulario cuando se abre modal
  useEffect(() => {
    if (isOpen && product) {
      console.log('Producto cargado:', product);
      setFormData({
        name: product.name || product.style_name || '',
        category_name: product.category_name || '',
        style_name: product.style_name || '',
        brand_name: product.brand_name || '',
        color: product.color || '',
        stock: 0,
        description: product.description || '',
        image_url: product.image_url || '',
        is_active: product.is_active || true,
      });
      setImagePreview(resolveImg(product.image_url) || null);
      setSelectedImageFile(null);
      setUseImageUrl(false);
    }
  }, [isOpen, product]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor selecciona una imagen válida');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData, selectedImageFile || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Producto</h2>
            <p className="text-sm text-gray-600">Modifica la información del producto</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Nombre del Producto (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
              placeholder="Nombre del producto"
            />
            <p className="text-xs text-gray-500 mt-1">Edita el nombre tal como desees mostrar el producto</p>
          </div>

          {/* Estilo y Categoría en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estilo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="style_name"
                value={formData.style_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                placeholder="Ej: 1300, 9060, Air Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-600">*</span>
              </label>
              <select
                name="category_name"
                value={formData.category_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
              >
                <option value="">Seleccionar</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marca en fila */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca <span className="text-red-600">*</span>
            </label>
            <select
              name="brand_name"
              value={formData.brand_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
            >
              <option value="">Seleccionar marca</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
              placeholder="Negro"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
              placeholder="Aquí describe un poco sobre el producto, materiales, características especiales, etc."
            />
          </div>

          {/* Upload de Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del Producto
            </label>
            <div className="flex gap-4 mb-3">
              {/* Preview */}
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="text-gray-400" size={32} />
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-24 border-2 border-dashed rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-center pointer-events-none">
                    <Upload className={`mx-auto mb-1 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                    <p className="text-xs font-medium text-gray-700">Haz clic o arrastra</p>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={useImageUrl}
                  onChange={(e) => setUseImageUrl(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Usar enlace de imagen</span>
              </label>
              
              {useImageUrl && (
                <div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, image_url: e.target.value }));
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pega el link de una imagen de internet</p>
                </div>
              )}
            </div>
          </div>

          {/* Estado del Producto */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Estado del Producto</p>
                <p className="text-xs text-gray-500">El producto {formData.is_active ? 'estará' : 'no estará'} visible en el catálogo</p>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  formData.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                {formData.is_active ? '✓ Habilitado' : 'Deshabilitado'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
