/**
 * Componente: OrderFormModal.tsx
 * Descripción: Modal para crear nuevos pedidos mayoristas.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Loader2, AlertCircle, Check, Package, Clipboard } from 'lucide-react';
import { createOrder, getStyles, getClients, getCategories, getProducts, updateOrderDetails, OrderCreateRequest, OrderDetailItemCreateRequest, type OrderDetail } from '../services/ordersApi';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editOrder?: OrderDetail;
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
}

interface OrderLineItem {
  product_id: string;
  product_name: string;
  style_name: string;
  brand_name: string;
  category_name: string;
  items: Array<{ size: string; amount: number }>;
}

interface Client {
  id: string;
  name: string;
  last_name: string;
  email: string;
  business_name?: string;
}

export default function OrderFormModal({ isOpen, onClose, onSuccess, editOrder }: OrderFormModalProps) {
  const isEditMode = !!editOrder;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  
  // Nuevos estados para el flujo mejorado
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeAmounts, setSizeAmounts] = useState<Record<string, string>>({});

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

  // Resetear marca, estilo, producto cuando cambia categoría
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
    }
  }, [selectedStyle]);

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

  const handleUpdateItemAmount = (itemIdx: number, sizeIdx: number, newAmount: number) => {
    setItems(items.map((item, i) => {
      if (i !== itemIdx) return item;
      return { ...item, items: item.items.map((s, j) => j === sizeIdx ? { ...s, amount: Math.max(0, newAmount) } : s) };
    }));
  };

  const handleSizeAmountChange = (size: string, value: string) => { setSizeAmounts({ ...sizeAmounts, [size]: value }); };

  // Funciones helper para filtrar datos
  const getAvailableBrands = () => {
    if (!selectedCategory) return [];
    // Obtener productos de la categoría seleccionada
    const categoryProducts = products.filter(p => p.category_id === selectedCategory);
    // Obtener marcas únicas
    const uniqueBrands = Array.from(new Set(categoryProducts.map(p => p.brand_name)));
    return uniqueBrands;
  };

  const getAvailableStyles = () => {
    if (!selectedBrand) return [];
    // Obtener estilos que pertenezcan a la categoría Y marca seleccionadas
    const filteredProducts = products.filter(
      p => p.category_id === selectedCategory && p.brand_name === selectedBrand
    );
    // Obtener estilos únicos para esa marca
    const uniqueStyleIds = Array.from(new Set(filteredProducts.map(p => p.style_id)));
    return uniqueStyleIds
      .map(id => styles.find(s => s.id === id && s.brand_name === selectedBrand))
      .filter((s): s is Style => s !== undefined);
  };

  const getAvailableProducts = () => {
    if (!selectedStyle) return [];
    // Obtener todos los productos que coincidan con estilo + categoría (sin filtrar por marca en este punto)
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
      items.forEach((item) => { item.items.forEach(({ size, amount }) => { if (amount > 0) { details.push({ product_id: item.product_id, size, amount }); totalPairs += amount; } }); });
      if (details.length === 0) { setError('Debes ingresar al menos un par en el pedido'); setLoading(false); return; }
      if (isEditMode) {
        await updateOrderDetails(editOrder!.id, { details });
      } else {
        const orderData: OrderCreateRequest = { customer_id: selectedClient, total_pairs: totalPairs, details };
        await createOrder(orderData);
      }
      setSuccess(true);
      setTimeout(() => { setSelectedClient(''); setItems([]); setNotes(''); onClose(); onSuccess?.(); }, 1500);
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isEditMode ? 'Editar Pedido' : 'Crear Nuevo Pedido Mayorista'}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">{isEditMode ? 'Modifica productos y cantidades del pedido' : 'Selecciona categoría, estilo, tallas y cantidades'}</p>
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
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 animate-pulse"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" /><p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p></div>}
              <div><label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Cliente <span className="text-red-600">*</span></label>{loading && !clients.length ? <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div> : <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"><option value="" className="dark:bg-slate-800">Selecciona un cliente mayorista {clients.length > 0 && `(${clients.length})`}</option>{clients.map((client) => <option key={client.id} value={client.id} className="dark:bg-slate-800">{client.name} {client.last_name}</option>)}</select>}</div>
              <div><label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Productos del Pedido <span className="text-red-600">*</span></label>{items.length === 0 ? <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-12 text-center mb-4 transition-colors"><Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4 opacity-50" /><p className="text-gray-500 dark:text-gray-400 font-bold text-sm">No hay productos agregados</p></div> : <div className="space-y-3 mb-4">{items.map((item, idx) => <div key={idx} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-gray-50 dark:bg-slate-800/40 transition-all hover:bg-gray-100 dark:hover:bg-slate-800/60"><div className="flex justify-between items-start mb-4"><div><p className="font-bold text-gray-900 dark:text-white">{item.product_name}</p><p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5">{item.brand_name} • {item.category_name}</p></div><button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"><Trash2 className="w-5 h-5" /></button></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{item.items.map((sizeItem, sIdx) => <div key={sIdx} className="bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 px-3 py-2 rounded-xl flex items-center justify-between"><span className="text-xs font-bold text-gray-500 dark:text-gray-400">Talla {sizeItem.size}:</span><input type="number" min="0" value={sizeItem.amount} onChange={(e) => handleUpdateItemAmount(idx, sIdx, parseInt(e.target.value) || 0)} className="w-12 bg-transparent text-sm font-bold text-gray-900 dark:text-white text-center focus:outline-none" /></div>)}</div></div>)}</div>}
                <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-900/50 space-y-5 transition-all">
                  <h3 className="font-bold text-gray-900 dark:text-blue-400 text-sm flex items-center gap-2"><Plus className="w-4 h-4" />Agregar Producto</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Categoría <span className="text-red-600">*</span></label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 shadow-sm transition-all"><option value="">Selecciona categoría</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Marca <span className="text-red-600">*</span></label><select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} disabled={!selectedCategory} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 shadow-sm disabled:opacity-50 transition-all"><option value="">Selecciona marca</option>{getAvailableBrands().map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Estilo <span className="text-red-600">*</span></label><select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} disabled={!selectedBrand} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 shadow-sm disabled:opacity-50 transition-all"><option value="">Selecciona estilo</option>{getAvailableStyles().map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Producto/Variante <span className="text-red-600">*</span></label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} disabled={!selectedStyle} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 shadow-sm disabled:opacity-50 transition-all"><option value="">Selecciona producto</option>{getAvailableProducts().map((prod) => <option key={prod.id} value={prod.id}>{prod.name}</option>)}</select></div>
                  </div>
                  {selectedProduct && availableSizes.length > 0 && <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Tallas y Cantidades <span className="text-red-600">*</span></label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto bg-gray-50/50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-200 dark:border-slate-700 custom-scrollbar">{availableSizes.map((size) => <div key={size} className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Talla {size}</label><input type="number" min="0" placeholder="0" value={sizeAmounts[size] || ''} onChange={(e) => handleSizeAmountChange(size, e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" /></div>)}</div></div>}
                  <button onClick={handleAddItem} disabled={!selectedProduct} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 font-bold text-sm flex items-center justify-center gap-2 btn-shimmer"><Plus className="w-4 h-4" />Agregar a la lista</button>
                </div>
                {items.length > 0 && <div className="bg-blue-600 dark:bg-blue-600 px-6 py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.01]"><p className="text-sm text-blue-50 font-medium flex items-center justify-between">Total de pares del pedido: <strong className="text-2xl font-black">{totalPairs}</strong></p></div>}
              </div>
              <div><label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Notas Adicionales (Opcional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm dark:text-gray-200 transition-all" placeholder="Ej: Cliente preferencial, empaque especial, fecha de entrega urgente..." /></div>
            </div>
          )}
        </div>
        {!success && <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-end gap-3 rounded-b-2xl z-10 transition-colors"><button onClick={onClose} disabled={loading} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold disabled:opacity-50">Cancelar</button><button onClick={handleSubmit} disabled={loading || items.length === 0 || !selectedClient} className={`px-8 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all font-bold flex items-center gap-2 disabled:opacity-50 btn-pulse`}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isEditMode ? 'Guardando...' : 'Creando...'}</> : <><Check className="w-4 h-4" />{isEditMode ? 'Guardar Cambios' : 'Confirmar Pedido'}</>}</button></div>}
      </div>
    </div>
  );
}
