/**
 * Componente: OrderFormModal.tsx
 * Descripción: Modal para crear nuevos pedidos mayoristas.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Loader2, AlertCircle, Check, Package, Clipboard, Maximize2 } from 'lucide-react';
import { createOrder, getStyles, getClients, getCategories, getProducts, updateOrderDetails, OrderCreateRequest, OrderDetailItemCreateRequest, type OrderDetail } from '../services/ordersApi';
import { resolveImageUrl } from '../services/catalogService';
import ImageViewerModal from './ImageViewerModal';
import SummarySizer from './SummarySizer';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editOrder?: OrderDetail;
  /** Cuando se pasa, el modal muestra SOLO las tallas de ese producto del pedido */
  editProductId?: string;
}

interface Style {
  id: string;
  name: string;
  brand_name: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  style_id: string;
  style_name: string;
  category_id: string;
  category_name: string;
  brand_id: string;
  brand_name: string;
  color?: string;
  image_url?: string;
}

interface OrderLineItem {
  product_id: string;
  product_name: string;
  style_name: string;
  brand_name: string;
  category_name: string;
  color?: string;
  image_url?: string;
  observations?: string;
  items: Array<{ size: string; amount: number }>;
}

interface Client {
  id: string;
  name: string;
  last_name: string;
  email: string;
  business_name?: string;
}

