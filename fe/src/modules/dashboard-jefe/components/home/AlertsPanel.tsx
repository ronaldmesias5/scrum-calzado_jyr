import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';
import type { Alert } from '../../types/dashboard';

const config: Record<string, { icon: any; color: string; bg: string }> = {
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
};

interface Props {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 w-full xl:w-80 transition-all duration-300">
      <h2 className="font-bold text-gray-900 dark:text-white mb-4 transition-colors">⚠ Alertas</h2>
      <div className="flex flex-col gap-2">
        {alerts.map((alert) => {
          const conf = config[alert.type] || config.info;
          const Icon = conf!.icon;
          const color = conf!.color;
          const bg = conf!.bg;
          return (
            <div key={alert.id} className="flex gap-3 items-start border-b border-gray-50 dark:border-slate-800 pb-3 last:border-0 last:pb-0 transition-colors">
              <div className={`p-1.5 rounded-full ${bg} dark:bg-slate-800/80 mt-0.5 flex-shrink-0`}>
                <Icon size={14} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{alert.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{alert.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{alert.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button className="mt-4 w-full text-sm font-semibold text-center border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200">
        Ver todas las alertas
      </button>
    </div>
  );
}
