/**
 * Componente: OrderFormModal.tsx
 * Descripción: Modal para crear nuevos pedidos mayoristas.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Check, Package, Clipboard, Maximize2, Pencil, X } from 'lucide-react';
import { createOrder, getStyles, getClients, getCategories, getProducts, updateOrderDetails, OrderCreateRequest, OrderDetailItemCreateRequest, type OrderDetail, type OrderDetailItem } from '@/services/ordersApi';
import { createMyOrder } from '@/services/clientApi';
import { resolveImageUrl } from '@/services/catalogService';
import ImageViewerModal from '../molecules/ImageViewerModal';
import SummarySizer from '../molecules/SummarySizer';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editOrder?: OrderDetail;
  /** Cuando se pasa, el modal muestra SOLO las tallas de ese producto del pedido */
  editProductId?: string;
  /** Modo cliente: fija el cliente como el usuario autenticado y oculta el selector de cliente */
  fixedCustomerId?: string | null;
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
  uid: string;
  line_group: number;
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

const COLOR_HEX: Array<[string, string]> = [
  ['negro', '#18181b'],
  ['blanco', '#f4f4f5'],
  ['gris', '#71717a'],
  ['plata', '#9ca3af'],
  ['azul', '#2563eb'],
  ['rojo', '#dc2626'],
  ['verde', '#16a34a'],
  ['amarillo', '#eab308'],
  ['dorado', '#ca8a04'],
  ['rosado', '#ec4899'],
  ['rosa', '#ec4899'],
  ['morado', '#7c3aed'],
  ['violeta', '#8b5cf6'],
  ['naranja', '#ea580c'],
  ['marron', '#92400e'],
  ['café', '#92400e'],
  ['cafe', '#92400e'],
  ['beige', '#d6c3a1'],
];

const getColorHex = (color: string): string => {
  const normalized = color.toLowerCase();
  for (const [name, hex] of COLOR_HEX) {
    if (normalized.includes(name)) return hex;
  }
  return '#9ca3af';
};

