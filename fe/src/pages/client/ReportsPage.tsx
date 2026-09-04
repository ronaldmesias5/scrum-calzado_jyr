import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  ShoppingBag,
  Clock,
  Zap,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import {
  getMyOrdersSummary,
  getAllMyOrders,
  type ClientOrderSummaryResponse,
  type ClientAllOrdersReport
} from '@/services/clientApi';
import { exportMyOrdersPDF } from '@/features/client/utils/reportsUtils';
import { useAuth } from '@/hooks/useAuth';
import CategoryFilter from '@/components/atoms/CategoryFilter';
import StatCard from '@/features/admin/components/atoms/StatCard';

const ORDER_STATES = [
  'pendiente',
  'en_progreso',
  'completado',
  'entregado',
  'cancelado'
] as const;

const STATE_CONFIG: Record<
  (typeof ORDER_STATES)[number],
  { label: string; color: string; bar: string; icon: typeof Clock }
> = {
  pendiente: {
    label: 'Pendientes',
    color: 'text-gray-600 dark:text-gray-300',
    bar: 'bg-gray-400 dark:bg-gray-500',
    icon: Clock
  },
  en_progreso: {
    label: 'En Progreso',
    color: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    icon: Zap
  },
  completado: {
    label: 'Completados',
    color: 'text-green-600 dark:text-green-400',
    bar: 'bg-green-500',
    icon: CheckCircle
  },
  entregado: {
    label: 'Entregados',
    color: 'text-purple-600 dark:text-purple-400',
    bar: 'bg-purple-500',
    icon: CheckCircle2
  },
  cancelado: {
    label: 'Cancelados',
    color: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    icon: XCircle
  }
};

type TabType = 'summary' | 'generator';

