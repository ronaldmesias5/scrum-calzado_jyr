import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Package2, ArrowRight, Search } from 'lucide-react';
import { getMyOrders, getMyOrderDetail, type ClientOrder } from '@/services/clientApi';
import { resolveImageUrl } from '@/services/wholesaleCatalogApi';
import Modal from '@/components/atoms/Modal';
import Pagination from '@/components/atoms/Pagination';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' },
  en_progreso: { label: 'En Progreso', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  completado: { label: 'Completado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  entregado: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const DEFAULT_STATUS: { label: string; color: string } = {
  label: 'Pendiente',
  color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const loadOrders = () => {
      setLoading(true);
      getMyOrders(page, pageSize)
        .then((data) => {
          setOrders(data.items);
          setTotalPages(data.total_pages);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    loadOrders();
    window.addEventListener('orders-updated', loadOrders);
    return () => window.removeEventListener('orders-updated', loadOrders);
  }, [page]);

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()),
  );

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

  const groupedProducts = useMemo(() => {
    if (!selectedOrder) return [];
    const map = new Map<string, {
      product_id: string;
      product_name: string | null;
      brand_name: string | null;
      category_name: string | null;
      image_url: string | null;
      total: number;
      sizes: { size: string; amount: number; colour: string | null }[];
      observations: string[];
    }>();
    for (const d of selectedOrder.details) {
      const group = map.get(d.product_id) ?? {
        product_id: d.product_id,
        product_name: d.product_name,
        brand_name: d.brand_name,
        category_name: d.category_name,
        image_url: d.image_url,
        total: 0,
        sizes: [],
        observations: [],
      };
      group.total += d.amount;
      group.sizes.push({ size: d.size, amount: d.amount, colour: d.colour });
      if (d.observations && !group.observations.includes(d.observations)) {
        group.observations.push(d.observations);
      }
      map.set(d.product_id, group);
    }
    return [...map.values()].map((g) => ({
      ...g,
      sizes: g.sizes.sort((a, b) => Number(a.size) - Number(b.size)),
    }));
  }, [selectedOrder]);

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
        ) : filtered.length === 0 ? (
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
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filtered.map((order) => {
                  const status = STATUS_MAP[order.state] || DEFAULT_STATUS;
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
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-95 shadow-sm"
                          title="Ver detalle"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${(STATUS_MAP[selectedOrder.state] || DEFAULT_STATUS).color}`}>
                  {(STATUS_MAP[selectedOrder.state] || DEFAULT_STATUS).label}
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
              <div className="space-y-3">
                {groupedProducts.map((group) => (
                  <div key={group.product_id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {group.image_url ? (
                        <img
                          src={resolveImageUrl(group.image_url)}
                          alt={group.product_name || 'Imagen del producto'}
                          className="h-12 w-12 shrink-0 rounded-lg object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800">
                          <Package2 size={18} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{group.product_name || 'Producto'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {[group.brand_name, group.category_name].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                        {group.total} pares
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.sizes.map((s) => (
                        <span
                          key={`${group.product_id}-${s.size}-${s.colour ?? ''}`}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                        >
                          Talla {s.size}: <span className="font-bold text-blue-600 dark:text-blue-400">{s.amount}</span>
                        </span>
                      ))}
                    </div>
                    {group.observations.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {group.observations.map((obs, i) => (
                          <p
                            key={i}
                            className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
                          >
                            <span className="font-bold">Nota: </span>
                            {obs}
                          </p>
                        ))}
                      </div>
                    )}
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
