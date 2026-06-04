import { useState, useEffect } from 'react';
import { Package2, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyOrders, type ClientOrder } from '../services/clientApi';

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((data) => setOrders(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.state === 'pendiente').length;
  const completedOrders = orders.filter((o) => o.state === 'entregado').length;
  const totalPairs = orders.reduce((sum, o) => sum + o.total_pairs, 0);

  const metrics = [
    { label: 'Total pedidos', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Pendientes', value: pendingOrders, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Entregados', value: completedOrders, icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Pares totales', value: totalPairs, icon: Package2, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-blue-600" />
          Panel de Cliente
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Bienvenido, {user?.name || 'Cliente'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{m.label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                <m.icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {loading ? <span className="animate-pulse">--</span> : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Últimos pedidos</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Package2 size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-bold">No tienes pedidos aún</p>
            <p className="text-sm">Los pedidos que realice el equipo J&R aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Pares</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(order.creation_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{order.total_pairs}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        order.state === 'entregado' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        order.state === 'completado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        order.state === 'en_progreso' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {order.state === 'entregado' ? 'Entregado' :
                         order.state === 'completado' ? 'Completado' :
                         order.state === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