export default function ReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>('summary');
  const [summary, setSummary] = useState<ClientOrderSummaryResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [reportData, setReportData] = useState<ClientAllOrdersReport | null>(
    null
  );
  const [reportLoading, setReportLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month' | 'custom'
  >('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<
    'all' | (typeof ORDER_STATES)[number]
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (reportData?.name) return reportData.name;
    if (user) return `${user.name} ${user.last_name}`.trim();
    return '';
  }, [reportData, user]);

  useEffect(() => {
    getMyOrdersSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const maxCount = Math.max(
    1,
    ...(summary ? ORDER_STATES.map((s) => summary.by_state[s] || 0) : [1])
  );

  const getDateRange = (
    filter?: typeof dateFilter
  ): { start?: string; end?: string } => {
    const f = filter ?? dateFilter;
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    switch (f) {
      case 'today':
        return { start: fmt(now), end: fmt(now) };
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: fmt(weekAgo), end: fmt(now) };
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: fmt(monthAgo), end: fmt(now) };
      }
      case 'custom':
        return { start: startDate || undefined, end: endDate || undefined };
      default:
        return {};
    }
  };

  const loadReport = async (filter?: typeof dateFilter) => {
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      const range = getDateRange(filter);
      const data = await getAllMyOrders(range.start, range.end, categoryFilter ?? undefined);
      setReportData(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setReportError(
        `No se pudieron cargar los datos del reporte: ${errorMsg}`
      );
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter !== 'custom') {
      loadReport(dateFilter);
    }
    setStateFilter('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  useEffect(() => {
    if (reportData) {
      loadReport(dateFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const filteredOrders = useMemo(() => {
    if (!reportData) return [];
    if (stateFilter === 'all') return reportData.orders;
    return reportData.orders.filter((o) => o.state === stateFilter);
  }, [reportData, stateFilter]);

  const filteredTotalPairs = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.total_pairs, 0),
    [filteredOrders]
  );

  const handleGeneratePdf = async () => {
    if (!reportData) return;
    setGeneratingPdf(true);
    try {
      const range = getDateRange();
      const filtered =
        stateFilter === 'all'
          ? reportData
          : {
              ...reportData,
              orders: filteredOrders,
              total_orders: filteredOrders.length,
              total_pairs: filteredTotalPairs
            };
      await exportMyOrdersPDF(filtered, range.start, range.end);
    } catch {
      setReportError('Error al generar el PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Reportes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Resumen y generador de reportes de tus pedidos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 pb-0">
        <button
          onClick={() => setTab('summary')}
          className={`px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors ${
            tab === 'summary'
              ? 'bg-violet-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1.5" />
          Resumen
        </button>
        <button
          onClick={() => setTab('generator')}
          className={`px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors ${
            tab === 'generator'
              ? 'bg-violet-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          Generador de Reportes
        </button>
      </div>

      {/* Tab: Summary */}
      {tab === 'summary' &&
        (loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600 dark:text-violet-400" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Cargando reporte...
            </p>
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {ORDER_STATES.map((state) => {
                const cfg = STATE_CONFIG[state];
                const count = summary.by_state[state] || 0;
                return (
                  <StatCard
                    key={state}
                    label={cfg.label}
                    value={count}
                    icon={<cfg.icon size={28} />}
                    color={
                      state === 'pendiente'
                        ? 'yellow'
                        : state === 'en_progreso'
                          ? 'blue'
                          : state === 'completado'
                            ? 'green'
                            : state === 'entregado'
                              ? 'purple'
                              : 'red'
                    }
                  />
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Resumen por estado
                </h2>
              </div>
              <div className="p-6 space-y-5">
                {summary.total === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 font-bold">
                      Aún no tienes pedidos
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Cuando realices pedidos, aquí verás el resumen por estado.
                    </p>
                  </div>
                ) : (
                  ORDER_STATES.map((state) => {
                    const cfg = STATE_CONFIG[state];
                    const count = summary.by_state[state] || 0;
                    if (count === 0) return null;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={state} className="flex items-center gap-4">
                        <div
                          className={`w-28 shrink-0 text-sm font-bold ${cfg.color}`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <cfg.icon size={14} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
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
                    <ShoppingBag
                      size={18}
                      className="text-violet-600 dark:text-violet-400"
                    />
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
        ))}

      {/* Tab: Generator */}
      {tab === 'generator' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Filtro de Fechas
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all' as const, label: 'Todos' },
                { value: 'today' as const, label: 'Hoy' },
                { value: 'week' as const, label: 'Última Semana' },
                { value: 'month' as const, label: 'Último Mes' },
                { value: 'custom' as const, label: 'Personalizado' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    dateFilter === opt.value
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {dateFilter === 'custom' && (
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Desde:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hasta:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
            {dateFilter === 'custom' && startDate && endDate && (
              <button
                onClick={() => loadReport()}
                disabled={reportLoading}
                className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
              >
                {reportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                {reportLoading ? 'Cargando...' : 'Generar Reporte'}
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
            <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
          </div>

          {/* Report Error */}
          {reportError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-sm text-red-800 dark:text-red-300 font-medium">
              {reportError}
            </div>
          )}

          {/* Report Results */}
          {reportData && (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Resultado del Reporte
                </h2>
                <button
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
                >
                  {generatingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {generatingPdf ? 'Generando...' : 'Exportar PDF'}
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800/50">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      Total Pedidos
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      {filteredOrders.length}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/50">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                      Total Pares
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      {filteredTotalPairs}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Cliente
                    </p>
                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1 truncate">
                      {displayName}
                    </p>
                  </div>
                </div>

                {/* State Filter Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => setStateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      stateFilter === 'all'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todos ({reportData.orders.length})
                  </button>
                  {ORDER_STATES.map((state) => {
                    const cfg = STATE_CONFIG[state];
                    const count = reportData.orders.filter(
                      (o) => o.state === state
                    ).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={state}
                        onClick={() => setStateFilter(state)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                          stateFilter === state
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <cfg.icon size={12} />
                        {cfg.label} ({count})
                      </button>
                    );
                  })}

                  </div>

                {/* Orders Table */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 font-bold">
                      No hay pedidos en este período
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800">
                          <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            ID
                          </th>
                          <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Fecha
                          </th>
                          <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Producto
                          </th>
                          <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Categoría
                          </th>
                          <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Color
                          </th>
                          <th className="text-center py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Cant.
                          </th>
                          <th className="text-center py-3 px-4 font-bold text-gray-600 dark:text-gray-400">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) =>
                          order.items.map((item, idx) => (
                            <tr
                              key={`${order.id}-${idx}`}
                              className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono text-xs text-gray-500">
                                {idx === 0
                                  ? order.id.substring(0, 8) + '...'
                                  : ''}
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                {idx === 0
                                  ? new Date(
                                      order.created_at
                                    ).toLocaleDateString('es-CO')
                                  : ''}
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                {item.product_name}
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                {item.category_name || '—'}
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                {item.colour || '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">
                                {item.amount}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {idx === 0 && (
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                      order.state === 'entregado'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : order.state === 'completado'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : order.state === 'en_progreso'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : order.state === 'cancelado'
                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                                  >
                                    {order.state === 'pendiente'
                                      ? 'Pendiente'
                                      : order.state === 'en_progreso'
                                        ? 'En Progreso'
                                        : order.state === 'completado'
                                          ? 'Completado'
                                          : order.state === 'entregado'
                                            ? 'Entregado'
                                            : order.state === 'cancelado'
                                              ? 'Cancelado'
                                              : order.state}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
