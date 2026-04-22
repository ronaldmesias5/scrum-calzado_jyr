import { ShoppingBag, Zap, CheckCircle, UserCheck } from 'lucide-react';
import type { Metric } from '../../types/dashboard';

const CARD_CONFIG = [
  { icon: ShoppingBag, iconColor: 'text-orange-500 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20'  },
  { icon: Zap,         iconColor: 'text-blue-500 dark:text-blue-400',     bgColor: 'bg-blue-50 dark:bg-blue-900/20'    },
  { icon: CheckCircle, iconColor: 'text-green-600 dark:text-green-400',   bgColor: 'bg-green-50 dark:bg-green-900/20'   },
  { icon: UserCheck,   iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20'  },
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
        const config = CARD_CONFIG[i % CARD_CONFIG.length]!;
        const { icon: Icon, iconColor, bgColor } = config;
        return (
          <div
            key={m.label}
            className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${bgColor}`}>
                <Icon size={20} className={iconColor} />
              </div>
              {m.change && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.changePositive ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                }`}>
                  {m.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white leading-tight transition-colors duration-500">{m.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{m.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
