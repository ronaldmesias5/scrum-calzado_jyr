import { useState, useRef, useEffect } from 'react';
import { X, Upload, DollarSign, Plus, Search } from 'lucide-react';
import { Product, listBrands, listCategories, listStyles, Brand, Category, Style } from '../services/catalogService';
import { listSupplies, Supply, checkProductSupplies } from '../services/suppliesService';
import Modal from '@/components/ui/Modal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const resolveImg = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    return `${API_BASE}/api/v1/uploads/${filename}`;
  }
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
  const [addModalCategory, setAddModalCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    task_prices: { corte: 0, guarnicion: 0, soladura: 0, emplantillado: 0 },
  });

  // Cargar marcas, categorías e insumos
  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          listBrands(),
          listCategories(),
          listSupplies(undefined, 1, 100),
        ]);
        if (results[0].status === 'fulfilled') setBrands(results[0].value);
        if (results[1].status === 'fulfilled') setCategories(results[1].value);
        if (results[2].status === 'fulfilled') setSupplies(results[2].value.items);
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
        task_prices: {
          corte: product.task_prices?.corte || 0,
          guarnicion: product.task_prices?.guarnicion || 0,
          soladura: product.task_prices?.soladura || 0,
          emplantillado: product.task_prices?.emplantillado || 0,
        },
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Producto"
      size="xl"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col h-full">
        <div className="px-6 py-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Modifica la información del producto</p>
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

          {/* Marca + Color en fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
              placeholder="Aquí describe un poco sobre el producto, materiales, características especiales, etc."
            />
            <span className="text-[10px] text-gray-400 text-right block mt-0.5">{formData.description.length}/500</span>
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
              <div>
                {/* Tarjetas de categorías clickeables */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(suppliesByCategory).map(([cat, catSupplies]) => {
                    const linkedCount = catSupplies.filter(s => s.id in supplyLinks).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setAddModalCategory(cat); setSearchQuery(''); }}
                        className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-all group"
                      >
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${linkedCount > 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                          {linkedCount}
                        </span>
                        <Plus size={16} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    );
                  })}
                </div>

                {/* Insumos vinculados agrupados por categoría */}
                {Object.entries(suppliesByCategory).map(([cat, catSupplies]) => {
                  const linked = catSupplies.filter(s => s.id in supplyLinks);
                  if (linked.length === 0) return null;
                  const isSuelaCat = cat.toLowerCase() === 'suelas';
                  return (
                    <div key={cat} className="mb-4 last:mb-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">{cat}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {linked.map(supply => (
                          <div key={supply.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={supply.name}>{supply.name}</p>
                              {supply.color && <p className="text-[10px] text-gray-500 dark:text-gray-400">{supply.color}</p>}
                            </div>
                            {!isSuelaCat ? (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="Ej: 1.50"
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                                value={supplyLinks[supply.id] ?? ''}
                                onChange={e => setSupplyLinks(prev => ({ ...prev, [supply.id]: e.target.value }))}
                              />
                            ) : (
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2">1</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setSupplyLinks(prev => { const n = { ...prev }; delete n[supply.id]; return n; })}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                              title="Quitar insumo"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {Object.values(suppliesByCategory).flat().filter(s => s.id in supplyLinks).length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-4">Selecciona una categoría para agregar insumos</p>
                )}
              </div>
            )}
          </div>

          {/* Mini-modal para agregar insumos por categoría */}
          {addModalCategory && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setAddModalCategory(null)}>
              <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Agregar insumo — {addModalCategory}</h3>
                  <button
                    type="button"
                    onClick={() => setAddModalCategory(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar insumo..."
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {(suppliesByCategory[addModalCategory] || [])
                      .filter(s => !(s.id in supplyLinks))
                      .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.color?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
                      .map(supply => (
                        <button
                          key={supply.id}
                          type="button"
                          onClick={() => {
                            setSupplyLinks(prev => ({ ...prev, [supply.id]: '' }));
                            setAddModalCategory(null);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-sm font-bold text-gray-900 dark:text-white"
                        >
                          {supply.name}
                          {supply.color && <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">· {supply.color}</span>}
                        </button>
                      ))}
                    {(suppliesByCategory[addModalCategory] || []).filter(s => !(s.id in supplyLinks)).length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No hay más insumos disponibles de esta categoría</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Precios por Tarea */}
          <div className="border-t dark:border-slate-800 pt-4">
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
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
              ]).map(t => {
                const val = formData.task_prices[t.key]
                return (
                <div key={t.key} className="space-y-1">
                  <label className={`block text-xs font-bold uppercase tracking-wide ${t.color}`}>{t.label}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={val > 0 ? `$${val.toLocaleString('es-CO')}` : ''}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '')
                      const num = parseInt(cleaned, 10) || 0
                      setFormData(prev => ({
                        ...prev,
                        task_prices: { ...prev.task_prices, [t.key]: num }
                      }))
                    }}
                    placeholder="$0"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-blue-500 rounded-xl outline-none text-sm font-bold transition-all"
                  />
                </div>
              )})}
            </div>
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
    </Modal>
  );
}
