import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MessageSquareWarning, Plus, Package2, Loader2 } from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';
import {
  getMyIncidences,
  createMyIncidence,
  getMyOrders,
  type ClientIncidence,
  type ClientOrder,
  type ClientOrderDetailItem,
} from '@/services/clientApi';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  approved: { label: 'Aprobada', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const DEFAULT_STATUS = { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' };

export default function MisIncidenciasPage() {
  const { showToast } = useToast();
  const [incidences, setIncidences] = useState<ClientIncidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Formulario
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');

  const loadIncidences = useCallback(async () => {
    try {
      const data = await getMyIncidences();
      setIncidences(data.incidences);
    } catch {
      setIncidences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidences();
  }, [loadIncidences]);

  const openReportModal = async () => {
    setSelectedOrderId('');
    setSelectedDetailId('');
    setQuantity('1');
    setDescription('');
    setObservations('');
    setReportOpen(true);
    try {
      const data = await getMyOrders(1, 100);
      const delivered = data.items.filter((o) => o.state === 'entregado');
      setOrders(delivered);
    } catch {
      setOrders([]);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const selectedDetail: ClientOrderDetailItem | null =
    selectedOrder?.details.find((d) => d.id === selectedDetailId) || null;

  const maxQuantity = selectedDetail?.amount ?? 1;

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      showToast('Selecciona un pedido entregado', 'error');
      return;
    }
    if (!selectedDetailId) {
      showToast('Selecciona el producto y la talla del reclamo', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Describe el defecto del producto', 'error');
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQuantity) {
      showToast(`La cantidad debe estar entre 1 y ${maxQuantity}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createMyIncidence({
        order_id: selectedOrderId,
        order_detail_id: selectedDetailId,
        size: selectedDetail!.size,
        colour: selectedDetail!.colour,
        description: description.trim(),
        quantity: qty,
        observations: observations.trim() || null,
      });
      showToast('Reclamo enviado. El jefe lo revisará y decidirá.', 'success');
      setReportOpen(false);
      await loadIncidences();
    } catch (e: any) {
      showToast(
        'Error al reportar la incidencia: ' + (e?.response?.data?.detail || e?.message || 'Desconocido'),
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            Mis Incidencias
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Reporta productos defectuosos o con problemas de tus pedidos entregados
          </p>
        </div>
        <button
          onClick={openReportModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus size={16} /> Reportar incidencia
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incidences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <MessageSquareWarning size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">No has reportado incidencias</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
              Si algún producto de un pedido entregado llegó defectuoso, repórtalo aquí y el jefe lo revisará.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Talla</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Defecto</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cant.</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {incidences.map((inc) => {
                  const status = STATUS_MAP[inc.status] || DEFAULT_STATUS;
                  return (
                    <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 dark:text-white">{inc.product_name || 'Producto'}</p>
                        {inc.observations && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-0.5">"{inc.observations}"</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{inc.order_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{inc.size}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {inc.defect_name || inc.defect_code || inc.description || '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{inc.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                        {inc.reviewed_by_name && (
                          <p className="text-[10px] text-gray-400 mt-0.5">por {inc.reviewed_by_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(inc.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal reportar incidencia */}
      <Modal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Reportar Incidencia"
        size="lg"
      >
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo puedes reportar productos de pedidos ya <span className="font-bold">entregados</span>. El reclamo queda
            pendiente hasta que el jefe lo apruebe o rechace.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Pedido entregado <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => { setSelectedOrderId(e.target.value); setSelectedDetailId(''); }}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            >
              <option value="">Seleccionar pedido entregado...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  Pedido #{o.id.slice(0, 8)} — {o.total_pairs} pares
                </option>
              ))}
            </select>
            {orders.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                No tienes pedidos entregados para reportar.
              </p>
            )}
          </div>

          {selectedOrder && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Producto / Talla <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedDetailId}
                onChange={(e) => setSelectedDetailId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              >
                <option value="">Seleccionar producto...</option>
                {selectedOrder.details.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.product_name || 'Producto'} · Talla {d.size} ({d.amount} pares)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDetail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Cantidad (máx. {maxQuantity}) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Package2 size={14} />
                  {selectedDetail.brand_name} · {selectedDetail.category_name} · Talla {selectedDetail.size}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Descripción del defecto <span className="text-red-600">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ej: el par derecho tiene la suela despegada"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              placeholder="Información adicional para el jefe"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setReportOpen(false)}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-sm font-bold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm font-bold disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Enviar reclamo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
