import { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Product, listBrands, listCategories, listStyles, Brand, Category, Style } from '../services/catalogService';
import { listSupplies, Supply, checkProductSupplies } from '../services/suppliesService';

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
  onSave: (updatedProduct: Partial<Product>, imageFile?: File, supplyLinks?: Record<string, number>) => Promise<void>;
}

export default function ProductEditModal({ isOpen, product, onClose, onSave }: ProductEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [supplyLinks, setSupplyLinks] = useState<Record<string, string>>({});
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

  // Cargar marcas, categorías e insumos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandsData, categoriesData, suppliesData] = await Promise.all([
          listBrands(),
          listCategories(),
          listSupplies(),
        ]);
        setBrands(brandsData);
        setCategories(categoriesData);
        setSupplies(suppliesData.items);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Inicializar formulario cuando se abre modal
  useEffect(() => {
    if (isOpen && product) {
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
      setSupplyLinks({});

      // Cargar insumos actuales vinculados
      const fetchCurrentSupplies = async () => {
        try {
          const res = await checkProductSupplies(product.id);
          const links: Record<string, string> = {};
          res.supplies.forEach(s => {
            // Conversión: Backend (par) -> UI (docena) => * 12
            // Usamos string para el estado del input
            const qtyDozen = s.quantity_required * 12;
            links[s.supply_id] = qtyDozen % 1 === 0 ? qtyDozen.toString() : qtyDozen.toFixed(2);
          });
          setSupplyLinks(links);
        } catch (error) {
          console.error('Error fetching current supplies:', error);
        }
      };
      fetchCurrentSupplies();
    }
  }, [isOpen, product]);

  // Cargar estilos cuando cambia la marca
  useEffect(() => {
    const fetchStyles = async () => {
      if (formData.brand_name && brands.length > 0) {
        const brand = brands.find(b => b.name === formData.brand_name);
        if (brand) {
          try {
            const stylesData = await listStyles(brand.id);
            setStyles(stylesData);
            if (isOpen && !stylesData.find(s => s.name === formData.style_name)) {
              if (formData.brand_name !== product?.brand_name) {
                 setFormData(prev => ({ ...prev, style_name: '' }));
              }
            }
          } catch {
            setStyles([]);
          }
        }
      } else {
        setStyles([]);
      }
    };
    fetchStyles();
  }, [formData.brand_name, brands, isOpen, product]);

  const suppliesByCategory = supplies.reduce((acc, curr) => {
    const cat = curr.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, Supply[]>);

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
      const file = files[0] as File;
      if (file && file.type.startsWith('image/')) {
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
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert dozen-based inputs into per-pair quantities for the backend
      const transformedLinks: Record<string, number> = {};
      Object.keys(supplyLinks).forEach(id => {
        const supply = supplies.find(s => s.id === id);
        if (supply?.category?.toLowerCase() === 'suelas') {
          transformedLinks[id] = 1;
        } else {
          const rawValue = supplyLinks[id] || '';
          const numericValue = rawValue === '' ? 0 : parseFloat(rawValue);
          transformedLinks[id] = numericValue / 12;
        }
      });

      await onSave(formData, selectedImageFile || undefined, transformedLinks);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Producto</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Modifica la información del producto</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          {/* Nombre del Producto (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Producto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
              placeholder="Nombre del producto"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Edita el nombre tal como desees mostrar el producto</p>
          </div>

          {/* Estilo y Categoría en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estilo <span className="text-red-600">*</span>
              </label>
              <select
                name="style_name"
                value={formData.style_name}
                onChange={handleInputChange}
                disabled={!formData.brand_name}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">{formData.brand_name ? 'Seleccionar estilo' : 'Elige marca'}</option>
                {styles.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría <span className="text-red-600">*</span>
              </label>
              <select
                name="category_name"
                value={formData.category_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marca <span className="text-red-600">*</span>
            </label>
            <select
              name="brand_name"
              value={formData.brand_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar marca</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
              placeholder="Negro"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
              placeholder="Aquí describe un poco sobre el producto, materiales, características especiales, etc."
            />
          </div>

          {/* Upload de Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagen del Producto
            </label>
            <div className="flex gap-4 mb-3">
              {/* Preview */}
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="text-gray-400 dark:text-gray-600" size={32} />
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
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/20'
                      : 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/10'
                  }`}
                >
                  <div className="text-center pointer-events-none">
                    <Upload className={`mx-auto mb-1 ${isDragging ? 'text-blue-600' : 'text-gray-400 dark:text-gray-600'}`} size={24} />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-400">Haz clic o arrastra</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-slate-800 pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={useImageUrl}
                  onChange={(e) => setUseImageUrl(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usar enlace de imagen</span>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pega el link de una imagen de internet</p>
                </div>
              )}
            </div>
          </div>

          {/* Insumos Requeridos */}
          <div className="border-t dark:border-slate-800 pt-5">
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
              Insumos Requeridos <span className="opacity-70 normal-case tracking-normal text-xs font-semibold ml-1">(Cantidades por docena — Opcional)</span>
            </label>
            {Object.keys(suppliesByCategory).length === 0 ? (
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">No hay insumos disponibles.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(suppliesByCategory).map(([cat, catSupplies]) => (
                  <div key={cat} className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{cat}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catSupplies.map(supply => {
                        const isSelected = supply.id in supplyLinks;
                        const isSuela = supply.category?.toLowerCase() === 'suelas';
                        return (
                          <div key={supply.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSupplyLinks(prev => {
                                  const next = { ...prev };
                                  if (e.target.checked) next[supply.id] = '';
                                  else delete next[supply.id];
                                  return next;
                                });
                              }}
                              className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 accent-blue-600 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={supply.name}>{supply.name}</p>
                              {supply.color && <p className="text-[10px] text-gray-500 dark:text-gray-400">{supply.color}</p>}
                            </div>
                            {isSelected && !isSuela && (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="Ej: 1.50"
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                                value={supplyLinks[supply.id] ?? ''}
                                onChange={e => {
                                  setSupplyLinks(prev => ({ ...prev, [supply.id]: e.target.value }));
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado del Producto */}
          <div className="border-t dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Estado del Producto</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">El producto {formData.is_active ? 'estará' : 'no estará'} visible en el catálogo</p>
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
