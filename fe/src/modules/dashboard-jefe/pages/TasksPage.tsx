import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Mock data
const INITIAL_TASKS = [
  { id: '1', title: 'Inventario de temporada', desc: 'Contar mercancía en bodega B', assignee: 'Carlos', status: 'pending', date: '2023-11-20', priority: 'high' },
  { id: '2', title: 'Llamar a proveedores', desc: 'Confirmar envío de cordones', assignee: 'María', status: 'in-progress', date: '2023-11-21', priority: 'medium' },
  { id: '3', title: 'Preparar pedido #1245', desc: 'Embalaje especial para regalo', assignee: 'Juan', status: 'done', date: '2023-11-19', priority: 'low' },
];

export default function TasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <CheckSquare className="w-8 h-8 text-orange-600" />
            Gestión de Tareas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Asigna y supervisa las actividades del personal
          </p>
        </div>
        <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 px-5 py-2.5 transition-all active:scale-95 font-bold">
          <Plus className="w-5 h-5" />
          Nueva Tarea
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column: Pendientes */}
        <TaskColumn title="Pendientes" icon={Clock} iconColor="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-500/10" tasks={pending} />
        {/* Column: En Progreso */}
        <TaskColumn title="En Progreso" icon={AlertCircle} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" tasks={inProgress} />
        {/* Column: Completadas */}
        <TaskColumn title="Completadas" icon={CheckCircle2} iconColor="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" tasks={done} />
      </div>
    </div>
  );
}

function TaskColumn({ title, icon: Icon, iconColor, bgColor, tasks }: any) {
  return (
    <div className={`rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm`}>
      <div className={`p-4 border-b border-gray-100 dark:border-slate-800 ${bgColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </div>
        <span className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
          {tasks.length}
        </span>
      </div>
      <div className="p-4 space-y-3 min-h-[300px]">
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</h3>
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{task.desc}</p>
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {task.assignee}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {task.date}
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
            No hay tareas aquí
          </div>
        )}
      </div>
    </div>
  );
}
