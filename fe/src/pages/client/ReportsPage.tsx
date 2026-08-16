import { useState, useEffect } from 'react';
import { BarChart3, ShoppingBag, Clock, Zap, CheckCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getMyOrdersSummary, type ClientOrderSummaryResponse } from '@/services/clientApi';
import StatCard from '@/features/admin/components/atoms/StatCard';

const ORDER = ['pendiente', 'en_progreso', 'completado', 'entregado', 'cancelado'] as const;

const STATE_CONFIG: Record<(typeof ORDER)[number], { label: string; color: string; bar: string; icon: typeof Clock }> = {
  pendiente: { label: 'Pendientes', color: 'text-gray-600 dark:text-gray-300', bar: 'bg-gray-400 dark:bg-gray-500', icon: Clock },
  en_progreso: { label: 'En Progreso', color: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', icon: Zap },
  completado: { label: 'Completados', color: 'text-green-600 dark:text-green-400', bar: 'bg-green-500', icon: CheckCircle },
  entregado: { label: 'Entregados', color: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500', icon: CheckCircle2 },
  cancelado: { label: 'Cancelados', color: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', icon: XCircle },
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<ClientOrderSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrdersSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const maxCount = Math.max(1, ...(summary ? ORDER.map((s) => summary.by_state[s] || 0) : [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Reportes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Estado de tus pedidos en Calzado J&R
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600 dark:text-violet-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando reporte...</p>
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {ORDER.map((state) => {
              const cfg = STATE_CONFIG[state];
              const count = summary.by_state[state] || 0;
              return (
                <StatCard
                  key={state}
                  label={cfg.label}
                  value={loading ? '--' : count}
                  icon={<cfg.icon size={28} />}
                  color={
                    state === 'pendiente' ? 'yellow'
                      : state === 'en_progreso' ? 'blue'
                      : state === 'completado' ? 'green'
                      : state === 'entregado' ? 'purple'
                      : 'red'
                  }
                />
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white transition-colors">
                Resumen por estado
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {summary.total === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 font-bold">Aún no tienes pedidos</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Cuando realices pedidos, aquí verás el resumen por estado.
                  </p>
                </div>
              ) : (
                ORDER.map((state) => {
                  const cfg = STATE_CONFIG[state];
                  const count = summary.by_state[state] || 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={state} className="flex items-center gap-4">
                      <div className={`w-28 shrink-0 text-sm font-bold ${cfg.color}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <cfg.icon size={14} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar} transition-all duration-700 animate-in fade-in`}
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-black text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  );
                })
              )}

              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Total de pedidos
                </span>
                <span className="inline-flex items-center gap-2 font-black text-lg text-gray-900 dark:text-white">
                  <ShoppingBag size={18} className="text-violet-600 dark:text-violet-400" />
                  {summary.total}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No se pudieron cargar los reportes. Intenta de nuevo más tarde.
          </p>
        </div>
      )}
    </div>
  );
}