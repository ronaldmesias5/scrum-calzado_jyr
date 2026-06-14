import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, TrendingUp,
  Loader2, AlertCircle, FileText,
  Share2, ChevronRight, Download, Calendar,
} from 'lucide-react';
import {
  getMyPerformance,
  getSharedReports,
  getSharedReportDetail,
  getMyTasksReport,
  type MyPerformanceResponse,
  type SharedReportItem,
  type SharedReportListResponse,
  type MyTasksReportResponse,
} from '../services/employeeApi';
import { exportMyTasksPDF, exportPerformancePDF } from '../utils/reportsUtils';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const PROCESS_DISPLAY: Record<string, string> = {
  corte: 'Corte',
  guarnicion: 'Guarnición',
  soladura: 'Soladura',
  emplantillado: 'Emplantillado',
};

function getProcessColor(processName: string) {
  const colors: Record<string, { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string }> = {
    corte:        { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/20', darkBorder: 'dark:border-amber-800/30', darkText: 'dark:text-amber-400' },
    guarnicion:   { bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-700',  darkBg: 'dark:bg-blue-900/20',  darkBorder: 'dark:border-blue-800/30',  darkText: 'dark:text-blue-400' },
    soladura:     { bg: 'bg-purple-50',border: 'border-purple-100',text: 'text-purple-700',darkBg: 'dark:bg-purple-900/20',darkBorder: 'dark:border-purple-800/30',darkText: 'dark:text-purple-400' },
    emplantillado:{ bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/20', darkBorder: 'dark:border-green-800/30', darkText: 'dark:text-green-400' },
  };
  return colors[processName] ?? { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-800/50', darkBorder: 'dark:border-gray-700', darkText: 'dark:text-gray-400' };
}

export default function EmployeeReportsPage() {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<MyPerformanceResponse | null>(null);
  const [shared, setShared] = useState<SharedReportItem[]>([]);
  const [selectedShare, setSelectedShare] = useState<{
    id: string;
    title: string;
    message: string | null;
    parameters: Record<string, unknown>;
    created_at: string | null;
  } | null>(null);
  const [sharePdfGenerating, setSharePdfGenerating] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Reporte detallado state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [tasksReport, setTasksReport] = useState<MyTasksReportResponse | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (customStart && customEnd) {
      return {
        start: new Date(customStart).toISOString(),
        end: new Date(customEnd + 'T23:59:59').toISOString(),
      };
    }
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start: today.toISOString(), end: now.toISOString() };
  }, [customStart, customEnd]);

  // Cargar datos iniciales
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [perf, shr] = await Promise.all([
          getMyPerformance(),
          getSharedReports(),
        ]);
        setPerformance(perf);
        setShared(shr.reports);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Polling en tiempo real para reportes compartidos (cada 30s)
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const shr: SharedReportListResponse = await getSharedReports();
        if (mounted) setShared(shr.reports);
      } catch {
        // silent
      }
    }, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Cargar reporte detallado al cambiar período
  useEffect(() => {
    async function loadTasks() {
      if (!performance) return;
      setTasksLoading(true);
      try {
        const { start, end } = getDateRange();
        const report = await getMyTasksReport({ start_date: start, end_date: end });
        setTasksReport(report);
      } catch (e) {
        console.error(e);
        setTasksReport(null);
      } finally {
        setTasksLoading(false);
      }
    }
    loadTasks();
  }, [performance, customStart, customEnd, getDateRange]);

  const handleViewShare = async (id: string) => {
    try {
      const detail = await getSharedReportDetail(id);
      setSelectedShare({
        id: detail.id,
        title: detail.report_title,
        message: detail.message,
        parameters: detail.parameters,
        created_at: detail.created_at,
      });
      const shr = await getSharedReports();
      setShared(shr.reports);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!tasksReport) return;
    setPdfGenerating(true);
    try {
      const { start, end } = getDateRange();
      await exportMyTasksPDF(
        tasksReport,
        tasksReport.tasks_list,
        `Reporte de Tareas - ${tasksReport.name}`,
        start,
        end,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadSharePDF = async () => {
    if (!selectedShare) return;
    setSharePdfGenerating(true);
    setShareError(null);

    const params = selectedShare.parameters as Record<string, string | undefined>;
    const startDate = params?.start_date;
    const endDate = params?.end_date;

    let report: MyTasksReportResponse;
    try {
      report = await getMyTasksReport({
        start_date: startDate,
        end_date: endDate,
      });
    } catch {
      setShareError('Error al consultar tus tareas. Verifica tu conexión e intenta de nuevo.');
      setSharePdfGenerating(false);
      return;
    }

    if (report.tasks_list.length === 0) {
      setShareError('No hay tareas completadas en el período de este reporte compartido.');
      setSharePdfGenerating(false);
      return;
    }

    try {
      await exportMyTasksPDF(
        report,
        report.tasks_list,
        `Reporte Compartido - ${selectedShare.title}`,
        startDate,
        endDate,
      );
    } catch (e) {
      setShareError('Error al generar el PDF. Intenta de nuevo.');
      console.error(e);
    } finally {
      setSharePdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tu rendimiento y reportes compartidos</p>
        </div>
      </div>

      {/* Mi Rendimiento */}
      {performance && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mi Rendimiento</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500">{performance.name}</span>
              <Button
                onClick={() => exportPerformancePDF(performance)}
                className="text-sm font-bold py-2"
              >
                <Download className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800/30">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Tareas Completadas</p>
              <p className="text-3xl font-extrabold text-green-700 dark:text-green-400">{performance.total_tasks_completed}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Pares Producidos</p>
              <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">{performance.total_pairs_produced}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Ganancias Totales</p>
              <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">${performance.total_earnings.toLocaleString()}</p>
            </div>
          </div>

          {/* Breakdown */}
          {performance.tasks_breakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Desglose por Proceso</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {performance.tasks_breakdown.map((b) => (
                  <div key={b.process_name} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{b.process_name}</p>
                    <p className="text-xl font-extrabold text-gray-900 dark:text-white">{b.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte Detallado de Tareas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reporte Detallado de Tareas</h2>
        </div>

        {/* Filtro de fecha */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Desde</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hasta</label>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-purple-500"
            />
          </div>
          <p className="text-xs font-medium text-gray-500 mt-4">
            {customStart && customEnd ? 'El reporte se actualizará automáticamente.' : 'Deja vacío para usar la fecha de hoy.'}
          </p>
        </div>

        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : !tasksReport || tasksReport.tasks_list.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No hay tareas en este período</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Las tareas completadas aparecerán aquí</p>
          </div>
        ) : (
          <>
            {/* Desglose por proceso — Tarjetas con color (opción 3) */}
            {tasksReport.tasks_breakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Desglose por Proceso</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tasksReport.tasks_breakdown.map(b => {
                    const c = getProcessColor(b.process_name);
                    const label = PROCESS_DISPLAY[b.process_name] || b.process_name;
                    return (
                      <div key={b.process_name} className={`${c.bg} ${c.darkBg} rounded-2xl p-4 border ${c.border} ${c.darkBorder} text-center`}>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                        <p className={`text-3xl font-extrabold ${c.text} ${c.darkText}`}>{b.count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabla de tareas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Detalle de Tareas
                </h3>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={pdfGenerating}
                  className="text-sm font-bold py-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {pdfGenerating ? 'Generando...' : 'Descargar PDF'}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nº Vale</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proceso</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</th>
                      <th className="text-center py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cant.</th>
                      <th className="text-center py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                      <th className="text-right py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksReport.tasks_list
                      .sort((a, b) => (a.vale_number ?? Infinity) - (b.vale_number ?? Infinity))
                      .map(task => (
                        <tr key={task.id} className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                            {task.vale_number != null ? `#${task.vale_number}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                              {PROCESS_DISPLAY[task.process_name] || task.process_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{task.product_name}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{task.colour || '—'}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">{task.amount}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              task.status === 'pagado'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {task.status === 'pagado' ? 'Pagado' : 'Completado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                            {task.completed_at ? new Date(task.completed_at).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                            ${task.task_total_price.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-slate-800/50">
                      <td colSpan={7} className="py-3 px-4 text-right font-black text-gray-500 uppercase text-xs">Total</td>
                      <td className="py-3 px-4 text-right font-black text-amber-700 dark:text-amber-400">
                        ${tasksReport.total_earnings.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Compartidos por el Jefe */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Compartidos por el Jefe</h2>
        </div>

        {shared.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No tienes reportes compartidos</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Los reportes que el jefe comparta contigo aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shared.map((r) => (
              <button
                key={r.id}
                onClick={() => handleViewShare(r.id)}
                className="w-full text-left flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-sm transition-all bg-white dark:bg-slate-900"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.is_read ? 'bg-gray-100 dark:bg-slate-800' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                  {r.is_read ? (
                    <FileText className="w-5 h-5 text-gray-400" />
                  ) : (
                    <div className="relative">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-600 rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${r.is_read ? 'font-medium text-gray-600 dark:text-gray-400' : 'font-bold text-gray-900 dark:text-white'}`}>
                    {r.report_title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {r.shared_by_name && `por ${r.shared_by_name} · `}
                    {r.created_at && new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle reporte compartido */}
      <Modal isOpen={!!selectedShare} onClose={() => { setSelectedShare(null); setShareError(null); }} title="Reporte Compartido" size="md">
        {selectedShare && (
          <div className="p-6 space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedShare.title}</p>
              {selectedShare.created_at && (
                <p className="text-xs text-gray-500 mt-1">{new Date(selectedShare.created_at).toLocaleString()}</p>
              )}
            </div>
            {selectedShare.message && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Mensaje:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 rounded-xl p-3">{selectedShare.message}</p>
              </div>
            )}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Este reporte fue generado y compartido por el jefe. Puedes descargar tu reporte de producción con las mismas fechas.
              </p>
            </div>
            {shareError && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {shareError}
                </p>
              </div>
            )}
            <Button
              onClick={handleDownloadSharePDF}
              disabled={sharePdfGenerating}
              className="w-full font-bold py-3"
            >
              {sharePdfGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              ) : (
                <Download className="w-4 h-4 mr-2 inline" />
              )}
              {sharePdfGenerating ? 'Generando PDF...' : 'Descargar mi Reporte de Producción'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
