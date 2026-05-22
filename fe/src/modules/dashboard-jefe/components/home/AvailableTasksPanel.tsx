import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { getAllProductionTasks, type ProductionTask } from '../../services/ordersApi';
import { TaskCard } from '@/modules/dashboard-jefe/components/TaskCard';

export default function AvailableTasksPanel() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProductionTasks({ status: 'pendiente' })
      .then((data) => {
        setTasks(data.filter((t) => !t.assigned_to));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && tasks.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border-2 border-green-200 dark:border-green-900/50 p-5 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <UserPlus size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tareas Disponibles</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loading ? 'Cargando...' : `${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} sin asignar`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <p className="text-xs text-gray-400 font-medium">Cargando tareas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              showProductInfo
              onViewOrder={() => navigate('/dashboard/admin/orders')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
