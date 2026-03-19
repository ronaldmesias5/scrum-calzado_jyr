import { ShoppingBag, Zap, CheckCircle, UserCheck } from 'lucide-react';
import type { Metric } from '../../types/dashboard';

const CARD_CONFIG = [
  { icon: ShoppingBag, iconColor: 'text-orange-500', bgColor: 'bg-orange-50'  },
  { icon: Zap,         iconColor: 'text-blue-500',   bgColor: 'bg-blue-50'    },
  { icon: CheckCircle, iconColor: 'text-green-600',  bgColor: 'bg-green-50'   },
  { icon: UserCheck,   iconColor: 'text-purple-600', bgColor: 'bg-purple-50'  },
];

interface Props {
  metrics: Metric[];
}

export default function MetricsCards({ metrics }: Props) {
  const cards = metrics.length > 0 ? metrics : CARD_CONFIG.map((_, i) => ({
    label: ['Pedidos Pendientes', 'En Producción', 'Pedidos Completados', 'Usuarios por Validar'][i],
    value: '—',
  } as Metric));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((m, i) => {
        const { icon: Icon, iconColor, bgColor } = CARD_CONFIG[i] ?? CARD_CONFIG[0];
        return (
          <div
            key={m.label}
            className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${bgColor}`}>
                <Icon size={20} className={iconColor} />
              </div>
              {m.change && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.changePositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}>
                  {m.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 leading-tight">{m.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{m.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
