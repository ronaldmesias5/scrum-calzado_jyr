import { Clock, Zap, CheckCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { OrderStatus } from '../services/ordersApi';

/**
 * Ícono del estado
 */
export function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pendiente': return <Clock className="w-4 h-4" />;
    case 'en_progreso': return <Zap className="w-4 h-4" />;
    case 'completado': return <CheckCircle className="w-4 h-4" />;
    case 'entregado': return <CheckCircle2 className="w-4 h-4" />;
    case 'cancelado': return <XCircle className="w-4 h-4" />;
    default: return null;
  }
}

/**
 * Badge del estado con color distintivo
 * Colores por estado:
 * - Pendiente: Amarillo
 * - En Producción: Azul
 * - Completado: Verde
 * - Entregado: Púrpura
 * - Cancelado: Rojo
 */
export function StatusBadge({ status, showLabel = true }: { status: OrderStatus; showLabel?: boolean }) {
  const styles: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
    pendiente:   { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50', label: 'Pendiente' },
    en_progreso: { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50',   label: 'En Producción' },
    completado:  { bg: 'bg-green-50 dark:bg-green-950/30',  text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50',  label: 'Completado' },
    entregado:   { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50', label: 'Entregado' },
    cancelado:   { bg: 'bg-red-50 dark:bg-red-950/30',    text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50',    label: 'Cancelado' },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${s.bg} ${s.text} ${s.border}`}>
      <StatusIcon status={status} />
      {showLabel && s.label}
    </span>
  );
}

/**
 * Obtiene los colores de un estado específico
 */
export function getStatusColors(status: OrderStatus) {
  const colors: Record<OrderStatus, { bg: string; text: string; border: string; badge: string }> = {
    pendiente:   { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50', badge: 'bg-yellow-600' },
    en_progreso: { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50',   badge: 'bg-blue-600' },
    completado:  { bg: 'bg-green-50 dark:bg-green-950/30',  text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50',  badge: 'bg-green-600' },
    entregado:   { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50', badge: 'bg-purple-600' },
    cancelado:   { bg: 'bg-red-50 dark:bg-red-950/30',    text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50',    badge: 'bg-red-600' },
  };
  return colors[status];
}
