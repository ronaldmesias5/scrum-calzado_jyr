import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingBag,
  Wrench,
  Box,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import api from '@/api/axios';
import {
  createIncident,
  getSupplies,
  SupplyItem,
  type IncidenceCategory,
  type IncidentType,
  type IncidentCreateRequest,
} from '../services/lossService';
import {
  listProducts,
  listCategories,
  listBrands,
  resolveImageUrl,
  type Product,
  type Category,
  type Brand,
} from '../services/catalogService';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface LossFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormMode = 'linked' | 'independent';

interface OrderSummary {
  id: string;
  customer_name?: string;
  state: string;
  total_pairs?: number;
}

interface OrderDetailItem {
  id: string;
  product_id: string;
  product_name?: string;
  image_url?: string;
  style_name?: string;
  category_name?: string;
  brand_name?: string;
  size: string;
  amount: number;
  colour?: string;
  line_group?: number;
  state?: string;
}

interface GroupedProduct {
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  styleName: string;
  imageUrl?: string;
  totalPairs: number;
  details: OrderDetailItem[];
}

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const INCIDENT_TYPE_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: 'perdida', label: 'Pérdida' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'devuelto', label: 'Devuelto' },
];

const MODE_OPTIONS: { value: FormMode; label: string; icon: typeof Package }[] = [
  { value: 'linked', label: 'Vincular a Pedido', icon: ShoppingBag },
  { value: 'independent', label: 'Registro Independiente', icon: Package },
];

const CATEGORY_OPTIONS: {
  value: IncidenceCategory;
  label: string;
  icon: typeof Package;
  activeColor: string;
}[] = [
  { value: 'producto', label: 'Producto', icon: Package, activeColor: 'blue' },
  { value: 'maquinaria', label: 'Maquinaria', icon: Wrench, activeColor: 'orange' },
  { value: 'insumo', label: 'Insumo', icon: Box, activeColor: 'green' },
];

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────

