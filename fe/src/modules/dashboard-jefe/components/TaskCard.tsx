import React from 'react';
import { 
  User, Calendar, Package, Scissors, Hammer, LayoutPanelLeft, 
  ExternalLink 
} from 'lucide-react';
import { ProductionTask } from '../services/ordersApi';

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

interface TaskCardProps {
  task: ProductionTask;
  isEditable?: boolean;
  onUpdateStatus?: (taskId: string, newStatus: string) => void;
  updatingTaskId?: string | null;
  onViewOrder?: (orderId: string, productId: string) => void;
  isBlocked?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (taskId: string) => void;
  showProductInfo?: boolean;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isEditable,
  onUpdateStatus,
  updatingTaskId,
  onViewOrder,
  isBlocked,
  selectable,
  selected,
  onSelect,
  showProductInfo = true,
  compact = false
}) => {
  const StageIcon = STAGE_ICONS[task.type] || Package;
  const stageColor = STAGE_COLORS[task.type] || 'bg-gray-50';
  const headerColor = HEADER_COLORS[task.type] || 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700';
  const borderColor = BORDER_COLORS[task.type] || 'border-gray-200 dark:border-slate-700';
  
  const isCompleted = task.status === 'completado';
  const isPaid = task.status === 'pagado';
  const isCancelled = task.status === 'cancelado';
  const isPending = task.status === 'pendiente' || task.status === 'por_liquidar';
  const isInProgress = task.status === 'en_progreso';

  const pricePerDozen = task.task_prices?.[task.type] ?? 0;
  const totalPairs = task.amount || task.total_pairs || 0;
  const totalCost = Math.round((totalPairs / 12) * pricePerDozen);

  return (
    <div 
      onClick={() => selectable && onSelect && onSelect(task.id)}
      className={`group relative border-2 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col bg-white dark:bg-slate-800 ${borderColor} ${selectable ? 'cursor-pointer' : ''} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      {/* Header Card */}
      <div className={`${compact ? 'p-3' : 'p-4'} border-b ${headerColor}`}>
        <div className={`flex items-center justify-between gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
          <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${stageColor}`}>
            <StageIcon size={14} />
            <span>{STAGE_LABELS[task.type]}</span>
          </div>
          {task.vale_number && (
            <span className="text-[11px] font-black text-red-600 bg-white px-2.5 py-1 rounded-md border border-transparent whitespace-nowrap shadow-sm shadow-black/10">
              VALE #{task.vale_number}
            </span>
          )}
          {selectable && (
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              isPaid ? 'bg-green-500 border-green-500' :
              selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
            }`}>
              {(selected || isPaid) && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 00-1.4 0L8 12.6 4.7 9.3a1 1 0 00-1.4 1.4l4 4a1 1 0 001.4 0l8-8a1 1 0 000-1.4z"/></svg>
              )}
            </div>
          )}
        </div>

        {showProductInfo && (
          <div className={`flex items-center gap-3 ${compact ? 'mt-1' : 'mt-2'}`}>
            <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-white overflow-hidden border-2 border-white shadow-md shrink-0 flex items-center justify-center`}>
              {task.product_image ? (
                <img 
                  src={task.product_image.startsWith('http') ? task.product_image : `http://localhost:8000${task.product_image}`} 
                  alt={task.product_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={22} className="text-gray-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-white truncate uppercase tracking-tight drop-shadow-md">
                {task.product_name || 'Sin Producto'}
              </p>
              <p className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-sm opacity-90">
                {task.product_category || 'General'}
              </p>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-2 ${compact ? 'mt-3 pt-2' : 'mt-4 pt-3'} border-t border-white/10`}>
          <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20`}>
            <User size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight drop-shadow-sm">{task.assigned_user_name || 'Sin asignar'}</p>
            <p className="text-[9px] text-white font-bold uppercase tracking-widest drop-shadow-sm opacity-80">{task.assigned_user_occupation || 'Operario'}</p>
          </div>
        </div>
      </div>

      {/* Body Card */}
      <div className={`${compact ? 'p-3' : 'p-4'} flex flex-col ${compact ? 'gap-3' : 'gap-4'} flex-1`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Estado</p>
          <div className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${
              isPaid ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
              isCompleted ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
              isInProgress ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
              isPending ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
              isCancelled ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
              'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
            }`}>
              {isPaid ? '✅ Pagado' : isCompleted ? '✅ Completado' : isInProgress ? '🔄 En Progreso' : isPending ? '⏳ Por Liquidar' : isCancelled ? '❌ Cancelado' : 'Desconocido'}
            </div>
        </div>
        
        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{new Date(task.created_at).toLocaleDateString('es-CO', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
        </div>

        {pricePerDozen > 0 && (
          <div className={`${compact ? 'p-1.5' : 'p-2'} bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50`}>
            <div className="flex items-center justify-between gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-green-800 dark:text-green-300 uppercase tracking-tighter">Costo Laboral</span>
              <span className="text-[9px] font-bold text-green-600 dark:text-green-400">{totalPairs} pares</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`${compact ? 'text-[13px]' : 'text-sm'} font-black text-green-700 dark:text-green-400`}>${totalCost.toLocaleString('es-CO')}</span>
              <span className="text-[8px] font-bold text-green-600/70 dark:text-green-400/50">(${pricePerDozen.toLocaleString('es-CO')}/doc)</span>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex flex-col gap-3 mt-auto pt-2">
          {isEditable ? (
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus && onUpdateStatus(task.id, e.target.value)}
              disabled={updatingTaskId === task.id}
              className={`w-full text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900/60 border-2 border-gray-200 dark:border-slate-700 rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} cursor-pointer disabled:opacity-50 outline-none hover:border-gray-300 dark:hover:border-slate-600 transition-colors focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="por_liquidar">⏳ Por Liquidar</option>
              <option value="en_progreso">🔄 En Progreso</option>
              <option value="completado">✅ Completado</option>
              <option value="pagado">✅ Pagado</option>
              <option value="cancelado">❌ Cancelado</option>
            </select>
          ) : isBlocked ? (
            <div className={`w-full text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center`}>
              🔒 Etapa anterior pendiente
            </div>
          ) : isPaid ? (
            <div className={`w-full text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center font-black`}>
              ✅ TAREA PAGADA
            </div>
          ) : isCompleted ? (
            <div className={`w-full text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center font-black`}>
              ✅ POR LIQUIDAR
            </div>
          ) : (
            <div className={`w-full text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-700 rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center`}>
              ❌ Cancelada
            </div>
          )}

          {onViewOrder && (
            <button 
              onClick={(e) => { e.stopPropagation(); onViewOrder(task.order_id, task.product_id); }}
              className={`w-full text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-none ${compact ? 'py-2.5' : 'py-3.5'} rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2`}
            >
              <ExternalLink size={12} /> Ver Vale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
