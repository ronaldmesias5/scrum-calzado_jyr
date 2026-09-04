import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Package, Plus, Upload } from 'lucide-react';
import CameraCapture from '@/components/atoms/CameraCapture';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';
import { resolveImageUrl } from '@/services/catalogService';
import {
  createMyIncidence,
  getMyOrders,
  type ClientOrder,
  type ClientOrderDetailItem
} from '@/services/clientApi';

interface ReportIncidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se invoca tras crear reclamos para recargar la lista */
  onCreated: () => void;
}

interface ProductGroup {
  productId: string;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  totalPairs: number;
  items: ClientOrderDetailItem[];
}

export function ReportIncidenceModal({
  isOpen,
  onClose,
  onCreated
}: ReportIncidenceModalProps) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const productGroups = useMemo<ProductGroup[]>(() => {
    if (!selectedOrder) return [];
    const map = new Map<string, ProductGroup>();
    for (const d of selectedOrder.details) {
      const group = map.get(d.product_id) ?? {
        productId: d.product_id,
        productName: d.product_name || 'Producto',
        brandName: d.brand_name,
        categoryName: d.category_name,
        imageUrl: d.image_url,
        totalPairs: 0,
        items: []
      };
      group.totalPairs += d.amount;
      group.items.push(d);
      map.set(d.product_id, group);
    }
    return Array.from(map.values());
  }, [selectedOrder]);

  const activeGroup =
    productGroups.find((g) => g.productId === activeProductId) || null;

  const claimedEntries = Object.entries(quantities).filter(
    ([, qty]) => qty > 0
  );
  const claimedTotal = claimedEntries.reduce((sum, [, qty]) => sum + qty, 0);

  // Reset y carga de pedidos entregados al abrir
  useEffect(() => {
    if (!isOpen) return;
    setSelectedOrderId('');
    setActiveProductId(null);
    setQuantities({});
    setDescription('');
    setObservations('');
    setEvidenceFile(null);
    setLoadingOrders(true);
    getMyOrders(1, 100)
      .then((data) =>
        setOrders(data.items.filter((o) => o.state === 'entregado'))
      )
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [isOpen]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveProductId(null);
    setQuantities({});
  };

  const handleSelectProduct = (productId: string) => {
    setActiveProductId((current) => (current === productId ? null : productId));
    if (productId !== activeProductId) {
      // Limpia cantidades de otros productos; conserva las del mismo si reabre
      const keep = new Set(
        productGroups
          .find((g) => g.productId === productId)
          ?.items.map((i) => i.id) ?? []
      );
      setQuantities((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([id]) => keep.has(id)))
      );
    }
  };

  const updateQuantity = (detail: ClientOrderDetailItem, rawValue: number) => {
    const clamped = Number.isNaN(rawValue)
      ? 0
      : Math.max(0, Math.min(detail.amount, Math.floor(rawValue)));
    setQuantities((prev) => ({ ...prev, [detail.id]: clamped }));
  };

  const handleSubmit = async () => {
    if (!selectedOrder) {
      showToast('Selecciona un pedido entregado', 'error');
      return;
    }
    if (!activeGroup) {
      showToast('Selecciona un producto del pedido', 'error');
      return;
    }
    if (claimedTotal === 0) {
      showToast('Digita la cantidad defectuosa en al menos una talla', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Describe el defecto del producto', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let created = 0;
      for (const detail of activeGroup.items) {
        const qty = quantities[detail.id] ?? 0;
        if (qty < 1) continue;
        await createMyIncidence({
          order_id: selectedOrder.id,
          order_detail_id: detail.id,
          size: detail.size,
          colour: detail.colour,
          description: description.trim(),
          quantity: qty,
          observations: observations.trim() || null
        }, evidenceFile);
        created += 1;
      }
      showToast(
        `${created} ${created === 1 ? 'reclamo enviado' : 'reclamos enviados'}. El jefe lo revisará.`,
        'success'
      );
      onCreated();
      onClose();
    } catch (e: unknown) {
      const detail =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? (e instanceof Error ? e.message : 'Desconocido');
      showToast('Error al reportar la incidencia: ' + detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reportar Incidencia"
      size="xl"
    >
      <div className="space-y-5 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Solo puedes reportar productos de pedidos ya{' '}
          <span className="font-bold">entregados</span>. El reclamo queda
          pendiente hasta que el jefe lo apruebe o rechace.
        </p>

        {/* ── Paso 1 · Pedido entregado ─────────────────── */}
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-extrabold text-white">
              1
            </span>
            Pedido entregado <span className="text-red-500">*</span>
          </h4>
          <select
            value={selectedOrderId}
            onChange={(e) => handleSelectOrder(e.target.value)}
            disabled={loadingOrders}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-amber-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">
              {loadingOrders
                ? 'Cargando pedidos...'
                : 'Seleccionar pedido entregado...'}
            </option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                Pedido #{o.id.slice(0, 8)} — {o.total_pairs} pares
              </option>
            ))}
          </select>
          {!loadingOrders && orders.length === 0 && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              No tienes pedidos entregados para reportar.
            </p>
          )}

          {selectedOrder && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                #{selectedOrder.id.slice(0, 8)}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                {selectedOrder.total_pairs} pares · {productGroups.length}{' '}
                {productGroups.length === 1 ? 'producto' : 'productos'}
              </span>
              {selectedOrder.delivery_date && (
                <span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Entregado
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── Paso 2 · Productos con imagen ─────────────── */}
        {selectedOrder && productGroups.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-extrabold text-white">
                2
              </span>
              Productos del pedido
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {productGroups.map((group) => {
                const isActive = group.productId === activeProductId;
                return (
                  <button
                    key={group.productId}
                    type="button"
                    onClick={() => handleSelectProduct(group.productId)}
                    className={`group overflow-hidden rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isActive
                        ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/30 dark:border-amber-500 dark:bg-amber-950/30'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-amber-600'
                    }`}
                  >
                    <div className="flex h-20 items-center justify-center bg-gray-50 p-1.5 dark:bg-slate-900/60">
                      {group.imageUrl ? (
                        <img
                          src={resolveImageUrl(group.imageUrl)}
                          alt={group.productName}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1 p-2">
                      <p
                        className="truncate text-xs font-bold text-gray-900 dark:text-white"
                        title={group.productName}
                      >
                        {group.productName}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                        {[group.brandName, group.categoryName]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'talla' : 'tallas'} ·{' '}
                        {group.totalPairs} pares
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Paso 3 · Desglose de tallas y cantidades ──── */}
        {activeGroup && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-extrabold text-white">
                  3
                </span>
                Tallas de {activeGroup.productName}
              </h4>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold tabular-nums transition-colors ${
                  claimedTotal > 0
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500'
                }`}
              >
                {claimedTotal} a reportar
              </span>
            </div>
            <div className="space-y-2">
              {activeGroup.items.map((detail) => {
                const qty = quantities[detail.id] ?? 0;
                return (
                  <div
                    key={detail.id}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                      qty > 0
                        ? 'border-amber-400 bg-amber-50/70 dark:border-amber-500/60 dark:bg-amber-950/25'
                        : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-1.5 text-xs font-extrabold text-white dark:bg-white dark:text-gray-900">
                      {detail.size}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        Talla {detail.size}
                        {detail.colour ? ` · ${detail.colour}` : ''}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Pedidos: {detail.amount} pares
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Reducir cantidad talla ${detail.size}`}
                        onClick={() => updateQuantity(detail, qty - 1)}
                        disabled={qty <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-all hover:bg-gray-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={detail.amount}
                        value={qty}
                        onChange={(e) =>
                          updateQuantity(detail, Number(e.target.value))
                        }
                        onBlur={(e) =>
                          updateQuantity(detail, Number(e.target.value))
                        }
                        aria-label={`Cantidad defectuosa talla ${detail.size}`}
                        className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-sm font-extrabold tabular-nums text-gray-900 outline-none transition-all focus:ring-2 focus:ring-amber-500 sm:w-20 dark:border-slate-600 dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad talla ${detail.size}`}
                        onClick={() => updateQuantity(detail, qty + 1)}
                        disabled={qty >= detail.amount}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-all hover:bg-gray-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="w-14 text-right text-[11px] text-gray-400 dark:text-gray-500">
                        máx. {detail.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Descripción del defecto ───────────────────── */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Descripción del defecto <span className="text-red-600">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ej: el par derecho tiene la suela despegada"
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Observaciones{' '}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            placeholder="Información adicional para el jefe"
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Evidencia fotográfica{' '}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <CameraCapture onCapture={(f) => setEvidenceFile(f)} />
            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
              <Upload size={16} />
              Subir archivo
              <input type="file" accept="image/*" onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">PNG, JPG, WEBP (max. 5MB)</p>
          {evidenceFile && (
            <div className="mt-2 flex items-center gap-3">
              <img src={URL.createObjectURL(evidenceFile)} alt="Vista previa" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-slate-700" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{evidenceFile.name}</p>
                <button type="button" onClick={() => setEvidenceFile(null)} className="text-xs text-red-500 hover:text-red-700 font-medium mt-1">Quitar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Acciones ──────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || claimedTotal === 0}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Enviar {claimedTotal > 0 ? `${claimedTotal} par(es)` : 'reclamo'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
