/**
 * Módulo: CalendarPage.tsx
 * Descripción: Calendario mensual de entregas de pedidos (dashboard jefe).
 * ¿Para qué? Ver los días con entregas programadas, el estado de producción
 * (vale / sin producción) y navegar al detalle del pedido con un clic.
 * ¿Impacto? Nueva página del dashboard jefe, consumida vía GET /admin/orders/calendar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  PackageCheck,
  PackageOpen
} from 'lucide-react';
import {
  getCalendarOrders,
  type CalendarOrderItem,
  type OrderStatus
} from '@/services/ordersApi';

interface StateStyle {
  label: string;
  chip: string;
  dot: string;
}

const STATE_STYLES: Record<OrderStatus, StateStyle> = {
  pendiente: {
    label: 'Pendiente',
    chip: 'border-l-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20',
    dot: 'bg-amber-500'
  },
  en_progreso: {
    label: 'En progreso',
    chip: 'border-l-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20',
    dot: 'bg-blue-500'
  },
  completado: {
    label: 'Completado',
    chip: 'border-l-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  entregado: {
    label: 'Entregado',
    chip: 'border-l-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20',
    dot: 'bg-indigo-500'
  },
  cancelado: {
    label: 'Cancelado',
    chip: 'border-l-gray-400 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 opacity-70',
    dot: 'bg-gray-400'
  }
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const DELIVERED_STATES: OrderStatus[] = ['entregado', 'cancelado'];

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDateLong(d: Date): string {
  const month = d.toLocaleDateString('es-CO', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getFullYear()}`;
}

function isOverdue(order: CalendarOrderItem): boolean {
  if (!order.delivery_date) return false;
  if (DELIVERED_STATES.includes(order.state)) return false;
  const delivery = new Date(order.delivery_date);
  return delivery.getTime() < startOfToday().getTime();
}

function customerLabel(order: CalendarOrderItem): string {
  const full = `${order.customer_name ?? ''} ${order.customer_last_name ?? ''}`.trim();
  return full || 'Producción stock';
}

function ValeBadge({ order }: { order: CalendarOrderItem }) {
  if (!order.has_production) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400">
        <PackageOpen size={9} />
        Sin producción
      </span>
    );
  }
  const vales = order.vale_numbers.map((n) => `#${n}`).join(', ');
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
      <PackageCheck size={9} />
      {order.vale_numbers.length > 0 ? `Vale ${vales}` : 'En producción'}
    </span>
  );
}

interface OrderChipProps {
  order: CalendarOrderItem;
  onOpen: (order: CalendarOrderItem) => void;
}

function OrderChip({ order, onOpen }: OrderChipProps) {
  const style = STATE_STYLES[order.state];
  const overdue = isOverdue(order);
  return (
    <button
      type="button"
      onClick={() => onOpen(order)}
      title={`${customerLabel(order)} · ${order.total_pairs} pares · ${style.label}`}
      className={`w-full text-left px-1.5 py-1 rounded-md border-l-[3px] transition-all active:scale-[0.98] ${style.chip} ${
        overdue ? 'ring-1 ring-rose-400 dark:ring-rose-500' : ''
      }`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">
          {customerLabel(order)}
        </span>
        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
          {order.total_pairs}p
        </span>
      </span>
      <span className="flex items-center justify-between gap-1 mt-0.5">
        <ValeBadge order={order} />
        {overdue && (
          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
            Vencido
          </span>
        )}
      </span>
    </button>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [orders, setOrders] = useState<CalendarOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const data = await getCalendarOrders(start, end);
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el calendario');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const { datedOrders, noDateOrders } = useMemo(() => {
    const dated: CalendarOrderItem[] = [];
    const noDate: CalendarOrderItem[] = [];
    for (const order of orders) {
      if (!order.delivery_date) {
        noDate.push(order);
        continue;
      }
      const d = new Date(order.delivery_date);
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        dated.push(order);
      }
    }
    return { datedOrders: dated, noDateOrders: noDate };
  }, [orders, cursor]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, CalendarOrderItem[]>();
    for (const order of datedOrders) {
      const d = new Date(order.delivery_date as string);
      const key = dayKey(d);
      const list = map.get(key);
      if (list) list.push(order);
      else map.set(key, [order]);
    }
    return map;
  }, [datedOrders]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = Math.ceil((leading + daysInMonth) / 7) * 7;
    const list: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < total; i++) {
      const dayNum = i - leading + 1;
      list.push({
        date: new Date(year, month, dayNum),
        inMonth: dayNum >= 1 && dayNum <= daysInMonth
      });
    }
    return list;
  }, [cursor]);

  const summary = useMemo(() => {
    const withoutProduction = datedOrders.filter((o) => !o.has_production).length;
    const overdue = datedOrders.filter(isOverdue).length;
    return { total: datedOrders.length, withoutProduction, overdue };
  }, [datedOrders]);

  const openOrder = useCallback(
    (order: CalendarOrderItem) => {
      navigate(`/dashboard/admin/orders?order=${order.id}`);
    },
    [navigate]
  );

  const changeMonth = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToday = () => {
    const n = new Date();
    setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const today = startOfToday();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Calendario de Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Entregas programadas por día, con estado de producción y vales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
            className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Entregas en el mes
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Sin producción
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {summary.withoutProduction}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Vencidos
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {summary.overdue}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Sin fecha de entrega
          </p>
          <p className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">
            {noDateOrders.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendario */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {formatDateLong(cursor)}
            </h2>
            {loading && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 text-sm font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7">
            {cells.map(({ date, inMonth }) => {
              const key = dayKey(date);
              const dayOrders = ordersByDay.get(key) ?? [];
              const isToday = date.getTime() === today.getTime();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const hasOverdue = dayOrders.some(isOverdue);
              return (
                <div
                  key={key}
                  className={`min-h-[92px] sm:min-h-[110px] border-r border-b border-gray-100 dark:border-slate-800 p-1.5 ${
                    !inMonth
                      ? 'bg-gray-50/70 dark:bg-slate-950/40'
                      : isWeekend
                        ? 'bg-gray-50/60 dark:bg-slate-800/30'
                        : ''
                  } ${hasOverdue ? 'bg-rose-50/70 dark:bg-rose-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : inMonth
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayOrders.slice(0, 3).map((order) => (
                      <OrderChip key={order.id} order={order} onOpen={openOrder} />
                    ))}
                    {dayOrders.length > 3 && (
                      <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 px-1">
                        +{dayOrders.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <aside className="w-full xl:w-80 shrink-0 space-y-6">
          {/* Sin fecha */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Sin fecha de entrega
              </h3>
              <span className="ml-auto text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {noDateOrders.length}
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {noDateOrders.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-4">
                  Todos los pedidos tienen fecha de entrega
                </p>
              ) : (
                noDateOrders.map((order) => (
                  <OrderChip key={order.id} order={order} onOpen={openOrder} />
                ))
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Leyenda</h3>
            </div>
            <div className="p-4 space-y-3">
              {(Object.keys(STATE_STYLES) as OrderStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATE_STYLES[status].dot}`} />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {STATE_STYLES[status].label}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <PackageCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Vale #N — producción iniciada
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageOpen size={13} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Sin producción — sin tareas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded ring-1 ring-rose-400 dark:ring-rose-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Entrega vencida
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-2">
                Haz clic en un pedido para ver su detalle
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
