import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  XCircle, Package, Scissors, PenTool, Hammer, Sparkles,
  User, Loader2, AlertCircle, CheckCircle, CheckCircle2,
} from 'lucide-react';
import { getTaskVale, updateEmployeeTaskStatus } from '../services/employeeApi';
import type { ValeResponse } from '../types/employee';

interface Props {
  taskId: string;
  onClose: () => void;
}

const STAGES = [
  { key: 'corte',        label: 'Corte',        icon: Scissors, color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' },
  { key: 'guarnicion',   label: 'Guarnicion',   icon: PenTool,  color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' },
  { key: 'soladura',     label: 'Soladura',     icon: Hammer,   color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' },
  { key: 'emplantillado',label: 'Emplantillado', icon: Sparkles, color: 'border-green-500 border-green-500 bg-green-50/50 dark:bg-green-900/10' },
];

export default function EmployeeValeModal({ taskId, onClose }: Props) {
  const [vale, setVale] = useState<ValeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadVale = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaskVale(taskId);
      setVale(data);
      const obs: Record<string, string> = {};
      data.tasks.forEach((t) => {
        if (t.observation) obs[t.id] = t.observation;
      });
      setObservations(obs);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || 'Error al cargar el vale');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { loadVale(); }, [loadVale]);

  const handleUpdateStatus = async (tId: string, newStatus: string) => {
    setStatusUpdating(tId);
    try {
      const obs = observations[tId] || '';
      await updateEmployeeTaskStatus(tId, newStatus, obs);
      showMsg('Estado actualizado', 'success');
      loadVale();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      showMsg(err?.response?.data?.detail || 'Error al actualizar estado', 'error');
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-sm text-white font-medium">Cargando vale...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (error) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <p className="font-bold">{error}</p>
          </div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold">
            Cerrar
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (!vale) return null;

  const myTask = vale.tasks.find((t) => t.is_mine);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-all duration-500 flex flex-col max-w-4xl w-full max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                VALE <span className="text-red-600 text-[16px] font-black">Nº {vale.vale_number || 'TBD'}</span>
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{vale.product_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-red-500">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 min-h-0">

          {/* Toast */}
          {message && (
            <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* ── Encabezado CALZADO J&R ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm gap-6">
            <div className="flex items-center gap-6">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-md" />
              <div className="h-10 w-[2px] bg-gray-100 dark:bg-slate-800 hidden sm:block" />
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">CALZADO J&R</h1>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mt-1">SISTEMA DE PRODUCCION</p>
              </div>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vale Nº</p>
                <p className="text-lg font-black text-red-600">{vale.vale_number ? `# ${vale.vale_number}` : '# -'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</p>
                <p className="text-lg font-black text-gray-800 dark:text-gray-200">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* ── Product Info ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-6">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-inner flex-shrink-0 flex items-center justify-center">
                {vale.product_image ? (
                  <img
                    src={vale.product_image.startsWith('http') ? vale.product_image : `http://localhost:8000${vale.product_image}`}
                    alt={vale.product_name || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={28} className="text-gray-300" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Detalle del Pedido</p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{vale.product_name}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    Cliente: <span className="text-gray-900 dark:text-white uppercase">{vale.customer_name} {vale.customer_last_name}</span>
                  </p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    Cantidad: <span className="text-blue-600 dark:text-blue-400">{vale.total_pairs} pares</span>
                  </p>
                </div>
                {myTask?.observation && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">Mi Observacion:</p>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{myTask.observation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sizing Table ── */}
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-2 border-b border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Numeracion y Cantidades</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-50 dark:border-slate-800/50">
                    <td className="px-4 py-2 bg-gray-50/30 dark:bg-slate-800/20 text-[10px] font-black text-gray-400 uppercase tracking-tighter border-r border-gray-100 dark:border-slate-800">Talla</td>
                    {vale.details.map((d, i) => (
                      <td key={i} className="px-4 py-2 text-center text-[11px] font-black text-blue-600 dark:text-blue-400 border-r border-gray-50 dark:border-slate-800 last:border-0">{d.size}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 bg-gray-50/30 dark:bg-slate-800/20 text-[10px] font-black text-gray-400 uppercase tracking-tighter border-r border-gray-100 dark:border-slate-800">Cant.</td>
                    {vale.details.map((d, i) => (
                      <td key={i} className="px-4 py-2 text-center text-xs font-black text-gray-900 dark:text-white border-r border-gray-50 dark:border-slate-800 last:border-0">{d.amount}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Task Stage Cards ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Modulos de Produccion</h3>
              <span className="text-[10px] font-bold text-gray-400 italic">Etapas del proceso</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAGES.map((stage) => {
                const task = vale.tasks.find((t) => t.type === stage.key);
                const isMine = task?.is_mine ?? false;
                const StageIcon = stage.icon;

                if (!task) {
                  return (
                    <div key={stage.key} className={`p-6 rounded-[2rem] border-2 transition-all shadow-sm ${stage.color} opacity-40`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5">
                          <StageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <h5 className="text-base font-black text-gray-400 uppercase tracking-tight">{stage.label}</h5>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 mt-3 ml-13">Sin asignar</p>
                    </div>
                  );
                }

                return (
                  <div key={stage.key} className={`p-6 rounded-[2rem] border-2 transition-all shadow-sm ${stage.color}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 relative">
                          <StageIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          {isMine && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                              <CheckCircle size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{stage.label}</h5>
                          {isMine && <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Mi Tarea</p>}
                          {task.status === 'completado' && <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Tarea Completada</p>}
                          {isMine && task.price_per_dozen > 0 && (
                            <div className="mt-1 flex flex-col">
                              <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400">
                                ${task.price_per_dozen.toLocaleString('es-CO')} / docena
                              </p>
                              <p className="text-[10px] font-black text-green-700 dark:text-green-400">
                                Total: ${task.total_cost.toLocaleString('es-CO')} ({task.amount} pares)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded uppercase tracking-tighter text-gray-600 dark:text-gray-400">
                        Cargo: {stage.label}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {task.assigned_user_name ? (
                        <div className="flex flex-col gap-3 p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-black/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                              <User size={16} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-0.5">Responsable</p>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none truncate">
                                {task.assigned_user_name || 'Asignado'}
                              </p>
                            </div>
                            <div className={`ml-auto px-2 py-0.5 text-[8px] font-black rounded uppercase flex-shrink-0 ${
                              task.status === 'completado'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                : task.status === 'pendiente'
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            }`}>
                              {task.status === 'completado' ? 'Hecho' : task.status === 'pendiente' ? 'Pendiente' : 'Activo'}
                            </div>
                          </div>

                          {isMine ? (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-3">
                              {/* Status selector for own task */}
                              {task.status === 'completado' ? (
                                <div className="w-full text-[10px] font-black uppercase bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg py-2 px-2 flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                  <CheckCircle2 size={14} /> Completado
                                </div>
                              ) : (
                                <select
                                  value={task.status}
                                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                  disabled={statusUpdating === task.id}
                                  className="w-full text-[10px] font-black uppercase bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 px-2 outline-none cursor-pointer disabled:opacity-50 transition-colors"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en_progreso">En Progreso</option>
                                  <option value="completado">Completado</option>
                                </select>
                              )}

                              {/* Own observation */}
                              <div className="space-y-2">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                  Observacion
                                </label>
                                <textarea
                                  value={observations[task.id] || ''}
                                  onChange={(e) => setObservations((prev) => ({ ...prev, [task.id]: e.target.value }))}
                                  placeholder="Ej: Faltaron insumos..."
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-400"
                                />
                                <p className="text-[9px] text-blue-500 font-medium italic">La observación se guarda al cambiar el estado</p>
                              </div>
                            </div>
                          ) : task.observation ? (
                            /* Other task's observation (read-only) */
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                                <p className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-1">Observacion</p>
                                <p className="text-xs text-amber-800 dark:text-amber-200">{task.observation}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                              <User size={16} className="text-gray-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Sin Asignar</p>
                            <div className={`ml-auto px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                              task.status === 'completado'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                            }`}>
                              {task.status === 'completado' ? 'Hecho' : 'Pendiente'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
