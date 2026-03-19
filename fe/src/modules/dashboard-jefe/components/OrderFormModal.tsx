/**
 * Componente: OrderFormModal.tsx
 * Descripción: Modal para crear nuevos pedidos mayoristas.
 */

import { useState, useEffect } from 'react';
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
            preloaded[idx].items.push({ size: d.size, amount: d.amount });
          } else {
            preloaded.push({
              product_id: d.product_id,
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
  }, [isOpen]);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, categoriesData, stylesData, productsData] = await Promise.all([
        getClients().catch(err => {
          console.error('Error fetching clients:', err);
          // Si es 401, la sesión expiró
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
  };

  const handleAddItem = () => {
    if (!selectedCategory || !selectedBrand || !selectedStyle || !selectedProduct) { 
      setError('Por favor selecciona categoría, marca, estilo y producto'); 
      return; 
    }
    const itemsWithAmount = Object.entries(sizeAmounts).filter(([_, amount]) => amount && parseInt(amount as string) > 0);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-start rounded-t-xl">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5"><Clipboard className="w-5 h-5 text-blue-600" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{isEditMode ? 'Editar Pedido' : 'Crear Nuevo Pedido Mayorista'}</h2>
              <p className="text-sm text-gray-600 mt-1">{isEditMode ? 'Modifica productos y cantidades del pedido' : 'Selecciona categoría, estilo, tallas y cantidades'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 ml-4 mt-0.5"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900">{isEditMode ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente'}</h3>
              <p className="text-green-700 mt-2">{isEditMode ? 'Los cambios han sido guardados.' : 'La orden ha sido registrada en el sistema.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-red-800 text-sm">{error}</p></div>}
              <div><label className="block text-sm font-semibold text-gray-900 mb-3">Cliente <span className="text-red-600">*</span></label>{loading && !clients.length ? <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div> : <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Selecciona un cliente mayorista {clients.length > 0 && `(${clients.length})`}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} {client.last_name}</option>)}</select>}</div>
              <div><label className="block text-sm font-semibold text-gray-900 mb-3">Productos del Pedido <span className="text-red-600">*</span></label>{items.length === 0 ? <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium text-sm">No hay productos agregados</p></div> : <div className="space-y-3 mb-4">{items.map((item, idx) => <div key={idx} className="border rounded-lg p-4 bg-gray-50"><div className="flex justify-between items-start mb-3"><div><p className="font-medium text-gray-900">{item.product_name}</p><p className="text-xs text-gray-600">{item.brand_name} • {item.category_name}</p></div><button onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800 transition"><Trash2 className="w-5 h-5" /></button></div><div className="grid grid-cols-2 gap-2">{item.items.map((sizeItem, sIdx) => <div key={sIdx} className="text-sm"><span className="font-semibold text-gray-900 ml-1">{sizeItem.size}:</span><input type="number" min="0" value={sizeItem.amount} onChange={(e) => handleUpdateItemAmount(idx, sIdx, parseInt(e.target.value) || 0)} className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs font-semibold text-center ml-1" /></div>)}</div></div>)}</div>}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" />Agregar Producto</h3>
                  <div><label className="block text-xs font-medium text-gray-700 mb-2">Categoría <span className="text-red-600">*</span></label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Selecciona categoría</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-2">Marca <span className="text-red-600">*</span></label><select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} disabled={!selectedCategory} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"><option value="">Selecciona marca</option>{getAvailableBrands().map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-2">Estilo <span className="text-red-600">*</span></label><select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} disabled={!selectedBrand} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"><option value="">Selecciona estilo</option>{getAvailableStyles().map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-2">Producto/Variante <span className="text-red-600">*</span></label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} disabled={!selectedStyle} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"><option value="">Selecciona producto</option>{getAvailableProducts().map((prod) => <option key={prod.id} value={prod.id}>{prod.name} {prod.color ? `(${prod.color})` : ''}</option>)}</select></div>
                  {selectedProduct && availableSizes.length > 0 && <div><label className="block text-xs font-medium text-gray-700 mb-2">Tallas y Cantidades <span className="text-red-600">*</span></label><div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-white p-2 rounded border border-gray-200">{availableSizes.map((size) => <div key={size} className="flex items-center gap-2"><label className="text-xs font-medium text-gray-700 w-12">Talla {size}</label><input type="number" min="0" placeholder="Pares" value={sizeAmounts[size] || ''} onChange={(e) => handleSizeAmountChange(size, e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>)}</div></div>}
                  <button onClick={handleAddItem} disabled={!selectedProduct} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Agregar Producto</button>
                </div>
                {items.length > 0 && <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 mt-4"><p className="text-sm text-blue-900">Total de pares: <strong className="text-lg">{totalPairs}</strong></p></div>}
              </div>
              <div><label className="block text-sm font-semibold text-gray-900 mb-2">Notas Adicionales (Opcional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" placeholder="Ej: Cliente preferencial, empaque especial, fecha de entrega urgente..." /></div>
            </div>
          )}
        </div>
        {!success && <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl"><button onClick={onClose} disabled={loading} className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50">Cancelar</button><button onClick={handleSubmit} disabled={loading || items.length === 0 || !selectedClient} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50">{loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isEditMode ? 'Guardando...' : 'Creando...'}</> : <><Check className="w-4 h-4" />{isEditMode ? 'Guardar Cambios' : 'Crear Pedido'}</>}</button></div>}
      </div>
    </div>
  );
}
