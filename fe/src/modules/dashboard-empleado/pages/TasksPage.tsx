import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, AlertCircle, CheckCircle2, Search, X, RefreshCw,
} from 'lucide-react';
import { getEmployeeTasks, updateEmployeeTaskStatus } from '../services/employeeApi';
import type { EmployeeTask } from '../types/employee';
import { TaskCard } from '@/modules/dashboard-jefe/components/TaskCard';
import { ProductionTask } from '@/modules/dashboard-jefe/services/ordersApi';
import EmployeeValeModal from '../components/EmployeeValeModal';

/** Mapea EmployeeTask al formato ProductionTask que espera TaskCard */
const toProductionTask = (task: EmployeeTask, extra?: Partial<ProductionTask>): ProductionTask => ({
  id: task.id,
  order_id: task.order_id || '',
  product_id: task.product_id || '',
  amount: task.amount,
  status: task.status,
  type: task.type,
  priority: task.priority || 'media',
  created_at: task.created_at || new Date().toISOString(),
  vale_number: task.vale_number ?? undefined,
  product_name: task.product_name || undefined,
  product_image: task.product_image || undefined,
  product_category: task.product_category || undefined,
  line_group: task.line_group,
  assigned_to: task.assigned_to || undefined,
  assigned_user_name: task.assigned_user_name || undefined,
  assigned_user_occupation: task.assigned_user_occupation || undefined,
  task_prices: task.task_prices,
  ...extra,
});

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [valeTaskId, setValeTaskId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasksData = await getEmployeeTasks();
      setTasks(tasksData.tasks);
    } catch (e) {
      console.error('Error al cargar tareas:', e);
      showToast('Error al cargar tareas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleMarkCompleted = async (taskId: string) => {
    setActionLoadingId(taskId);
    try {
      await updateEmployeeTaskStatus(taskId, 'completado');
      showToast('✅ Tarea marcada como completada', 'success');
      const tasksData = await getEmployeeTasks();
      setTasks(tasksData.tasks);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const msg = err?.response?.data?.detail || 'Error al completar tarea';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewVale = (taskId: string) => {
    setValeTaskId(taskId);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = !searchQuery
      || task.vale_number?.toString().includes(searchQuery)
      || task.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500">
          <div className={`bg-white dark:bg-slate-900 border-2 ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'} rounded-full px-6 py-4 shadow-2xl flex items-center gap-4 border-b-4`}>
            <div className={`w-10 h-10 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
              {toast.type === 'success'
                ? <CheckCircle2 className="w-6 h-6 text-white" />
                : <AlertCircle className="w-6 h-6 text-white" />}
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <CheckSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Mis Tareas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Tareas de producción asignadas
          </p>
        </div>
        <button
          onClick={loadTasks}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          <div className="relative lg:col-span-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                placeholder="Buscar por vale o producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
              className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700 dark:hover:bg-red-800 transition-all flex items-center justify-center gap-2"
            >
              <X size={14} /> Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* TAREAS ASIGNADAS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
            Mostrando <span className="text-blue-600 dark:text-blue-400 font-black">{filteredTasks.length}</span> de <span className="text-gray-900 dark:text-white font-black">{tasks.length}</span> tareas asignadas
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <CheckSquare size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">Sin tareas asignadas</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    No hay tareas pendientes para tu ocupación en este momento.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={toProductionTask(task, {
                    assigned_to: task.assigned_to || undefined,
                    assigned_user_name: task.assigned_user_name || undefined,
                    assigned_user_occupation: task.assigned_user_occupation || undefined,
                  })}
                  completable
                  onCompleteTask={handleMarkCompleted}
                  actionLoadingId={actionLoadingId}
                  compact
                  showProductInfo
                  onViewOrder={() => handleViewVale(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VALE MODAL */}
      {valeTaskId && (
        <EmployeeValeModal
          taskId={valeTaskId}
          onClose={() => setValeTaskId(null)}
        />
      )}
    </div>
  );
}
