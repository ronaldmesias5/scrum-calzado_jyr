import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// TasksPage - production task dashboard for jefe
import { 
  CheckSquare, AlertCircle, CheckCircle2, 
  Search, X, RefreshCw
} from 'lucide-react';
import { getAllProductionTasks, ProductionTask, updateProductionTaskStatus } from '../services/ordersApi';
import { TaskCard } from '../components/TaskCard';

// Los iconos y colores se han movido a TaskCard.tsx para reusabilidad

export default function ProductionTaskDashboard() {
  // const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      setToast({ message: `Tarea actualizada a ${newStatus}`, type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ message: 'Error al actualizar tarea', type: 'error' });
    } finally {
      setUpdatingTaskId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Obtener empleados únicos para cada cargo (deduplicar por ID)
  const employeesByRole = Object.fromEntries(
    ['corte', 'guarnicion', 'soladura', 'emplantillado'].map(role => [
      role,
      Array.from(
        new Map(
          tasks
            .filter(t => t.type === role)
            .map(t => [t.assigned_to, { id: t.assigned_to, name: t.assigned_user_name }])
        ).values()
      )
        .filter(e => e.name)
        .sort((a, b) => ((a.name && b.name) ? a.name.localeCompare(b.name) : 0))
    ])
  );

  // Orden secuencial de etapas de producción
  const STAGE_ORDER = ['corte', 'guarnicion', 'soladura', 'emplantillado'];

  // Determina si una tarea está bloqueada (su etapa predecesora en el mismo vale no está completada)
  const isTaskBlocked = (task: ProductionTask): boolean => {
    const stageIndex = STAGE_ORDER.indexOf(task.type);
    if (stageIndex <= 0) return false; // corte nunca está bloqueado
    const predecessorType = STAGE_ORDER[stageIndex - 1];
    const predecessor = tasks.find(
      t => t.order_id === task.order_id && t.product_id === task.product_id && t.type === predecessorType
    );
    return !predecessor || predecessor.status !== 'completado';
  };

  // Frontend Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.assigned_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vale_number?.toString().includes(searchQuery);
    
    const matchesCargo = !cargoFilter || task.type === cargoFilter;
    const matchesEmployee = !employeeFilter || task.assigned_user_name === employeeFilter;
    
    // Handle status filter with explicit matching
    let matchesStatus = true;
    if (statusFilter) {
      // "por_liquidar" filter matches both "por_liquidar" and "pendiente" (legacy compatibility)
      if (statusFilter === 'por_liquidar') {
        matchesStatus = task.status === 'por_liquidar' || task.status === 'pendiente';
      } else {
        // Other filters must match exactly
        matchesStatus = task.status === statusFilter;
      }
    }

    return matchesSearch && matchesCargo && matchesEmployee && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
          <div className={`bg-white dark:bg-slate-900 border-2 ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'} rounded-full px-6 py-4 shadow-2xl flex items-center gap-4 border-b-4`}>
            <div className={`w-10 h-10 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
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
            style={{animation: 'none', filter: 'none'}}
          >
            <RefreshCw className="w-5 h-5 text-blue-100" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Bar de Filtros - Cargo, Empleado, Búsqueda */}
      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

        {cargoFilter && (employeesByRole[cargoFilter as keyof typeof employeesByRole]?.length ?? 0) > 0 && (
          <select 
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:border-gray-200 dark:hover:border-slate-700 transition-all flex-shrink-0 min-w-max"
          >
            <option value="">Todos los Empleados</option>
            {(employeesByRole[cargoFilter as keyof typeof employeesByRole] || []).map(emp => (
              <option key={emp.id} value={emp.name || ""}>{(emp.name || "").toUpperCase()}</option>
            ))}
          </select>
        )}

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:border-gray-200 dark:hover:border-slate-700 transition-all flex-shrink-0 min-w-max"
        >
          <option value="">Todos los Estados</option>
          <option value="por_liquidar">Por Liquidar</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completado</option>
          <option value="pagado">Pagado</option>
          <option value="cancelado">Cancelado</option>
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
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
        
        <button 
          onClick={() => { setSearchQuery(''); setCargoFilter(''); setEmployeeFilter(''); setStatusFilter(''); }}
          className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 dark:hover:bg-red-800 whitespace-nowrap flex-shrink-0 transition-none"
          style={{animation: 'none', filter: 'none'}}
        >
          <X className="w-3 h-3 mr-1" /> Limpiar
        </button>
      </div>

      {/* Contador de Tareas */}
      <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
        Mostrando <span className="text-blue-600 dark:text-blue-400 font-black">{filteredTasks.length}</span> de <span className="text-gray-900 dark:text-white font-black">{tasks.length}</span> tareas
      </div>

      {/* Grid de Cards Sueltas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-slate-800/40 h-48 rounded-2xl animate-pulse" />
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 p-12 text-center bg-gray-50/50 dark:bg-slate-800/10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl">
            <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-black uppercase tracking-widest opacity-40">Sin tareas</p>
            <p className="text-sm mt-2 font-medium opacity-60">No se encontraron tareas con los filtros actuales</p>
          </div>
        ) : (
          filteredTasks.map((task: ProductionTask) => (
            <TaskCard 
              key={task.id}
              task={task}
              isEditable={!['completado', 'pagado', 'cancelado'].includes(task.status) && !isTaskBlocked(task)}
              isBlocked={isTaskBlocked(task)}
              onUpdateStatus={handleUpdateTaskStatus}
              updatingTaskId={updatingTaskId}
              onViewOrder={(orderId, productId) => navigate(`/dashboard/admin/orders?order=${orderId}&product=${productId}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