export default function LossFormModal({ isOpen, onClose, onSuccess }: LossFormModalProps) {
  // ── Incidence Category ──
  const [incidenceCategory, setIncidenceCategory] = useState<IncidenceCategory>('producto');

  // ── Mode (only for producto) ──
  const [formMode, setFormMode] = useState<FormMode>('linked');

  // ── Mode A: linked order ──
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showVale, setShowVale] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [activeDetailId, setActiveDetailId] = useState('');
  const [rowQuantities, setRowQuantities] = useState<Record<string, number>>({});

  // ── Mode B: independent ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [independentProducts, setIndependentProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedIndependentProductId, setSelectedIndependentProductId] = useState('');

  // ── Common ──
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Form fields ──
  const [incidentType, setIncidentType] = useState<IncidentType>('perdida');
  const [productId, setProductId] = useState('');
  const [size, setSize] = useState('');
  const [colour, setColour] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState('');
  const [orderDetailId, setOrderDetailId] = useState('');
  const [lineGroup, setLineGroup] = useState<number | undefined>(undefined);

  // ── Category-specific fields ──
  const [machineryName, setMachineryName] = useState('');
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [supplyInputMode, setSupplyInputMode] = useState<'select' | 'type'>('select');
  const [customSupplyName, setCustomSupplyName] = useState('');
  const [supplyDropdownOpen, setSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // ─────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────

  const groupedProducts = useMemo<GroupedProduct[]>(() => {
    const map = new Map<string, OrderDetailItem[]>();
    orderDetails.forEach(d => {
      const existing = map.get(d.product_id);
      if (existing) {
        existing.push(d);
      } else {
        map.set(d.product_id, [d]);
      }
    });
    return Array.from(map.entries()).map(([pid, details]) => ({
      productId: pid,
      productName: details[0]!.product_name ?? 'Producto',
      brandName: details[0]!.brand_name ?? '',
      categoryName: details[0]!.category_name ?? '',
      styleName: details[0]!.style_name ?? '',
      imageUrl: details[0]!.image_url,
      totalPairs: details.reduce((sum, d) => sum + d.amount, 0),
      details,
    }));
  }, [orderDetails]);

  const selectedProductDetails = useMemo(() => {
    if (!selectedProductId) return [];
    return orderDetails.filter(d => d.product_id === selectedProductId);
  }, [orderDetails, selectedProductId]);

  const selectedIndependentProduct = useMemo(() => {
    if (!selectedIndependentProductId) return null;
    return independentProducts.find(p => p.id === selectedIndependentProductId) ?? null;
  }, [selectedIndependentProductId, independentProducts]);

  // ── Click-outside handler for custom supply dropdown ──
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(e.target as Node)) {
      setSupplyDropdownOpen(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // ─────────────────────────────────────────
  // RESET HELPERS
  // ─────────────────────────────────────────

  const resetCategoryFields = () => {
    setMachineryName('');
    setSelectedSupplyId('');
    setCustomSupplyName('');
    setSupplyInputMode('select');
    setObservations('');
  };

  const resetFormFields = () => {
    setProductId('');
    setSize('');
    setColour('');
    setQuantity(1);
    setDescription('');
    setReason('');
    setObservations('');
    setOrderDetailId('');
    setLineGroup(undefined);
    setIncidentType('perdida');
  };

  const resetLinkedFields = () => {
    setSelectedOrderId('');
    setOrderDetails([]);
    setShowVale(false);
    setSelectedProductId('');
    setActiveDetailId('');
    setRowQuantities({});
    setOrderDetailId('');
    setLineGroup(undefined);
  };

  const resetIndependentFields = () => {
    setSelectedCategoryId('');
    setSelectedBrandId('');
    setSelectedIndependentProductId('');
    setIndependentProducts([]);
  };

  const handleModeChange = (mode: FormMode) => {
    if (mode === formMode) return;
    setFormMode(mode);
    resetFormFields();
    if (mode === 'linked') {
      resetIndependentFields();
    } else {
      resetLinkedFields();
    }
  };

  const handleCategoryChange = (cat: IncidenceCategory) => {
    if (cat === incidenceCategory) return;
    setIncidenceCategory(cat);
    resetFormFields();
    resetCategoryFields();
  };

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Main load: defect codes, categories, brands, supplies
  useEffect(() => {
    if (!isOpen) return;

    setIncidenceCategory('producto');
    setFormMode('linked');
    resetFormFields();
    resetLinkedFields();
    resetIndependentFields();
    resetCategoryFields();

    const loadData = async () => {
      setLoading(true);
      try {
        const [catsResult, brdsResult, suppsResult] = await Promise.allSettled([
          listCategories(),
          listBrands(),
          getSupplies(),
        ]);
        if (catsResult.status === 'fulfilled') setCategories(catsResult.value);
        if (brdsResult.status === 'fulfilled') setBrands(brdsResult.value);
        if (suppsResult.status === 'fulfilled') {
          setSupplies(suppsResult.value);
        } else {
          console.error('Error loading supplies:', suppsResult.reason);
          setSupplies([]);
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        showToast('Error al cargar datos del formulario', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load orders (only when modal opens)
  useEffect(() => {
    if (!isOpen) return;

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get('/api/v1/admin/orders', {
          params: { page: 1, page_size: 100, state: 'en_progreso' },
        });
        const items: OrderSummary[] = res.data.items ?? res.data ?? [];
        setOrders(items);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [isOpen]);

  // Load order details when an order is selected
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetails([]);
      setOrderDetailId('');
      setLineGroup(undefined);
      setSelectedProductId('');
      setActiveDetailId('');
      setRowQuantities({});
      return;
    }

    const loadOrderDetails = async () => {
      setLoadingOrderDetails(true);
      try {
        const res = await api.get(`/api/v1/admin/orders/${selectedOrderId}`);
        const details: OrderDetailItem[] = res.data.details ?? [];
        setOrderDetails(details);
      } catch (err) {
        console.error('Error loading order details:', err);
        setOrderDetails([]);
      } finally {
        setLoadingOrderDetails(false);
      }
    };

    loadOrderDetails();
  }, [selectedOrderId]);

  // Load independent products when category/brand changes in Mode B
  const shouldLoadProducts = formMode === 'independent';
  useEffect(() => {
    if (!shouldLoadProducts) return;

    const load = async () => {
      setLoadingProducts(true);
      setSelectedIndependentProductId('');
      setIndependentProducts([]);
      try {
        const params: Record<string, string> = {};
        if (selectedCategoryId) params.category_id = selectedCategoryId;
        if (selectedBrandId) params.brand_id = selectedBrandId;
        const prods = await listProducts(params);
        setIndependentProducts(prods.products);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    load();
  }, [shouldLoadProducts, selectedCategoryId, selectedBrandId]);

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedProductId('');
    setActiveDetailId('');
    setRowQuantities({});
    setProductId('');
    setSize('');
    setColour('');
    setOrderDetailId('');
    setLineGroup(undefined);
    setQuantity(1);
    setShowVale(false);
  };

  const handleRowFocus = (detail: OrderDetailItem) => {
    setActiveDetailId(detail.id);
    setProductId(detail.product_id);
    setSize(detail.size);
    setColour(detail.colour ?? '');
    setOrderDetailId(detail.id);
    setLineGroup(detail.line_group);
    // Sync quantity from row quantity if set, otherwise default to 1
    const q = rowQuantities[detail.id] ?? 1;
    setQuantity(q);
  };

  const handleRowQuantityChange = (detailId: string, value: number, detail: OrderDetailItem) => {
    const clamped = Math.max(0, Math.min(value, detail.amount));
    setRowQuantities(prev => ({ ...prev, [detailId]: clamped }));
    // Sync form quantity if this is the active row
    if (activeDetailId === detailId) {
      setQuantity(clamped);
    }
  };

  const handleIndependentProductChange = (pid: string) => {
    setSelectedIndependentProductId(pid);
    setProductId(pid);
    setSize('');
    setColour('');
    setQuantity(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

      if (incidenceCategory === 'producto') {
        // ── Existing validation for producto ──
        if (!productId || !size || !description.trim() || !quantity || quantity <= 0) {
          showToast('Todos los campos obligatorios deben estar diligenciados', 'error');
          return;
        }
        if (quantity < 1) {
        showToast('La cantidad debe ser al menos 1', 'error');
        return;
      }
    } else if (incidenceCategory === 'maquinaria') {
      if (!machineryName.trim()) {
        showToast('El nombre de maquinaria es obligatorio', 'error');
        return;
      }
    } else if (incidenceCategory === 'insumo') {
      if (supplyInputMode === 'select' && !selectedSupplyId) {
        showToast('Debe seleccionar un insumo', 'error');
        return;
      }
      if (supplyInputMode === 'type' && !customSupplyName.trim()) {
        showToast('Debe escribir el nombre del insumo', 'error');
        return;
      }
    }

    setSubmitting(true);

    try {
      let payload: IncidentCreateRequest;

      if (incidenceCategory === 'producto') {
        payload = {
          incidence_category: 'producto',
          product_id: productId,
          size,
          colour: colour || undefined,
          quantity: quantity || 1,
          incident_type: incidentType,
          description: description.trim(),
          reason: reason || undefined,
          observations: observations || undefined,
          order_id: selectedOrderId || undefined,
          order_detail_id: orderDetailId || undefined,
          line_group: lineGroup,
        };
      } else if (incidenceCategory === 'maquinaria') {
        payload = {
          incidence_category: 'maquinaria',
          machinery_name: machineryName.trim(),
          observations: observations || undefined,
          quantity: 1,
        };
      } else {
        payload = {
          incidence_category: 'insumo',
          ...(supplyInputMode === 'select' ? { supply_id: selectedSupplyId } : { custom_supply_name: customSupplyName.trim() }),
          observations: observations || undefined,
          quantity: 1,
        };
      }

      await createIncident(payload);
      showToast('Incidencia registrada exitosamente', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating incident:', err);
      const msg =
        err instanceof Error ? err.message : 'Error al registrar la incidencia';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────

  const categoryActiveClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm';
      case 'orange':
        return 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-400 shadow-sm';
      case 'green':
        return 'bg-white dark:bg-slate-700 text-green-700 dark:text-green-400 shadow-sm';
      default:
        return 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 shadow-sm';
    }
  };

  const renderCategoryToggle = () => (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
      {CATEGORY_OPTIONS.map(opt => {
        const Icon = opt.icon;
        const active = incidenceCategory === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleCategoryChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              active
                ? categoryActiveClass(opt.activeColor)
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={18} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderModeToggle = () => (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
      {MODE_OPTIONS.map(opt => {
        const Icon = opt.icon;
        const active = formMode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleModeChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              active
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={18} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderMiniVale = () => {
    if (!showVale || orderDetails.length === 0) return null;

    return (
      <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ClipboardList size={16} />
            Vale de Producción
          </span>
          <button
            type="button"
            onClick={() => setShowVale(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Cerrar vale"
          >
            ✕
          </button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Talla
                </th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Color
                </th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {orderDetails.map(d => (
                <tr
                  key={d.id}
                  className="border-b border-gray-100 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                    {d.product_name ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{d.size}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{d.amount}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{d.colour ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {d.state ?? 'en_progreso'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLinkedMode = () => (
    <div className="space-y-5">
      {/* ── Step 1: Order Selection ── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          Paso 1: Seleccionar Pedido
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            {loadingOrders ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Cargando pedidos...
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={e => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
              >
                <option value="">Seleccionar pedido</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.customer_name ?? 'Cliente'} — {o.total_pairs ?? '?'} pares — #
                    {o.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVale(prev => !prev); }}
            disabled={!selectedOrderId}
            className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ClipboardList size={16} />
            Ver Vale
            {showVale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Mini Vale (expandable) */}
      {renderMiniVale()}

      {/* ── Step 2: Product Selection ── */}
      {selectedOrderId && (
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Paso 2: Seleccionar Producto
          </label>
          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groupedProducts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              No hay productos en este pedido
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupedProducts.map(gp => {
                const isSelected = selectedProductId === gp.productId;
                return (
                  <button
                    type="button"
                    key={gp.productId}
                    onClick={() => setSelectedProductId(gp.productId)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                      {gp.imageUrl ? (
                        <img
                          src={resolveImageUrl(gp.imageUrl)}
                          alt={gp.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {gp.productName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {gp.brandName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {gp.styleName} · {gp.categoryName}
                      </div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {gp.totalPairs} pares en pedido
                      </div>
                    </div>
                    {/* Check */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Size & Quantity ── */}
      {selectedProductId && selectedProductDetails.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Paso 3: Numeración del Pedido
          </label>
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Talla
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    En Pedido
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cant. Incidencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedProductDetails.map(d => {
                  const isActive = activeDetailId === d.id;
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">
                        {d.size}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                        {d.amount} pares
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                        {d.colour ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={d.amount}
                            value={rowQuantities[d.id] ?? ''}
                            placeholder="0"
                            onFocus={() => handleRowFocus(d)}
                            onChange={e =>
                              handleRowQuantityChange(
                                d.id,
                                parseInt(e.target.value) || 0,
                                d,
                              )
                            }
                            className={`w-20 px-2 py-1.5 border rounded-lg text-sm outline-none transition-colors ${
                              isActive
                                ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                                : 'border-gray-300 dark:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                            } bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100`}
                          />
                          {isActive && (
                            <span className="text-xs text-blue-500 font-bold">
                              max {d.amount}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active row summary */}
      {activeDetailId && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl text-sm">
          <span className="font-bold text-blue-700 dark:text-blue-400">
            Incidencia para: {productId.slice(0, 8)}
          </span>
          <span className="text-blue-600 dark:text-blue-300 mx-2">·</span>
          <span className="text-blue-600 dark:text-blue-300">
            Talla {size} · {quantity} unidad(es)
          </span>
        </div>
      )}
    </div>
  );

  const renderIndependentMode = () => {
    const selectedImg = selectedIndependentProduct?.image_url;

    return (
      <div className="space-y-5">
        {/* ── Step 1: Category → Brand → Product ── */}
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
          Paso 1: Seleccionar Producto
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
              Categoría
            </label>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
              Marca
            </label>
            <select
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todas las marcas</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product dropdown */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
            Producto <span className="text-red-500">*</span>
          </label>
          {loadingProducts ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Cargando productos...
            </div>
          ) : (
            <select
              value={selectedIndependentProductId}
              onChange={e => handleIndependentProductChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
              required
            >
              <option value="">Seleccionar producto</option>
              {independentProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.brand_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected product image */}
        {selectedImg && (
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700">
              <img
                src={resolveImageUrl(selectedImg)}
                alt={selectedIndependentProduct?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Size & Quantity ── */}
        {selectedIndependentProductId && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Paso 2: Talla y Cantidad
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Talla <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  placeholder="Ej: 38"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                    onChange={e => {
                      const val = e.target.value;
                      setQuantity(val === '' ? '' : (parseInt(val) || 1));
                    }}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommonSection = () => (
    <div className="space-y-5 border-t border-gray-100 dark:border-slate-800 pt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incident Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Tipo de Incidencia <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {INCIDENT_TYPE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                  incidentType === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="incident_type"
                  value={opt.value}
                  checked={incidentType === opt.value}
                  onChange={() => setIncidentType(opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    incidentType === opt.value
                      ? 'border-blue-500'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {incidentType === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Description — free-text defect description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Descripción del defecto <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe el defecto encontrado (ej: 'despegue de suela', 'costura rota', 'mala terminación')"
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors resize-none"
            required
          />
          <span className="text-[10px] text-gray-400 text-right block mt-0.5">{description.length}/500</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Razón
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Motivo de la incidencia..."
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors resize-none"
          />
          <span className="text-[10px] text-gray-400 text-right block mt-0.5">{reason.length}/500</span>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Observaciones adicionales..."
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors resize-none"
          />
          <span className="text-[10px] text-gray-400 text-right block mt-0.5">{observations.length}/500</span>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────
  // MAQUINARIA FORM
  // ─────────────────────────────────────────

  const renderMaquinariaForm = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          Nombre de Maquinaria <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={machineryName}
          onChange={e => setMachineryName(e.target.value)}
          placeholder="Ej: Prensa hidráulica"
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-colors"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          Observaciones
        </label>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Describa el daño o incidencia..."
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-colors resize-none"
        />
        <span className="text-[10px] text-gray-400 text-right block mt-0.5">{observations.length}/500</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────
  // INSUMO FORM
  // ─────────────────────────────────────────

  const renderInsumoForm = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          Insumo <span className="text-red-500">*</span>
        </label>
        {/* Toggle between select and type */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setSupplyInputMode('select'); setCustomSupplyName(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              supplyInputMode === 'select'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Seleccionar
          </button>
          <button
            type="button"
            onClick={() => { setSupplyInputMode('type'); setSelectedSupplyId(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              supplyInputMode === 'type'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Escribir
          </button>
        </div>

        {supplyInputMode === 'select' ? (
          <div className="relative" ref={supplyDropdownRef}>
            <button
              type="button"
              onClick={() => setSupplyDropdownOpen(!supplyDropdownOpen)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm transition-colors text-left flex items-center gap-2"
            >
              {selectedSupplyId ? (
                (() => {
                  const sel = supplies.find(s => s.id === selectedSupplyId);
                  return (
                    <>
                      <span className="flex-1">{sel?.name || 'Seleccionar insumo'}</span>
                      {sel?.color && <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{sel.color}</span>}
                    </>
                  );
                })()
              ) : (
                'Seleccionar insumo'
              )}
            </button>
            {supplyDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {supplies.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSupplyId(s.id); setSupplyDropdownOpen(false); }}
                    className="px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <span className="flex-1">{s.name}</span>
                    {s.color && <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{s.color}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={customSupplyName}
            onChange={e => setCustomSupplyName(e.target.value)}
            placeholder="Nombre del insumo"
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm transition-colors"
            required
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          Observaciones
        </label>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Describa el daño o incidencia..."
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm transition-colors resize-none"
        />
        <span className="text-[10px] text-gray-400 text-right block mt-0.5">{observations.length}/500</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Registrar Incidencia">
      <div className="p-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selector (always visible, at the top) */}
            {renderCategoryToggle()}

            {/* Producto: Mode Toggle + Linked/Independent + Common Section */}
            {incidenceCategory === 'producto' && (
              <>
                {renderModeToggle()}

                {/* Mode-specific content */}
                {formMode === 'linked' ? renderLinkedMode() : renderIndependentMode()}

                {/* Common Section — solo después de producto + cantidad */}
                {(() => {
                  if (formMode === 'linked') {
                    return selectedProductId && activeDetailId ? renderCommonSection() : null;
                  }
                  // independent
                  return selectedIndependentProductId && size && quantity && quantity > 0
                    ? renderCommonSection()
                    : null;
                })()}
              </>
            )}

            {/* Maquinaria: Simple form */}
            {incidenceCategory === 'maquinaria' && renderMaquinariaForm()}

            {/* Insumo: Simple form */}
            {incidenceCategory === 'insumo' && renderInsumoForm()}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Registrar Incidencia
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
