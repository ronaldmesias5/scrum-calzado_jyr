import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// TasksPage - production task dashboard for jefe
import { CheckSquare, Search, X, RefreshCw } from 'lucide-react';
import {
  getAllProductionTasks,
  ProductionTask,
  updateProductionTaskStatus,
  assignTaskEmployee,
  updateTaskPriority,
  updateTaskDetail
} from '@/services/ordersApi';
import { getAllUsers } from '@/services/adminApi';
import { TaskCard } from '@/features/admin/components/molecules/TaskCard';
import type { UserResponse } from '@/types/auth';
import { useToast } from '@/store/ToastContext';
import { useAuth } from '@/hooks/useAuth';

// Los iconos y colores se han movido a TaskCard.tsx para reusabilidad

export default function ProductionTaskDashboard() {
  // const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'admin' || user?.occupation === 'jefe';
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useToast();
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<
    { id: string; name: string; occupation: string }[]
  >([]);
  const [editingTask, setEditingTask] = useState<ProductionTask | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', description_task: '', deadline: '', observation: '' });

  // Cargar lista de empleados para poder asignarlos a tareas pendientes
  const loadEmployees = useCallback(async () => {
    try {
      const users = await getAllUsers();
      const filtered = users.filter(
        (u: UserResponse) =>
          u.occupation &&
          ['cortador', 'guarnecedor', 'solador', 'emplantillador'].includes(
            u.occupation
          )
      );
      setEmployees(
        filtered.map((u: UserResponse) => ({
          id: u.id,
          name: `${u.name} ${u.last_name}`.toUpperCase(),
          occupation: u.occupation || ''
        }))
      );
    } catch (e) {
      console.error('Error al cargar empleados:', e);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProductionTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar las tareas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId);
      await updateProductionTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      showToast(`Tarea actualizada a ${newStatus}`);
    } catch (e) {
      console.error(e);
      showToast('Error al actualizar tarea', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAssignEmployee = async (taskId: string, employeeId: string) => {
    try {
      setUpdatingTaskId(taskId);
      const updatedTask = await assignTaskEmployee(taskId, employeeId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      showToast('Empleado asignado correctamente');
    } catch (e) {
      console.error(e);
      showToast('Error al asignar empleado', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleUpdatePriority = async (taskId: string, newPriority: string) => {
    try {
      setUpdatingTaskId(taskId);
      const updatedTask = await updateTaskPriority(taskId, newPriority);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      showToast(`Prioridad actualizada a ${newPriority}`);
    } catch (e) {
      console.error(e);
      showToast('Error al actualizar prioridad', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      setUpdatingTaskId(editingTask.id);
      const payload: { amount?: number; description_task?: string; deadline?: string | null; observation?: string } = {};
      if (editForm.amount) payload.amount = parseInt(editForm.amount, 10);
      if (editForm.description_task) payload.description_task = editForm.description_task;
      if (editForm.deadline) payload.deadline = editForm.deadline;
      else payload.deadline = null;
      if (editForm.observation) payload.observation = editForm.observation;
      const updatedTask = await updateTaskDetail(editingTask.id, payload);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      setEditingTask(null);
      showToast('Tarea actualizada');
    } catch (e) {
      console.error(e);
      showToast('Error al editar tarea', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Recargar empleados y tareas al montar
  useEffect(() => {
    loadEmployees();
    loadTasks();
  }, [loadEmployees, loadTasks]);

  // Obtener empleados únicos para cada cargo (deduplicar por ID)
  const employeesByRole = Object.fromEntries(
    ['corte', 'guarnicion', 'soladura', 'emplantillado'].map((role) => [
      role,
      Array.from(
        new Map(
          tasks
            .filter((t) => t.type === role)
            .map((t) => [
              t.assigned_to,
              { id: t.assigned_to, name: t.assigned_user_name }
            ])
        ).values()
      )
        .filter((e) => e.name)
        .sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0))
    ])
  );

  // Orden secuencial de etapas de producción
  const STAGE_ORDER = ['corte', 'guarnicion', 'soladura', 'emplantillado'];

  // Mapeo de tipo de tarea → occupation del empleado
  const TYPE_TO_OCCUPATION: Record<string, string> = {
    corte: 'cortador',
    guarnicion: 'guarnecedor',
    soladura: 'solador',
    emplantillado: 'emplantillador'
  };

  // Determina si una tarea está bloqueada (su etapa predecesora en el mismo vale no está completada)
  const isTaskBlocked = (task: ProductionTask): boolean => {
    const stageIndex = STAGE_ORDER.indexOf(task.type);
    if (stageIndex <= 0) return false; // corte nunca está bloqueado
    const predecessorType = STAGE_ORDER[stageIndex - 1];
    const predecessor = tasks.find(
      (t) =>
        t.order_id === task.order_id &&
        t.product_id === task.product_id &&
        t.type === predecessorType
    );
    return !predecessor || predecessor.status !== 'completado';
  };

  // Frontend Filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.assigned_user_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      task.vale_number?.toString().includes(searchQuery);

    const matchesCargo = !cargoFilter || task.type === cargoFilter;
    const matchesEmployee =
      !employeeFilter || task.assigned_user_name === employeeFilter;

    // Handle status filter: match directly against task.status
    let matchesStatus = true;
    if (statusFilter) {
      matchesStatus = task.status === statusFilter;
    }

    return matchesSearch && matchesCargo && matchesEmployee && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 stagger-reveal">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <CheckSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Gestión de Tareas de Producción
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Supervisa el avance de los vales en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <button
            onClick={loadTasks}
            className="px-6 py-4 bg-blue-600 dark:bg-blue-700 text-white rounded-2xl hover:bg-blue-700 font-black uppercase text-xs flex items-center gap-3 transition-none"
            style={{ animation: 'none', filter: 'none' }}
          >
            <RefreshCw className="w-5 h-5 text-blue-100" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Bar de Filtros - Cargo, Empleado, Búsqueda */}
      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 stagger-reveal">
        <select
          value={cargoFilter}
          onChange={(e) => {
            setCargoFilter(e.target.value);
            setEmployeeFilter(''); // Limpiar filtro de empleado cuando cambia cargo
          }}
          className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:border-gray-200 dark:hover:border-slate-700 transition-all flex-shrink-0 min-w-max"
        >
          <option value="">Todos Cargos</option>
          <option value="corte">Cortador</option>
          <option value="guarnicion">Guarnecedor</option>
          <option value="soladura">Solador</option>
          <option value="emplantillado">Emplantillador</option>
        </select>

        {cargoFilter &&
          (employeesByRole[cargoFilter as keyof typeof employeesByRole]
            ?.length ?? 0) > 0 && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:border-gray-200 dark:hover:border-slate-700 transition-all flex-shrink-0 min-w-max"
            >
              <option value="">Todos los Empleados</option>
              {(
                employeesByRole[cargoFilter as keyof typeof employeesByRole] ||
                []
              ).map((emp) => (
                <option key={emp.id} value={emp.name || ''}>
                  {(emp.name || '').toUpperCase()}
                </option>
              ))}
            </select>
          )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:border-gray-200 dark:hover:border-slate-700 transition-all flex-shrink-0 min-w-max"
        >
          <option value="">Todos los Estados</option>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="en_progreso">🔄 En Progreso</option>
          <option value="completado">✅ Completado</option>
          <option value="pagado">✅ Pagado</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>

        <div className="relative flex-1 group min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nº vale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent focus:border-blue-500/50 dark:focus:border-blue-500/30 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 outline-none transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setSearchQuery('');
            setCargoFilter('');
            setEmployeeFilter('');
            setStatusFilter('');
          }}
          className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 dark:hover:bg-red-800 whitespace-nowrap flex-shrink-0 transition-none"
          style={{ animation: 'none', filter: 'none' }}
        >
          <X className="w-3 h-3 mr-1" /> Limpiar
        </button>
      </div>

      {/* Contador de Tareas */}
      <div className="text-sm text-gray-600 dark:text-gray-400 font-bold stagger-reveal">
        Mostrando{' '}
        <span className="text-blue-600 dark:text-blue-400 font-black">
          {filteredTasks.length}
        </span>{' '}
        de{' '}
        <span className="text-gray-900 dark:text-white font-black">
          {tasks.length}
        </span>{' '}
        tareas
      </div>

      {/* Grid de Cards Sueltas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 stagger-reveal">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-slate-800/40 h-48 rounded-2xl animate-pulse"
            />
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 p-12 text-center bg-gray-50/50 dark:bg-slate-800/10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl">
            <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-black uppercase tracking-widest opacity-40">
              Sin tareas
            </p>
            <p className="text-sm mt-2 font-medium opacity-60">
              No se encontraron tareas con los filtros actuales
            </p>
          </div>
        ) : (
          filteredTasks.map((task: ProductionTask) => (
            <TaskCard
              key={task.id}
              task={task}
              isEditable={
                !['completado', 'pagado', 'cancelado'].includes(task.status) &&
                !isTaskBlocked(task)
              }
              isBlocked={isTaskBlocked(task)}
              onUpdateStatus={handleUpdateTaskStatus}
              onUpdatePriority={isAdmin ? handleUpdatePriority : undefined}
              updatingTaskId={updatingTaskId}
              onViewOrder={(orderId, productId) =>
                navigate(
                  `/dashboard/admin/orders?order=${orderId}&product=${productId}&line_group=${task.line_group ?? 0}`
                )
              }
              onAssignEmployee={handleAssignEmployee}
              employees={employees.filter(
                (e) => e.occupation === TYPE_TO_OCCUPATION[task.type]
              )}
              onEdit={isAdmin ? (task) => {
                setEditingTask(task);
                setEditForm({
                  amount: task.amount?.toString() || '',
                  description_task: task.description_task ?? '',
                  deadline: (task.deadline ?? '').split('T')[0] || '',
                  observation: task.observation ?? '',
                });
              } : undefined}
            />
          ))
        )}
      </div>

      {/* Modal Editar Tarea */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Editar Tarea</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vale #{editingTask.vale_number} — {editingTask.product_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Cantidad (pares)</label>
                <input type="number" min="1" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Descripción</label>
                <input type="text" value={editForm.description_task} onChange={(e) => setEditForm({ ...editForm, description_task: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Fecha límite</label>
                <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Observación</label>
                <textarea rows={3} value={editForm.observation} onChange={(e) => setEditForm({ ...editForm, observation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setEditingTask(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={updatingTaskId === editingTask.id}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                {updatingTaskId === editingTask.id ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