export default function OrderFormModal({ isOpen, onClose, onSuccess, editOrder, editProductId }: OrderFormModalProps) {
  const isEditMode = !!editOrder;
  /** true = editar cantidades de un producto específico del pedido */
  const isSingleProductEdit = isEditMode && !!editProductId;
  /** true = agregar un producto nuevo al pedido existente */
  const isAddProductMode = isEditMode && !editProductId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderLineItem[]>([]);
  // notes removed from requirements
  
  // Nuevos estados para el flujo mejorado
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeAmounts, setSizeAmounts] = useState<Record<string, string>>({});

  // Estados para visor de imagen
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsData, categoriesData, stylesData, productsData] = await Promise.all([
        getClients().catch(err => {
          console.error('Error fetching clients:', err);
          if (err.response?.status === 401) {
            throw new Error('Sesión expirada. Por favor recarga la página e intenta de nuevo.');
          }
          throw err;
        }),
        getCategories().catch(err => { console.error('Error fetching categories:', err); throw err; }),
        getStyles().catch(err => { console.error('Error fetching styles:', err); throw err; }),
        getProducts().catch(err => { console.error('Error fetching products:', err); throw err; }),
      ]);
      setClients(clientsData);
      setCategories(categoriesData);
      setStyles(stylesData);
      setProducts(productsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar datos';
      setError('Error cargando datos: ' + message);
      console.error('LoadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setError(null);
      setSuccess(false);
      if (editOrder) {
        setSelectedClient(editOrder.customer_id);
        const preloaded: OrderLineItem[] = [];
        const seen = new Map<string, number>();
        editOrder.details.forEach((d) => {
          const idx = seen.get(d.product_id);
          if (idx !== undefined) {
             const existingIdx = preloaded.findIndex(p => p.product_id === d.product_id);
              if (preloaded[existingIdx] && preloaded[existingIdx].items) {
                preloaded[existingIdx].items.push({ size: d.size, amount: d.amount });
              }
          } else {
            preloaded.push({
              product_id: d.product_id,
              product_name: d.product_name ?? '',
              style_name: d.style_name ?? '',
              brand_name: d.brand_name ?? '',
              category_name: d.category_name ?? '',
              color: d.colour ?? '',
              image_url: d.image_url ?? '',
              observations: (d as any).observations ?? '',
              items: [{ size: d.size, amount: d.amount }],
            });
            seen.set(d.product_id, preloaded.length - 1);
          }
        });
        setItems(preloaded);
      } else {
        setSelectedClient('');
        setItems([]);
      }
    }
  }, [isOpen, editOrder, loadData]);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      if (category?.name === 'Infantil') {
        setAvailableSizes(Array.from({ length: 12 }, (_, i) => String(21 + i)));
      } else {
        setAvailableSizes(Array.from({ length: 11 }, (_, i) => String(33 + i)));
      }
      setSizeAmounts({});
    } else {
      setAvailableSizes([]);
      setSizeAmounts({});
    }
  }, [selectedCategory, categories]);

  // Resetear marca, estilo, producto cuando cambia categor├¡a
  useEffect(() => {
    if (selectedCategory) {
      setSelectedBrand('');
      setSelectedStyle('');
      setSelectedProduct('');
      setSizeAmounts({});
    }
  }, [selectedCategory]);

  // Resetear estilo, producto cuando cambia marca
  useEffect(() => {
    if (selectedBrand) {
      setSelectedStyle('');
      setSelectedProduct('');
      setSizeAmounts({});
    }
  }, [selectedBrand]);

  // Resetear producto cuando cambia estilo
  useEffect(() => {
    if (selectedStyle) {
      setSelectedProduct('');
      setSizeAmounts({});
      setActivePreset(null);
    }
  }, [selectedStyle]);

  const applyRelativeCurve = (curve: Record<string, number>, startSize: string, presetId: string) => {
    const newAmounts: Record<string, string> = {};
    const startIndex = availableSizes.indexOf(startSize);
    if (startIndex === -1) return;
    
    availableSizes.forEach((size, idx) => {
      const offset = idx - startIndex + 1;
      newAmounts[size] = curve[String(offset)] ? String(curve[String(offset)]) : '0';
    });
    setSizeAmounts(newAmounts);
    setActivePreset(presetId);
  };

  const applyFixedX = (amount: number, range: string[], presetId: string) => {
    const newAmounts: Record<string, string> = {};
    availableSizes.forEach(size => {
      newAmounts[size] = range.includes(size) ? String(amount) : '0';
    });
    setSizeAmounts(newAmounts);
    setActivePreset(presetId);
  };

  const applySpecificCurve = (curve: Record<string, number>, presetId: string) => {
    const newAmounts: Record<string, string> = {};
    availableSizes.forEach(size => {
      newAmounts[size] = String(curve[size] || '0');
    });
    setSizeAmounts(newAmounts);
    setActivePreset(presetId);
  };

  const PRESETS_CONFIG = {
    COMERCIAL_PATTERN: { '1': 1, '2': 2, '3': 3, '4': 3, '5': 2, '6': 1 }
  };

  const handleUpdateSummaryItemSizes = (idx: number, newSizes: Array<{ size: string; amount: number }>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, items: newSizes } : it));
  };

  const handleAddItem = () => {
    if (!selectedCategory || !selectedBrand || !selectedStyle || !selectedProduct) { 
      setError('Por favor selecciona categoría, marca, estilo y producto'); 
      return; 
    }
    const itemsWithAmount = Object.entries(sizeAmounts).filter(([, amount]) => amount && parseInt(amount as string) > 0);
    if (itemsWithAmount.length === 0) { 
      setError('Por favor ingresa cantidad para al menos una talla'); 
      return; 
    }
    
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) { 
      setError('Producto no encontrado'); 
      return; 
    }
    
    const newItem: OrderLineItem = {
      product_id: product.id,
      product_name: product.name,
      style_name: product.style_name,
      brand_name: product.brand_name,
      category_name: product.category_name,
      color: product.color,
      image_url: product.image_url,
      observations: '',
      items: itemsWithAmount.map(([size, amount]) => ({ size, amount: parseInt(amount as string) })),
    };
    setItems([...items, newItem]);
    setSelectedBrand('');
    setSelectedStyle('');
    setSelectedProduct('');
    setSizeAmounts({});
    setError(null);
  };

  const handleRemoveItem = (index: number) => { setItems(items.filter((_, i) => i !== index)); };


  const handleSizeAmountChange = (size: string, value: string) => { setSizeAmounts({ ...sizeAmounts, [size]: value }); };

  // Funciones helper para filtrar datos
  const getAvailableBrands = () => {
    if (!selectedCategory) return [];
    // Obtener productos de la categor├¡a seleccionada
    const categoryProducts = products.filter(p => p.category_id === selectedCategory);
    // Obtener marcas ├║nicas
    const uniqueBrands = Array.from(new Set(categoryProducts.map(p => p.brand_name)));
    return uniqueBrands;
  };

  const getAvailableStyles = () => {
    if (!selectedBrand) return [];
    // Obtener estilos que pertenezcan a la categor├¡a Y marca seleccionadas
    const filteredProducts = products.filter(
      p => p.category_id === selectedCategory && p.brand_name === selectedBrand
    );
    // Obtener estilos ├║nicos para esa marca
    const uniqueStyleIds = Array.from(new Set(filteredProducts.map(p => p.style_id)));
    return uniqueStyleIds
      .map(id => styles.find(s => s.id === id && s.brand_name === selectedBrand))
      .filter((s): s is Style => s !== undefined);
  };

  const getAvailableProducts = () => {
    if (!selectedStyle) return [];
    // Obtener todos los productos que coincidan con estilo + categor├¡a (sin filtrar por marca en este punto)
    return products.filter(
      p => p.style_id === selectedStyle && p.category_id === selectedCategory
    );
  };

  const handleSubmit = async () => {
    if (!isEditMode && !selectedClient) { setError('Por favor selecciona un cliente'); return; }
    if (items.length === 0) { setError('Por favor agrega al menos un producto'); return; }
    try {
      setLoading(true);
      setError(null);
      const details: OrderDetailItemCreateRequest[] = [];
      let totalPairs = 0;
      items.forEach((item) => { 
        item.items.forEach(({ size, amount }) => { 
          if (amount > 0) { 
            details.push({ 
              product_id: item.product_id, 
              size, 
              amount,
              colour: item.color || undefined,
              observations: item.observations || undefined
            }); 
            totalPairs += amount; 
          } 
        }); 
      });
      if (details.length === 0) { setError('Debes ingresar al menos un par en el pedido'); setLoading(false); return; }
      if (isEditMode) {
        await updateOrderDetails(editOrder!.id, { details });
      } else {
        const orderData: OrderCreateRequest = { customer_id: selectedClient, total_pairs: totalPairs, details };
        await createOrder(orderData);
      }
      setSuccess(true);
      setTimeout(() => { setSelectedClient(''); setItems([]); onClose(); onSuccess?.(); }, 1500);
    } catch (err) { setError('Error ' + (isEditMode ? 'editando' : 'creando') + ' la orden: ' + (err instanceof Error ? err.message : 'Desconocido')); } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const totalPairs = items.reduce((sum, item) => sum + item.items.reduce((s, i) => s + i.amount, 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800 transition-all animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-between items-start rounded-t-2xl z-10">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 mt-0.5"><Clipboard className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                {isSingleProductEdit ? 'Editar Producto' : isAddProductMode ? 'Agregar Producto al Pedido' : isEditMode ? 'Editar Pedido' : 'Crear Nuevo Pedido Mayorista'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                {isSingleProductEdit ? 'Ajusta las cantidades por talla del producto seleccionado' : isAddProductMode ? 'Selecciona el nuevo producto y sus cantidades' : isEditMode ? 'Modifica productos y cantidades del pedido' : 'Selecciona categoría, estilo, tallas y cantidades'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all flex-shrink-0 ml-4 mt-0.5"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {success ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center transition-colors">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">{isEditMode ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente'}</h3>
              <p className="text-green-700 dark:text-green-300 mt-2">{isEditMode ? 'Los cambios han sido guardados.' : 'La orden ha sido registrada en el sistema.'}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" /><p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p></div>}
              
              {/* Sección 1: Cliente — solo al crear pedido nuevo */}
              {!isEditMode && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-1 transition-all">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Cliente del Pedido <span className="text-red-600">*</span></label>
                {loading && !clients.length ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                ) : (
                  <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-bold transition-all shadow-sm">
                    <option value="">Seleccionar cliente mayorista...</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name} {client.last_name} {client.business_name ? `(${client.business_name})` : ''}</option>)}
                  </select>
                )}
              </div>
              )}

              {/* Sección 2: Agregar Producto — oculta en modo edición de producto específico */}
              {!isSingleProductEdit && (
              <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-900/40 space-y-6 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Agregar Nuevo Producto</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Categoría</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm transition-all">
                      <option value="">Categoría</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Marca</label>
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} disabled={!selectedCategory} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm disabled:opacity-50 transition-all">
                      <option value="">Marca</option>
                      {getAvailableBrands().map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Estilo</label>
                    <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} disabled={!selectedBrand} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm disabled:opacity-50 transition-all">
                      <option value="">Estilo</option>
                      {getAvailableStyles().map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Grid de Selecci├│n Visual de Productos/Colores */}
                {selectedStyle && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-widest">Selecciona Color / Variante <span className="text-red-600">*</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getAvailableProducts().map((prod) => (
                        <div 
                          key={prod.id}
                          onClick={() => setSelectedProduct(prod.id)}
                          className={`group cursor-pointer rounded-2xl p-2 border-2 transition-all duration-300 relative ${
                            selectedProduct === prod.id 
                              ? 'bg-white dark:bg-slate-800 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]' 
                              : 'bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-gray-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Bot├│n Zoom */}
                          {prod.image_url && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setViewingImage(resolveImageUrl(prod.image_url) ?? null);
                                 setViewingProductName(prod.name);
                               }}
                               className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                             >
                               <Maximize2 className="w-3.5 h-3.5" />
                             </button>
                          )}
                          
                          <div className="aspect-square bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-3 shadow-inner">
                            {prod.image_url ? (
                              <img src={resolveImageUrl(prod.image_url)} alt={prod.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Package className="w-8 h-8 opacity-20" /></div>
                            )}
                          </div>
                          <div className="px-1 text-center">
                            <p className={`text-xs font-black truncate ${selectedProduct === prod.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {prod.color || 'Unico'}
                            </p>
                          </div>
                          
                          {/* Indicator Check */}
                          {selectedProduct === prod.id && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transform animate-in zoom-in duration-300">
                              <Check className="w-3 h-3 font-bold" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizing Section */}
                {selectedProduct && availableSizes.length > 0 && (
                  <div className="space-y-5 animate-in zoom-in-95 duration-300">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="block text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                          <Package className="w-3.5 h-3.5" />
                          Numeraciones Rápidas
                        </label>
                        <button 
                          onClick={() => { setSizeAmounts({}); setActivePreset(null); }}
                          className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 border border-gray-200 dark:border-slate-700"
                        >
                          Limpiar Todo
                        </button>
                      </div>
                      
                      {/* Botones de Numeración Rápida con Colores */}
                      <div className="flex flex-wrap gap-2.5 p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all">
                        {(() => {
                          const cat = categories.find(c => c.id === selectedCategory)?.name;
                          const damaRange = ['33', '34', '35', '36', '37', '38'];
                          const cabFullRange = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];
                          
                          const colors = [
                            'bg-orange-600 shadow-orange-500/30', // Comercial
                            'bg-blue-600 shadow-blue-500/30',   // 2x
                            'bg-emerald-600 shadow-emerald-500/30', // 3x
                            'bg-purple-600 shadow-purple-500/30', // 4x
                            'bg-rose-600 shadow-rose-500/30',   // 5x
                            'bg-amber-600 shadow-amber-500/30', // Comercial Grande
                            'bg-indigo-600 shadow-indigo-500/30' // Curva
                          ];

                          const getBtnClass = (id: string, colorIdx: number) => {
                            const active = activePreset === id;
                            const safeColor = colors[colorIdx % colors.length];
                            return `px-3 py-2 rounded-xl text-[10px] uppercase transition-all shadow-sm ${safeColor} text-white ${
                              active ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-600 font-extrabold scale-[1.05] z-10' : 'font-bold opacity-80 hover:opacity-100 hover:scale-[1.02]'
                            }`;
                          };

                          if (cat === 'Dama') {
                            return (
                              <>
                                <button onClick={() => applyRelativeCurve(PRESETS_CONFIG.COMERCIAL_PATTERN, '33', 'com-dama')} className={getBtnClass('com-dama', 0)}>Comercial</button>
                                {[2, 3, 4, 5].map((num, i) => (
                                  <button key={num} onClick={() => applyFixedX(num, damaRange, `fixed-${num}-dama`)} className={getBtnClass(`fixed-${num}-dama`, i + 1)}>{num} x Talla</button>
                                ))}
                              </>
                            );
                          }

                          if (cat === 'Caballero') {
                            return (
                              <>
                                <button onClick={() => applyRelativeCurve(PRESETS_CONFIG.COMERCIAL_PATTERN, '33', 'com-cab-peq')} className={getBtnClass('com-cab-peq', 0)}>Comercial (33-38)</button>
                                <button onClick={() => applySpecificCurve({'37':1, '38':2, '39':3, '40':3, '41':2, '42':1}, 'com-cab-grande')} className={getBtnClass('com-cab-grande', 5)}>Comercial Grande (37-42)</button>
                                <button onClick={() => {
                                  const curve: Record<string, number> = {};
                                  cabFullRange.forEach(s => curve[s] = (s === '38' || s === '39') ? 2 : 1);
                                  applySpecificCurve(curve, 'curva-cab');
                                }} className={getBtnClass('curva-cab', 6)}>Curva (33-42)</button>
                                {[2, 3, 4, 5].map((num, i) => (
                                  <button key={num} onClick={() => applyFixedX(num, cabFullRange, `fixed-${num}-cab`)} className={getBtnClass(`fixed-${num}-cab`, i + 1)}>{num} x Talla (33-42)</button>
                                ))}
                              </>
                            );
                          }
                          if (cat === 'Infantil') {
                            const infSmall = ['21', '22', '23', '24', '25', '26'];
                            const infLarge = ['27', '28', '29', '30', '31', '32'];
                            const infFull = [...infSmall, ...infLarge];
                            
                            return (
                              <div className="flex flex-col gap-4 w-full">
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase ml-1">Rangos Específicos</p>
                                  <div className="flex flex-wrap gap-2">
                                    {[2, 3, 4, 5, 6].map((num, i) => (
                                      <button key={`s-${num}`} onClick={() => applyFixedX(num, infSmall, `fixed-${num}-inf-s`)} className={getBtnClass(`fixed-${num}-inf-s`, i)}>{num} x Talla (21-26)</button>
                                    ))}
                                    {[2, 3, 4, 5, 6].map((num, i) => (
                                      <button key={`l-${num}`} onClick={() => applyFixedX(num, infLarge, `fixed-${num}-inf-l`)} className={getBtnClass(`fixed-${num}-inf-l`, i + 1)}>{num} x Talla (27-32)</button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase ml-1">Curvas Completas (21-32)</p>
                                  <div className="flex flex-wrap gap-2">
                                    <button onClick={() => applyFixedX(1, infFull, 'curve-1-inf')} className={getBtnClass('curve-1-inf', 2)}>Curva Sencilla (1xT)</button>
                                    <button onClick={() => applyFixedX(2, infFull, 'curve-2-inf')} className={getBtnClass('curve-2-inf', 3)}>Curva Doble (2xT)</button>
                                    <button onClick={() => applyFixedX(3, infFull, 'curve-3-inf')} className={getBtnClass('curve-3-inf', 4)}>Curva Triple (3xT)</button>
                                    <button onClick={() => applyFixedX(4, infFull, 'curve-4-inf')} className={getBtnClass('curve-4-inf', 5)}>Curva Cuádruple (4xT)</button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase">Numeraciones Rápidas:</span> Elige un patrón para carga masiva y ajusta manualmente si es necesario.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 bg-gray-50/50 dark:bg-slate-800/80 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-inner">
                      {availableSizes.map((size) => (
                        <div key={size} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase text-center">Talla {size}</label>
                          <input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            value={sizeAmounts[size] || ''} 
                            onChange={(e) => handleSizeAmountChange(size, e.target.value)} 
                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm ${
                              (parseInt(sizeAmounts[size] || '0') > 0)
                                ? 'bg-white dark:bg-slate-700 border-2 border-orange-500 text-orange-600 dark:text-orange-400 scale-105 z-10' 
                                : 'bg-white dark:bg-slate-800 border border-transparent text-gray-900 dark:text-white'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <button onClick={handleAddItem} className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all font-black text-base flex items-center justify-center gap-3">
                      <Plus className="w-6 h-6" /> 
                      Añadir a la lista del Pedido
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Sección 3: Resumen del Pedido */}
              {/* isSingleProductEdit: solo ese producto. isAddProductMode: sin resumen. creación: todos. */}
              {!isAddProductMode && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clipboard className="w-4 h-4 text-gray-400" />
                    {isSingleProductEdit ? 'Editar Cantidades' : 'Resumen de Productos'}
                    {!isSingleProductEdit && items.length > 0 && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] rounded-full">{items.length} {items.length === 1 ? 'modelo' : 'modelos'}</span>}
                  </label>
                </div>
                
                {(() => {
                  const itemsToDisplay = isSingleProductEdit
                    ? items.filter(it => it.product_id === editProductId)
                    : items;
                  return itemsToDisplay.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center transition-colors">
                      <Package className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">{isSingleProductEdit ? 'Producto no encontrado en el pedido' : 'No has añadido productos todavía'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {itemsToDisplay.map((item) => {
                        const idx = items.findIndex(it => it.product_id === item.product_id);
                        return (<div key={item.product_id} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex gap-4 p-4 border-b border-gray-50 dark:border-slate-800">
                          <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-slate-800 flex-shrink-0 cursor-pointer overflow-hidden border border-gray-100 dark:border-slate-700 group relative" onClick={() => { const url = resolveImageUrl(item.image_url); if (url != null) { setViewingImage(url); setViewingProductName(item.product_name); } }}>
                            {resolveImageUrl(item.image_url) ? (
                              <><img src={resolveImageUrl(item.image_url)} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /><div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="text-white w-3 h-3" /></div></>
                            ) : <Package className="w-6 h-6 text-gray-300 mx-auto my-auto" />}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-gray-900 dark:text-white truncate">{item.product_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{item.style_name}</span>
                                  <span className="text-[9px] font-bold text-gray-400">ÔÇó {item.color || 'Sin color'}</span>
                                </div>
                              </div>
                              <button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 space-y-3">
                          <div className="pt-2">
                             <SummarySizer 
                               categoryName={item.category_name} 
                               initialItems={item.items} 
                               onChange={(newItems) => handleUpdateSummaryItemSizes(idx, newItems)} 
                             />
                          </div>
                          
                          {/* Observations field per item */}
                          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                             <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 tracking-widest">Observación para este modelo:</label>
                             <textarea
                               value={item.observations || ''}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setItems(prev => prev.map((it, i) => i === idx ? { ...it, observations: val } : it));
                               }}
                               className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-[11px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                               placeholder="Ej: Cordón largo, acabado mate..."
                               rows={1}
                             />
                          </div>
                        </div>
                        </div>);
                      })}
                      {!isSingleProductEdit && (
                      <div className="bg-blue-600 px-6 py-4 rounded-2xl shadow-xl shadow-blue-500/20">
                        <p className="text-sm text-blue-50 font-bold flex items-center justify-between">Total acumulado en el pedido: <strong className="text-2xl font-black">{totalPairs} pares</strong></p>
                      </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              )}

              {/* Notes removed per user request */}
            </div>
          )}
        </div>
        {!success && <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-end gap-3 rounded-b-2xl z-10 transition-colors"><button onClick={onClose} disabled={loading} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold disabled:opacity-50">Cancelar</button><button onClick={handleSubmit} disabled={loading || items.length === 0 || (!isEditMode && !selectedClient)} className={`px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all font-bold flex items-center gap-2 disabled:opacity-50`}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isEditMode ? 'Guardando...' : 'Creando...'}</> : <><Check className="w-4 h-4" />{isEditMode ? 'Guardar Cambios' : 'Confirmar Pedido'}</>}</button></div>}
      </div>
      
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