export default function OrderFormModal({ isOpen, onClose, onSuccess, editOrder, editProductId, fixedCustomerId }: OrderFormModalProps) {
  const isEditMode = !!editOrder;
  /** true = editar cantidades de un producto específico del pedido */
  const isSingleProductEdit = isEditMode && !!editProductId;
  /** true = agregar un producto nuevo al pedido existente */
  const isAddProductMode = isEditMode && !editProductId;
  /** true = modo cliente: el cliente es el usuario autenticado */
  const isSelfServiceMode = !!fixedCustomerId && !isEditMode;
  
  // Extraer product_id y line_group de la clave compuesta "product_id::line_group"
  const editProductIdReal = editProductId?.includes('::') ? editProductId.split('::')[0] : editProductId;
  const editLineGroup = editProductId?.includes('::') ? parseInt(editProductId.split('::')[1] || '0') : undefined;
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [hasAddedProducts, setHasAddedProducts] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState('');
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
  // Ítem del panel derecho que se está editando inline
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editSnapshot, setEditSnapshot] = useState<{ uid: string; items: Array<{ size: string; amount: number }> } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsData, categoriesData, stylesData, productsData] = await Promise.all([
        isSelfServiceMode
          ? Promise.resolve<Client[]>([])
          : getClients().catch(err => {
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
      showToast('Error cargando datos: ' + message, 'error');
      console.error('LoadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [isSelfServiceMode]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (isSelfServiceMode && fixedCustomerId) {
        setSelectedClient(fixedCustomerId);
      }
      if (editOrder) {
        setSelectedClient(editOrder.customer_id);
        const preloaded: OrderLineItem[] = [];
        const seen = new Map<string, number>();
        editOrder.details.forEach((d: OrderDetailItem) => {
          const group = d.line_group ?? 0;
          const compositeKey = `${d.product_id}_${group}`;
          const idx = seen.get(compositeKey);
          if (idx !== undefined && preloaded[idx]) {
            preloaded[idx].items.push({ size: d.size, amount: d.amount });
          } else {
            preloaded.push({
              uid: d.id ?? `${d.product_id}_${d.size}_${Math.random().toString(36).substr(2, 9)}`,
              line_group: group,
              product_id: d.product_id,
              product_name: d.product_name ?? '',
              style_name: d.style_name ?? '',
              brand_name: d.brand_name ?? '',
              category_name: d.category_name ?? '',
              color: d.colour ?? '',
              image_url: d.image_url ?? '',
              observations: d.observations ?? '',
              items: [{ size: d.size, amount: d.amount }],
            });
            seen.set(compositeKey, preloaded.length - 1);
          }
        });
        setItems(preloaded);
      } else {
        setSelectedClient('');
        setItems([]);
      }
      setEditingUid(null);
      setEditSnapshot(null);
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

  // Resetear selección de producto cuando cambia el cliente
  useEffect(() => {
    if (!isEditMode && selectedClient) {
      setSelectedCategory('');
      setSelectedBrand('');
      setSelectedStyle('');
      setSelectedProduct('');
      setSizeAmounts({});
      setActivePreset(null);
    }
  }, [selectedClient]);

  // Pre-fill delivery date when editing
  useEffect(() => {
    if (editOrder?.delivery_date) {
      try {
        const d = new Date(editOrder.delivery_date);
        setDeliveryDate(d.toISOString().split('T')[0] ?? '');
      } catch {
        setDeliveryDate('');
      }
    }
  }, [editOrder]);

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

  // Construye el array de details (sin tallas con cantidad 0) desde la lista de items
  const buildDetails = (list: OrderLineItem[]): OrderDetailItemCreateRequest[] => {
    const details: OrderDetailItemCreateRequest[] = [];
    list.forEach((item) => {
      item.items.forEach(({ size, amount }) => {
        if (amount > 0) {
          details.push({
            product_id: item.product_id,
            size,
            amount,
            colour: item.color || undefined,
            observations: item.observations || undefined,
            line_group: item.line_group,
          });
        }
      });
    });
    return details;
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !selectedBrand || !selectedStyle || !selectedProduct) {
      showToast('Por favor selecciona categoría, marca, estilo y producto', 'error');
      return;
    }
    const itemsWithAmount = Object.entries(sizeAmounts).filter(([, amount]) => amount && parseInt(amount as string) > 0);
    if (itemsWithAmount.length === 0) {
      showToast('Por favor ingresa cantidad para al menos una talla', 'error');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      showToast('Producto no encontrado', 'error');
      return;
    }
    
    const maxLineGroup = items.reduce((max, it) => Math.max(max, it.line_group), 0);
    const newLineGroup = maxLineGroup + 1;

    const newItem: OrderLineItem = {
      uid: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      line_group: newLineGroup,
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

    const updatedItems = [...items, newItem];
    const details = buildDetails(updatedItems);

    if (isEditMode && editOrder) {
      setAddLoading(true);
      try {
        await updateOrderDetails(editOrder.id, { details });
        setItems(updatedItems);
        setHasAddedProducts(true);
        showToast('Producto añadido a la lista. Puedes seguir agregando más productos');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        showToast('Error al añadir producto: ' + msg, 'error');
      } finally {
        setAddLoading(false);
      }
    } else {
      setItems(updatedItems);
      showToast('Producto añadido a la lista. Puedes seguir agregando más productos');
    }

    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStyle('');
    setSelectedProduct('');
    setSizeAmounts({});
    setActivePreset(null);
  };

  const handleRemoveItem = async (uid: string) => {
    const removed = items.find((it) => it.uid === uid);
    const updatedItems = items.filter((it) => it.uid !== uid);
    setItems(updatedItems);
    if (editingUid === uid) {
      setEditingUid(null);
      setEditSnapshot(null);
    }
    if (isEditMode && editOrder && removed) {
      try {
        const details = buildDetails(updatedItems);
        await updateOrderDetails(editOrder.id, { details });
        setHasAddedProducts(true);
        showToast('Producto eliminado del pedido');
      } catch (err) {
        setItems(items);
        const msg = err instanceof Error ? err.message : 'Desconocido';
        showToast('Error al eliminar producto: ' + msg, 'error');
      }
    }
  };

  const handleEditItem = (uid: string) => {
    const item = items.find((it) => it.uid === uid);
    if (!item) return;
    setEditSnapshot({ uid, items: item.items });
    setEditingUid(uid);
  };

  const handleCancelEdit = () => {
    if (editSnapshot) {
      setItems((prev) => prev.map((it) => (it.uid === editSnapshot.uid ? { ...it, items: editSnapshot.items } : it)));
    }
    setEditingUid(null);
    setEditSnapshot(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUid) return;
    if (isEditMode && editOrder) {
      setEditSaving(true);
      try {
        const details = buildDetails(items);
        await updateOrderDetails(editOrder.id, { details });
        setHasAddedProducts(true);
        showToast('Cambios guardados correctamente');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Desconocido';
        showToast('Error al guardar cambios: ' + msg, 'error');
        setEditSaving(false);
        return;
      }
      setEditSaving(false);
    }
    setEditingUid(null);
    setEditSnapshot(null);
  };


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
    if (!isEditMode && !selectedClient) { showToast('Por favor selecciona un cliente', 'error'); return; }
    if (items.length === 0) { showToast('Por favor agrega al menos un producto', 'error'); return; }
    try {
      setLoading(true);
      const details = buildDetails(items);
      const totalPairs = items.reduce((sum, item) => sum + item.items.reduce((s, i) => s + (i.amount > 0 ? i.amount : 0), 0), 0);
      if (details.length === 0) { showToast('Debes ingresar al menos un par en el pedido', 'error'); setLoading(false); return; }
      if (isEditMode) {
        await updateOrderDetails(editOrder!.id, { delivery_date: deliveryDate || null, details });
      } else if (isSelfServiceMode) {
        const orderData: OrderCreateRequest = { customer_id: selectedClient, total_pairs: totalPairs, delivery_date: deliveryDate || null, details };
        await createMyOrder(orderData);
      } else {
        const orderData: OrderCreateRequest = { customer_id: selectedClient, total_pairs: totalPairs, delivery_date: deliveryDate || null, details };
        await createOrder(orderData);
      }
      showToast('Operación exitosa');
      setTimeout(() => { setSelectedClient(''); setItems([]); onClose(); onSuccess?.(); }, 1500);
    } catch (err) { showToast('Error ' + (isEditMode ? 'editando' : 'creando') + ' la orden: ' + (err instanceof Error ? err.message : 'Desconocido'), 'error'); } finally { setLoading(false); }
  };

  const handleClose = useCallback(() => {
    if (isAddProductMode && hasAddedProducts) {
      onSuccess?.();
    }
    onClose();
  }, [isAddProductMode, hasAddedProducts, onSuccess, onClose]);

  if (!isOpen) return null;
  const totalPairs = items.reduce((sum, item) => sum + item.items.reduce((s, i) => s + i.amount, 0), 0);

  const modalTitle = isSingleProductEdit ? 'Editar Producto' : isAddProductMode ? 'Agregar Producto al Pedido' : isEditMode ? 'Editar Pedido' : isSelfServiceMode ? 'Realizar Pedido Mayorista' : 'Crear Nuevo Pedido Mayorista';
  const modalSubtitle = isSingleProductEdit ? 'Ajusta las cantidades por talla del producto seleccionado' : isAddProductMode ? 'Selecciona el nuevo producto y sus cantidades' : isEditMode ? 'Modifica productos y cantidades del pedido' : isSelfServiceMode ? 'Selecciona categoría, estilo, tallas y cantidades' : 'Selecciona categoría, estilo, tallas y cantidades';

  // Pasos del flujo según el modo del modal.
  //  - Creación:         1 Cliente → 2 Productos → 3 Confirmar
  //  - Edición/agregar:  solo pasos 2-3 (el cliente ya está definido)
  //  - Editar producto:  solo paso 3 (ajuste de cantidades + confirmar)
  const stepDefinitions = [
    { number: 1, label: 'Cliente', hint: 'Elige el cliente y la fecha' },
    { number: 2, label: 'Productos', hint: 'Agrega productos y sus tallas' },
    { number: 3, label: 'Confirmar', hint: 'Revisa y confirma el pedido' },
  ];
  const visibleSteps = isSingleProductEdit
    ? stepDefinitions.slice(2)
    : (isEditMode || isSelfServiceMode)
      ? stepDefinitions.slice(1)
      : stepDefinitions;
  const currentStep = isSingleProductEdit
    ? 3
    : (isEditMode || isSelfServiceMode)
      ? (items.length === 0 ? 2 : 3)
      : !selectedClient
        ? 1
        : items.length === 0
          ? 2
          : 3;

  const itemsToDisplay = isSingleProductEdit
    ? items.filter((it) => {
        // Si tenemos clave compuesta, filtrar por product_id + line_group
        if (editLineGroup !== undefined) {
          return it.product_id === editProductIdReal && it.line_group === editLineGroup;
        }
        return it.product_id === editProductIdReal;
      })
    : items;

  const renderProductList = (fullWidth: boolean) => (
    <div className={fullWidth ? 'space-y-4' : 'lg:sticky lg:top-0 space-y-4'}>
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-gray-400" />
          {isSingleProductEdit ? 'Editar Cantidades' : 'Lista de productos pedidos'}
          {!isSingleProductEdit && items.length > 0 && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] rounded-full">{items.length} {items.length === 1 ? 'modelo' : 'modelos'}</span>}
        </label>
      </div>

      {itemsToDisplay.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-8 text-center transition-colors">
          <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">{isSingleProductEdit ? 'Producto no encontrado en el pedido' : 'No has añadido productos todavía'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itemsToDisplay.map((item) => {
            const idx = items.findIndex(it => it.uid === item.uid);
            const isEditing = editingUid === item.uid;
            const subtotal = item.items.reduce((s, i) => s + i.amount, 0);
            return (
              <div key={item.uid} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex gap-3 p-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex-shrink-0 cursor-pointer overflow-hidden border border-gray-100 dark:border-slate-700 group relative" onClick={() => { const url = resolveImageUrl(item.image_url); if (url != null) { setViewingImage(url); setViewingProductName(item.product_name); } }}>
                    {resolveImageUrl(item.image_url) ? (
                      <><img src={resolveImageUrl(item.image_url)} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /><div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="text-white w-3 h-3" /></div></>
                    ) : <Package className="w-5 h-5 text-gray-300 mx-auto my-auto" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate text-sm">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{item.style_name}</span>
                          <span className="text-[9px] font-bold text-gray-400">• {item.color || 'Sin color'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 shrink-0">{subtotal} pares</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.items.filter((i) => i.amount > 0).map(({ size, amount }) => (
                        <span key={size} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[9px] font-black rounded-md">
                          {size}: {amount}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => (isEditing ? handleCancelEdit() : handleEditItem(item.uid))}
                      className={`p-1.5 rounded-lg transition-all ${isEditing ? 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                      title={isEditing ? 'Cancelar edición' : 'Editar'}
                    >
                      {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleRemoveItem(item.uid)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all" title="Borrar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-3 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 space-y-3">
                    <SummarySizer
                      categoryName={item.category_name}
                      initialItems={item.items}
                      onChange={(newItems) => handleUpdateSummaryItemSizes(idx, newItems)}
                    />
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-2">
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
                        maxLength={500}
                      />
                      <span className="text-[10px] text-gray-400 text-right block mt-0.5">{(item.observations || '').length}/500</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={handleCancelEdit} disabled={editSaving} className="px-4 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold text-xs disabled:opacity-50">
                        Cancelar
                      </button>
                      <button onClick={handleSaveEdit} disabled={editSaving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                        {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {editSaving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!isSingleProductEdit && items.length > 0 && (
            <div className="bg-blue-600 px-6 py-4 rounded-2xl shadow-xl shadow-blue-500/20">
              <p className="text-sm text-blue-50 font-bold flex items-center justify-between">Total acumulado en el pedido: <strong className="text-2xl font-black">{totalPairs} pares</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="full"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col h-full">
        {/* Custom Header Subtitle (integrated with base Modal) */}
        <div className="px-6 py-2 mb-2 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Clipboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {modalSubtitle}
          </p>
        </div>

        {/* Barra de pasos (stepper) */}
        <div className="px-6 pb-4">
          <ol className="flex items-center w-full">
            {visibleSteps.map((step, idx) => {
              const stepNumber = step.number;
              const isComplete = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isLast = idx === visibleSteps.length - 1;
              return (
                <li key={stepNumber} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                  <div className="flex flex-col items-center min-w-0">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-black text-sm shrink-0 transition-all ${
                        isComplete
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                            : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNumber}
                    </div>
                    <p className={`mt-1.5 text-[10px] font-black uppercase tracking-wider text-center ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isComplete
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 text-center leading-tight max-w-[90px]">
                      {step.hint}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-2 mt-0 rounded-full ${stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {isSingleProductEdit ? (
            renderProductList(true)
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* Columna izquierda: formulario wizard */}
              <div className="space-y-8 min-w-0">

                {/* Sección 1: Cliente y Fecha de entrega */}
                {!isEditMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-1 transition-all h-full flex flex-col">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-400">Paso 1 ·</span> Cliente del Pedido <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-auto">
                      {isSelfServiceMode ? (
                        <div className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold text-blue-800 dark:text-blue-300">
                          {selectedClient ? 'Pedido a tu nombre (cliente autenticado)' : 'Cargando tu cuenta...'}
                        </div>
                      ) : loading && !clients.length ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                      ) : (
                        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-bold transition-all shadow-sm">
                          <option value="">Seleccionar cliente mayorista...</option>
                          {clients.map((client) => <option key={client.id} value={client.id}>{client.name} {client.last_name} {client.business_name ? `(${client.business_name})` : ''}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-1 transition-all h-full flex flex-col">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex-shrink-0">Fecha estimada de entrega <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <div className="mt-auto">
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* Sección 2: Agregar Producto */}
                <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-900/40 space-y-6 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">
                      <span className="text-blue-600 dark:text-blue-400">Paso 2 ·</span> Agregar Nuevo Producto
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Categoría</label>
                      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={!isEditMode && !selectedClient} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <option value="">Categoría</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Marca</label>
                      <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} disabled={!selectedCategory} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <option value="">Marca</option>
                        {getAvailableBrands().map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Estilo</label>
                      <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} disabled={!selectedBrand} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-gray-200 font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
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
{getAvailableProducts().map((prod) => {
                        const isAdded = items.some(it => it.product_id === prod.id);
                        return (
                        <div 
                          key={prod.id}
                          onClick={() => setSelectedProduct(prod.id)}
                          className={`group cursor-pointer rounded-2xl p-2 border-2 transition-all duration-300 relative ${
                            selectedProduct === prod.id 
                              ? 'bg-white dark:bg-slate-800 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]' 
                              : isAdded
                              ? 'bg-green-50/80 dark:bg-green-900/20 border-green-500 dark:border-green-500 shadow-md shadow-green-500/20'
                              : 'bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-gray-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Already added overlay on image */}
                          {isAdded && !(selectedProduct === prod.id) && (
                            <div className="absolute inset-0 z-[5] rounded-2xl bg-green-500/10 pointer-events-none" />
                          )}
                          {/* Botón Zoom */}
                          {prod.image_url && (
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingImage(resolveImageUrl(prod.image_url) ?? null);
                                  setViewingProductName(prod.name);
                                }}
                                className="absolute top-3 right-3 z-10 p-1.5 bg-black/85 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                           )}
                            
                           <div className="aspect-square bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-3 shadow-inner relative">
                             {prod.image_url ? (
                               <img src={resolveImageUrl(prod.image_url)} alt={prod.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Package className="w-8 h-8 opacity-20" /></div>
                             )}
                             {/* Green checkmark overlay on image when added */}
                             {isAdded && !(selectedProduct === prod.id) && (
                               <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                   <Check className="w-5 h-5 text-white" strokeWidth={3} />
                                 </div>
                               </div>
                             )}
                           </div>
                           <div className="px-1 flex items-center justify-center gap-1.5 min-w-0">
                             <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20 border border-black/5 flex-shrink-0" style={{ backgroundColor: getColorHex(prod.color || '') }} />
                             <p className={`text-sm font-extrabold truncate ${
                               selectedProduct === prod.id ? 'text-blue-600 dark:text-blue-400' 
                               : isAdded ? 'text-green-700 dark:text-green-400' 
                               : 'text-gray-700 dark:text-gray-300'
                             }`}>
                               {prod.color || 'Unico'}
                             </p>
                           </div>
                           
                           {/* Already added badge */}
                           {isAdded && !(selectedProduct === prod.id) && (
                             <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-green-500/30 flex items-center gap-1">
                               <Check className="w-3 h-3" strokeWidth={3} /> Agregado
                             </div>
                           )}
                           {/* Indicator Check */}
                           {selectedProduct === prod.id && (
                             <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transform animate-in zoom-in duration-300">
                               <Check className="w-3 h-3 font-bold" />
                             </div>
                           )}
                         </div>
                         );
                      })}
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

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 bg-gray-50/50 dark:bg-slate-800/80 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-inner">
                        {availableSizes.map((size) => (
                          <div key={size} className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase text-center">Talla {size}</label>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              value={sizeAmounts[size] || ''} 
                              onChange={(e) => handleSizeAmountChange(size, e.target.value)} 
                              className={`w-full min-w-[2rem] px-2 py-2.5 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm ${
                                (parseInt(sizeAmounts[size] || '0') > 0)
                                  ? 'bg-white dark:bg-slate-700 border-2 border-orange-500 text-orange-600 dark:text-orange-400 scale-105 z-10' 
                                  : 'bg-white dark:bg-slate-800 border border-transparent text-gray-900 dark:text-white'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddItem} disabled={addLoading} className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all font-black text-base flex items-center justify-center gap-3">
                        {addLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                        {addLoading ? 'Guardando producto...' : 'Añadir a la lista del Pedido'}
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Columna derecha: Lista de productos pedidos */}
              <aside className="min-w-0">
                {renderProductList(false)}
              </aside>
            </div>
          )}
        </div>
        {!isAddProductMode && <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 px-6 py-5 flex justify-end gap-3 rounded-b-2xl z-10 transition-colors"><button onClick={handleClose} disabled={loading} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold disabled:opacity-50">Cancelar</button><button onClick={handleSubmit} disabled={loading || items.length === 0 || (!isEditMode && !selectedClient)} className={`px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all font-bold flex items-center gap-2 disabled:opacity-50`}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isEditMode ? 'Guardando...' : 'Creando...'}</> : <><Check className="w-4 h-4" />{isEditMode ? 'Guardar Cambios' : 'Confirmar Pedido'}</>}</button></div>}
      </div>
      
      {/* Modal visor de imagen */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage || ''}
        productName={viewingProductName}
        onClose={() => setViewingImage(null)}
      />
    </Modal>
  );
}