import { useState, useRef, useEffect } from 'react';
import { X, Upload, Plus, DollarSign } from 'lucide-react';
import { listBrands, listCategories, listStyles, Brand, Category, Style } from '../services/catalogService';
import { listSupplies, Supply } from '../services/suppliesService';

interface TaskPrices {
  corte: number;
  guarnicion: number;
  soladura: number;
  emplantillado: number;
}

interface ProductFormData {
  name: string;
  category_name: string;
  style_name: string;
  brand_name: string;
  color: string;
  stock: number;
  description: string;
  image_url: string;
  is_active: boolean;
  task_prices: TaskPrices;
}

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: ProductFormData, imageFile?: File, supplyLinks?: Record<string, number>) => Promise<void>;
}

export default function ProductCreateModal({ isOpen, onClose, onSave }: ProductCreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [supplyLinks, setSupplyLinks] = useState<Record<string, string>>({});
  const [styleMode, setStyleMode] = useState<'select' | 'new'>('select');
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category_name: '',
    style_name: '',
    brand_name: '',
    color: '',
    stock: 0,
    description: '',
    image_url: '',
    is_active: true,
    task_prices: { corte: 0, guarnicion: 0, soladura: 0, emplantillado: 0 },
  });

  // Cargar marcas y categorías
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

  // Reinicializar cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        category_name: '',
        style_name: '',
        brand_name: '',
        color: '',
        stock: 0,
        description: '',
        image_url: '',
        is_active: true,
        task_prices: { corte: 0, guarnicion: 0, soladura: 0, emplantillado: 0 },
      });
      setImagePreview(null);
      setSelectedImageFile(null);
      setUseImageUrl(false);
      setStyleMode('select');
      setStyles([]);
      setSupplyLinks({});
    }
  }, [isOpen]);

  const suppliesByCategory = supplies.reduce((acc, curr) => {
    const cat = curr.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, Supply[]>);

  // Cargar estilos cuando cambia la marca
  const handleBrandChange = async (brandName: string) => {
    setFormData(prev => ({ ...prev, brand_name: brandName, style_name: '' }));
    setStyleMode('select');
    if (!brandName) {
      setStyles([]);
      return;
    }
    const selectedBrand = brands.find(b => b.name === brandName);
    if (selectedBrand) {
      try {
        const stylesData = await listStyles(selectedBrand.id);
        setStyles(stylesData);
      } catch {
        setStyles([]);
      }
    }
  };

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
      if (!file) return;
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
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_name || !formData.brand_name || !formData.style_name) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    // Validar que haya al menos un insumo seleccionado por cada categoría disponible
    const missingCategories = Object.keys(suppliesByCategory).filter(cat => {
      // Retorna true si NO hay ningún supply.id de esta categoría en supplyLinks
      return !(suppliesByCategory[cat] || []).some(supply => supply.id in supplyLinks);
    });

    if (missingCategories.length > 0) {
      alert(`Por favor, selecciona al menos un insumo para las siguientes categorías: ${missingCategories.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
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
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0 transition-colors">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Crear Producto</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Agrega un nuevo producto al catálogo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 transition-colors">
          {/* Categoría y Marca en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="category_name"
                value={formData.category_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="" className="dark:bg-slate-800">Seleccionar categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} className="dark:bg-slate-800">{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
                Marca <span className="text-red-500">*</span>
              </label>
              <select
                name="brand_name"
                value={formData.brand_name}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="" className="dark:bg-slate-800">Seleccionar marca</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.name} className="dark:bg-slate-800">{brand.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estilo y Nombre en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
                Estilo <span className="text-red-500">*</span>
              </label>

              {styleMode === 'select' ? (
                <div className="flex gap-2">
                  <select
                    name="style_name"
                    value={formData.style_name}
                    onChange={handleInputChange}
                    disabled={!formData.brand_name}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" className="dark:bg-slate-800">
                      {formData.brand_name ? 'Seleccionar estilo' : 'Primero elige marca'}
                    </option>
                    {styles.map(s => (
                      <option key={s.id} value={s.name} className="dark:bg-slate-800">{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setStyleMode('new'); setFormData(prev => ({ ...prev, style_name: '' })); }}
                    className="px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex-shrink-0 shadow-lg shadow-blue-500/20"
                    title="Crear nuevo estilo"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="style_name"
                    value={formData.style_name}
                    onChange={handleInputChange}
                    autoFocus
                    className="flex-1 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-400 dark:border-blue-600 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ej: Superstar, Air Max 90..."
                  />
                  <button
                    type="button"
                    onClick={() => { setStyleMode('select'); setFormData(prev => ({ ...prev, style_name: '' })); }}
                    className="px-3 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex-shrink-0 text-sm font-bold"
                    title="Volver a estilos existentes"
                  >
                    ↩
                  </button>
                </div>
              )}

              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                {styleMode === 'new'
                  ? 'Escribe el nombre del nuevo estilo'
                  : styles.length > 0
                    ? `${styles.length} estilo${styles.length !== 1 ? 's' : ''} · Botón + para crear nuevo`
                    : formData.brand_name
                      ? 'Sin estilos aún · Usa + para crear el primero'
                      : 'Selecciona una marca primero'}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Zapato Caballero Formal"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Negro"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="Describe materiales, características especiales, etc."
            />
          </div>

          {/* Upload de Imagen */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">
              Imagen del Producto
            </label>
            <div className="flex gap-4 mb-3">
              {/* Preview */}
              <div className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-slate-800 overflow-hidden flex-shrink-0 transition-all">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="text-gray-300 dark:text-gray-600" size={28} />
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
                  className={`w-full h-24 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex items-center justify-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/10'
                  }`}
                >
                  <div className="text-center pointer-events-none">
                    <Upload className={`mx-auto mb-1 ${isDragging ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`} size={24} />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Haz clic o arrastra</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 transition-colors">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useImageUrl}
                  onChange={(e) => setUseImageUrl(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 accent-blue-600"
                />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Usar enlace de imagen</span>
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">Pega el link de una imagen de internet</p>
                </div>
              )}
            </div>
          </div>

          {/* Insumos Requeridos */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-5 transition-colors">
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">
              Insumos Requeridos <span className="opacity-70 normal-case tracking-normal text-xs font-semibold ml-1">(Cantidades por docena — Opcional)</span>
            </label>
            {Object.keys(suppliesByCategory).length === 0 ? (
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">No hay insumos disponibles. Puedes crearlos en la sección de Insumos.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(suppliesByCategory).map(([cat, catSupplies]) => (
                  <div key={cat} className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{cat}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catSupplies.map(supply => {
                        const isSelected = supply.id in supplyLinks;
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
                            {isSelected && supply.category?.toLowerCase() !== 'suelas' && (
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

          {/* Precios por Tarea */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-5 transition-colors">
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">
              <span className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-green-500" />
                Precios por Tarea
                <span className="opacity-70 normal-case tracking-normal text-xs font-semibold ml-1">(COP por docena — Opcional)</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'corte' as const, label: 'Corte', color: 'text-amber-600 dark:text-amber-400' },
                { key: 'guarnicion' as const, label: 'Guarnición', color: 'text-indigo-600 dark:text-indigo-400' },
                { key: 'soladura' as const, label: 'Soladura', color: 'text-blue-700 dark:text-blue-400' },
                { key: 'emplantillado' as const, label: 'Emplantillado', color: 'text-emerald-600 dark:text-emerald-400' },
              ]).map(t => (
                <div key={t.key} className="space-y-1">
                  <label className={`block text-xs font-bold uppercase tracking-wide ${t.color}`}>{t.label}</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={formData.task_prices[t.key] || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      task_prices: { ...prev.task_prices, [t.key]: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-blue-500 rounded-xl outline-none text-sm font-bold transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Estado del Producto */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-5 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Estado del Producto</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">El producto {formData.is_active ? 'estará' : 'no estará'} visible en el catálogo</p>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 ${
                  formData.is_active ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20' : 'bg-gray-400 dark:bg-slate-600 hover:bg-gray-500'
                }`}
              >
                {formData.is_active ? '✓ Habilitado' : 'Deshabilitado'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex-shrink-0 transition-colors">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Creando...' : 'Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
