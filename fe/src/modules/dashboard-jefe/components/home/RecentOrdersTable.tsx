import { ArrowRight } from 'lucide-react';
import type { RecentOrder } from '../../types/dashboard';
import { StatusBadge } from '../StatusBadgeComponent';

interface Props {
  orders: RecentOrder[];
  onViewAll?: () => void;
}

export default function RecentOrdersTable({ orders, onViewAll }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white transition-colors duration-500">Pedidos Recientes</h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight size={14} />
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay pedidos aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors">
                <th className="text-left px-3 py-2 font-medium rounded-l-lg">ID Pedido</th>
                <th className="text-left px-3 py-2 font-medium">Cliente</th>
                <th className="text-left px-3 py-2 font-medium">Pares</th>
                <th className="text-left px-3 py-2 font-medium">Estado</th>
                <th className="text-left px-3 py-2 font-medium rounded-r-lg">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-3 font-mono font-semibold text-gray-900 dark:text-gray-200">
                    #{order.orderId.substring(0, 8)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{order.clientName}</td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{order.quantity}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
