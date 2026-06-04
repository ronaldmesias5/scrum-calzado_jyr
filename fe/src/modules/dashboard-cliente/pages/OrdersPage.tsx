import { useState, useEffect } from 'react';
import { ShoppingBag, Package2, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getMyOrders, getMyOrderDetail, type ClientOrder } from '../services/clientApi';
import Modal from '@/components/ui/Modal';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' },
  en_progreso: { label: 'En Progreso', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  completado: { label: 'Completado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  entregado: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    getMyOrders()
      .then((data) => setOrders(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const detail = await getMyOrderDetail(orderId);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            Mis Pedidos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Consulta el estado de tus pedidos</p>
        </div>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          placeholder="Buscar por ID de pedido..."
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Package2 size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">No hay pedidos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">N° Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Pares</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {paginated.map((order) => {
                  const status = STATUS_MAP[order.state] || STATUS_MAP.pendiente;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {new Date(order.creation_date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{order.total_pairs}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl disabled:opacity-40 transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl disabled:opacity-40 transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Pedido #${selectedOrder?.id.slice(0, 8) || ''}`}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedOrder ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Estado</p>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${(STATUS_MAP[selectedOrder.state] || STATUS_MAP.pendiente).color}`}>
                  {(STATUS_MAP[selectedOrder.state] || STATUS_MAP.pendiente).label}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Total pares</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{selectedOrder.total_pairs}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Fecha creación</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {new Date(selectedOrder.creation_date).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Fecha entrega</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedOrder.delivery_date
                    ? new Date(selectedOrder.delivery_date).toLocaleDateString('es-CO')
                    : 'Por definir'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Productos</h3>
              <div className="space-y-2">
                {selectedOrder.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d.image_url ? (
                        <img src={d.image_url} alt={d.product_name || ''} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <Package2 size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{d.product_name || 'Producto'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {d.brand_name} · {d.category_name} · Talla {d.size}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{d.amount} pares</p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${(STATUS_MAP[d.state] || STATUS_MAP.pendiente).color}`}>
                        {(STATUS_MAP[d.state] || STATUS_MAP.pendiente).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
