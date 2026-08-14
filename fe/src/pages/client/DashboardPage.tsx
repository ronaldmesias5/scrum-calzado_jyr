import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Clock, CheckCircle2, Package2, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyOrders, type ClientOrder } from '@/services/clientApi';
import StatCard from '@/features/admin/components/atoms/StatCard';

const DEFAULT_STATUS = {
  label: 'Pendiente',
  badge: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
  icon: Clock,
};

const STATUS_MAP: Record<string, { label: string; badge: string; icon: typeof Clock }> = {
  pendiente: DEFAULT_STATUS,
  en_progreso: {
    label: 'En Progreso',
    badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    icon: Zap,
  },
  completado: {
    label: 'Completado',
    badge: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50',
    icon: CheckCircle,
  },
  entregado: {
    label: 'Entregado',
    badge: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
    icon: CheckCircle2,
  },
};

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
    { label: 'Total pedidos', value: loading ? '--' : totalOrders, icon: <ShoppingBag size={28} />, color: 'blue' },
    { label: 'Pendientes', value: loading ? '--' : pendingOrders, icon: <Clock size={28} />, color: 'yellow' },
    { label: 'Entregados', value: loading ? '--' : completedOrders, icon: <CheckCircle2 size={28} />, color: 'green' },
    { label: 'Pares totales', value: loading ? '--' : totalPairs, icon: <Package2 size={28} />, color: 'purple' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Home className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Panel de Cliente
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Bienvenido, {user?.name || 'Cliente'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            color={m.color}
          />
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white transition-colors">Últimos pedidos</h2>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Package2 size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-lg">No tienes pedidos aún</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Los pedidos que realice el equipo J&R aparecerán aquí</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pares</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {orders.slice(0, 5).map((order) => {
                  const status = STATUS_MAP[order.state] || DEFAULT_STATUS;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(order.creation_date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                          {order.total_pairs}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${status.badge}`}>
                          <status.icon size={14} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
