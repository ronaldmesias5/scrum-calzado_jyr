import { useEffect, useState } from 'react';
import {
  Home, CheckSquare, Clock, CheckCircle2, AlertTriangle, Package,
} from 'lucide-react';
import { getEmployeeMetrics, getEmployeeTasks } from '../services/employeeApi';
import type { EmployeeMetric, EmployeeTask } from '../types/employee';

const CARD_CONFIG: Record<string, {
  icon: typeof CheckSquare;
  textColor: string;
  bgColor: string;
}> = {
  tasks:   { icon: CheckSquare,   textColor: 'text-blue-600 dark:text-blue-400',     bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  clock:   { icon: Clock,         textColor: 'text-orange-600 dark:text-orange-400',  bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  check:   { icon: CheckCircle2,  textColor: 'text-green-600 dark:text-green-400',   bgColor: 'bg-green-100 dark:bg-green-900/30' },
  alert:   { icon: AlertTriangle, textColor: 'text-red-600 dark:text-red-400',       bgColor: 'bg-red-100 dark:bg-red-900/30' },
  package: { icon: Package,       textColor: 'text-purple-600 dark:text-purple-400',  bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
};

const DEFAULT_CARD = { icon: CheckSquare, textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };

const VALUE_COLORS: Record<string, string> = {
  tasks:   'text-blue-600 dark:text-blue-400',
  clock:   'text-orange-600 dark:text-orange-400',
  check:   'text-green-600 dark:text-green-400',
  alert:   'text-red-600 dark:text-red-400',
  package: 'text-purple-600 dark:text-purple-400',
};

const DEFAULT_VALUE_COLOR = 'text-blue-600 dark:text-blue-400';

export default function EmployeeDashboardPage() {
  const [metrics, setMetrics] = useState<EmployeeMetric[]>([]);
  const [recentTasks, setRecentTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEmployeeMetrics(),
      getEmployeeTasks(),
    ]).then(([metricsRes, tasksRes]) => {
      setMetrics(metricsRes.metrics);
      setRecentTasks(tasksRes.tasks.slice(0, 8));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 stagger-reveal">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Home className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Mi Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Resumen de tus tareas y producción
          </p>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-reveal">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            ))
          : metrics.map((metric, i) => {
              const iconCfg = CARD_CONFIG[metric.icon] || DEFAULT_CARD;
              const valueColor = VALUE_COLORS[metric.icon] || DEFAULT_VALUE_COLOR;
              const Icon = iconCfg.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {metric.label}
                      </p>
                      <p className={`text-4xl font-bold ${valueColor} transition-colors duration-500`}>
                        {metric.value}
                      </p>
                    </div>
                    <div className={`${iconCfg.bgColor} p-3 rounded-xl border border-transparent dark:border-white/5 transition-all shadow-sm`}>
                      <Icon className={`w-6 h-6 ${iconCfg.textColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* TAREAS RECIENTES */}
      <div className="stagger-reveal">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Tareas Recientes
        </h2>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <CheckSquare size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">Sin tareas asignadas</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Aún no tienes tareas asignadas.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vale</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pares</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2 font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        #{task.vale_number ?? '-'}
                      </td>
                      <td className="px-4 py-2 font-bold text-gray-900 dark:text-white transition-colors">
                        {task.product_name ?? '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold rounded capitalize">
                          {task.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          task.status === 'completado'
                            ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                            : task.status === 'en_progreso'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                            : task.status === 'cancelado'
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                            : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
                        }`}>
                          {task.status === 'completado' ? 'Completado'
                            : task.status === 'en_progreso' ? 'En Progreso'
                            : task.status === 'cancelado' ? 'Cancelado'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                          {task.amount}
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
    </div>
  );
}
