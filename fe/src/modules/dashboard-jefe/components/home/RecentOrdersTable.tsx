import { ArrowRight } from 'lucide-react';
import type { RecentOrder } from '../../types/dashboard';

const statusLabel: Record<RecentOrder['status'], string> = {
  pending: 'Pendiente',
  in_production: 'En Producción',
  ready: 'Listo',
  delivered: 'Entregado',
};

const statusClass: Record<RecentOrder['status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_production: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-green-200 text-green-800',
};

interface Props {
  orders: RecentOrder[];
}

export default function RecentOrdersTable({ orders }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Pedidos Recientes</h2>
        <button className="text-sm text-blue-700 hover:underline flex items-center gap-1">
          Ver todos <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left px-3 py-2 font-medium rounded-l-lg">ID Pedido</th>
              <th className="text-left px-3 py-2 font-medium">Cliente</th>
              <th className="text-left px-3 py-2 font-medium">Cantidad</th>
              <th className="text-left px-3 py-2 font-medium">Estado</th>
              <th className="text-left px-3 py-2 font-medium rounded-r-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 font-medium text-gray-900">{order.orderId}</td>
                <td className="px-3 py-3 text-gray-700">{order.clientName}</td>
                <td className="px-3 py-3 text-gray-700">{order.quantity}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
