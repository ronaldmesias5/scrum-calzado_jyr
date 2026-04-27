import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// TasksPage - production task dashboard for jefe
import { 
  CheckSquare, AlertCircle, CheckCircle2, User, Calendar, 
  Search, Package, Scissors, Hammer, LayoutPanelLeft,
  X, RefreshCw
} from 'lucide-react';
import { getAllProductionTasks, ProductionTask, updateProductionTaskStatus } from '../services/ordersApi';

const STAGE_ICONS: Record<string, any> = {
  corte: Scissors,
  guarnicion: LayoutPanelLeft,
  soladura: Hammer,
  emplantillado: Package,
};

const STAGE_LABELS: Record<string, string> = {
  corte: 'Corte',
  guarnicion: 'Guarnición',
  soladura: 'Soladura',
  emplantillado: 'Emplantillado',
};

const STAGE_COLORS: Record<string, string> = {
  corte: 'bg-white text-amber-600 shadow-sm border-transparent',
  guarnicion: 'bg-white text-indigo-700 shadow-sm border-transparent',
  soladura: 'bg-white text-blue-800 shadow-sm border-transparent',
  emplantillado: 'bg-white text-emerald-700 shadow-sm border-transparent',
};

const HEADER_COLORS: Record<string, string> = {
  corte: 'bg-amber-600 dark:bg-amber-600 border-amber-700 dark:border-amber-700',
  guarnicion: 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-600',
  soladura: 'bg-blue-700 dark:bg-blue-600 border-blue-800 dark:border-blue-700',
  emplantillado: 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-600',
};

const BORDER_COLORS: Record<string, string> = {
  corte: 'border-amber-200 dark:border-amber-900/50',
  guarnicion: 'border-indigo-200 dark:border-indigo-900/50',
  soladura: 'border-blue-200 dark:border-blue-900/50',
  emplantillado: 'border-emerald-200 dark:border-emerald-900/50',
};

const CARD_BG_COLORS: Record<string, string> = {
  corte: 'bg-white dark:bg-slate-800',
  guarnicion: 'bg-white dark:bg-slate-800',
  soladura: 'bg-white dark:bg-slate-800',
  emplantillado: 'bg-white dark:bg-slate-800',
};

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
    const matchesStatus = !statusFilter || task.status === statusFilter;

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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 transition-colors tracking-tight">
            <div className="p-2 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <CheckSquare className="w-8 h-8 text-white" />
            </div>
            Gestión de Tareas de Producción
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
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
            <LayoutPanelLeft className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-black uppercase tracking-widest opacity-40">Sin tareas</p>
            <p className="text-sm mt-2 font-medium opacity-60">No se encontraron tareas con los filtros actuales</p>
          </div>
        ) : (
          filteredTasks.map((task: ProductionTask) => {
            const StageIcon = STAGE_ICONS[task.type] || Package;
            const stageColor = STAGE_COLORS[task.type] || 'bg-gray-50';
            const headerColor = HEADER_COLORS[task.type] || 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700';
            const borderColor = BORDER_COLORS[task.type] || 'border-gray-200 dark:border-slate-700';
            const cardBgColor = CARD_BG_COLORS[task.type] || 'bg-white dark:bg-slate-800';
            const isCompleted = task.status === 'completado';
            const isPaid = task.status === 'pagado';
            const isCancelled = task.status === 'cancelado';
            const blocked = isTaskBlocked(task);
            // La tarea es editable solo si: no está completada, no está pagada, no está cancelada, y no está bloqueada
            const isEditable = !isCompleted && !isPaid && !isCancelled && !blocked;

            return (
              <div key={task.id} className={`group relative border-2 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${`${cardBgColor} ${borderColor}`}`}>
                {/* Header Card */}
                <div className={`p-4 border-b ${headerColor}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${stageColor}`}>
                      <StageIcon size={14} />
                      <span>{STAGE_LABELS[task.type]}</span>
                    </div>
                    {task.vale_number && (
                      <span className="text-[11px] font-black text-red-600 bg-white px-2.5 py-1 rounded-md border border-transparent whitespace-nowrap shadow-sm shadow-black/10">
                        VALE #{task.vale_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-none shadow-md flex-shrink-0">
                      <User size={22} className="text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] md:text-[15px] font-black text-white truncate uppercase tracking-tight drop-shadow-md">{task.assigned_user_name || 'Sin asignar'}</p>
                      <p className="text-[11px] text-white font-black uppercase tracking-widest drop-shadow-sm opacity-90">{task.assigned_user_occupation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-4 flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Estado</p>
                    <div className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${
                        task.status === 'pagado' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
                        task.status === 'completado' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                        task.status === 'en_progreso' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                        'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                      }`}>
                        {task.status === 'pagado' ? '✅ Pagado' : task.status === 'completado' ? '✅ Completado' : task.status === 'en_progreso' ? '🔄 En Curso' : '❌ Cancelado'}
                      </div>
                  </div>
                  
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{new Date(task.created_at).toLocaleDateString('es-CO', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                  </div>

                  {/* Controles */}
                  <div className="flex flex-col gap-3 mt-auto pt-2">
                    {isEditable ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        disabled={updatingTaskId === task.id}
                        className="w-full text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900/60 border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 cursor-pointer disabled:opacity-50 outline-none hover:border-gray-300 dark:hover:border-slate-600 transition-colors focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="en_progreso">🔄 En Progreso</option>
                        <option value="completado">✅ Completado</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    ) : blocked ? (
                      <div className="w-full text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-center">
                        🔒 Etapa anterior pendiente
                      </div>
                    ) : isPaid ? (
                      <div className="w-full text-xs font-black uppercase tracking-wider text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl px-4 py-3 text-center">
                        ✅ Tarea Pagada
                      </div>
                    ) : isCompleted ? (
                      <div className="w-full text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-center">
                        ✅ Tarea Completada
                      </div>
                    ) : (
                      <div className="w-full text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center">
                        ❌ Cancelada
                      </div>
                    )}

                    <button 
                      onClick={() => navigate(`/dashboard/admin/orders?order=${task.order_id}&product=${task.product_id}`)}
                      className="w-full text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-none py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2"
                    >
                      Ver Vale del Pedido
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

