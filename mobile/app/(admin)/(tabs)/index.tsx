import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatCard, resolveStatColor } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/auth';
import { getMetrics, getRecentOrders, getAlerts } from '@/services/dashboardService';
import { ordersService } from '@/services/ordersService';
import type { RecentOrder, Alert } from '@/types/dashboard';
import type { ProductionTask } from '@/types/orders';


function fullName(user: { name: string; last_name: string } | null): string {
  if (!user) return '';
  return `${user.name} ${user.last_name}`.trim();
}

function statusBadge(status: string): { tone: 'yellow' | 'blue' | 'green' | 'purple' | 'red'; label: string } {
  switch (status) {
    case 'pendiente':
      return { tone: 'yellow', label: 'Pendiente' };
    case 'en_progreso':
      return { tone: 'blue', label: 'En progreso' };
    case 'completado':
      return { tone: 'green', label: 'Completado' };
    case 'entregado':
      return { tone: 'purple', label: 'Entregado' };
    case 'cancelado':
      return { tone: 'red', label: 'Cancelado' };
    default:
      return { tone: 'yellow', label: status };
  }
}

function taskStatusBadge(status: string): { tone: 'yellow' | 'blue' | 'green' | 'red'; label: string } {
  switch (status) {
    case 'pendiente':
      return { tone: 'yellow', label: 'Pendiente' };
    case 'en_progreso':
      return { tone: 'blue', label: 'En progreso' };
    case 'completado':
      return { tone: 'green', label: 'Completado' };
    case 'cancelado':
      return { tone: 'red', label: 'Cancelado' };
    default:
      return { tone: 'yellow', label: status };
  }
}

function OrderRow({ order }: { order: RecentOrder }) {
  const st = statusBadge(order.status);
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 dark:border-slate-800">
      <View className="flex-1 gap-1">
        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {order.client_name}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {order.date} · {order.quantity} pares
        </Text>
      </View>
      <Badge tone={st.tone} label={st.label} />
    </View>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
  };
  return (
    <View className="flex-row items-start gap-3 border-b border-gray-100 px-1 py-3 dark:border-slate-800">
      <Ionicons
        name={iconMap[alert.type] ?? 'alert-circle'}
        size={18}
        color={alert.type === 'error' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6'}
      />
      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {alert.title}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
          {alert.message}
        </Text>
      </View>
      <Text className="text-xs text-gray-400 dark:text-gray-500">{alert.time}</Text>
    </View>
  );
}

function TaskRow({ task }: { task: ProductionTask }) {
  const st = taskStatusBadge(task.status);
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 dark:border-slate-800">
      <View className="flex-1 gap-1">
        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {task.product_name ?? 'Producto'}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {task.type} · {task.assigned_user_name ?? 'Sin asignar'}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Badge tone={st.tone} label={st.label} />
        <Text className="text-xs text-gray-400">{task.amount} pares</Text>
      </View>
    </View>
  );
}

export default function AdminHomeScreen() {
  const user = useAuthStore((state) => state.user);

  const metrics = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getMetrics,
    staleTime: 60_000,
  });

  const recentOrders = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: getRecentOrders,
    staleTime: 60_000,
  });

  const alerts = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: getAlerts,
    staleTime: 60_000,
  });

  const pendingTasks = useQuery({
    queryKey: ['all-tasks-pending'],
    queryFn: () => ordersService.getAllTasks({ status: 'pendiente' }),
    staleTime: 60_000,
  });

  const isLoading = metrics.isLoading || recentOrders.isLoading;
  const refetch = async () => {
    await Promise.all([metrics.refetch(), recentOrders.refetch(), alerts.refetch(), pendingTasks.refetch()]);
  };

  const alertCount = alerts.data?.alerts?.length ?? 0;
  const taskCount = pendingTasks.data?.length ?? 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Inicio" />
      <ScrollView
        contentContainerClassName="p-5 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="gap-3">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary dark:bg-primary-light">
              <Text className="text-xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                ¡Hola, {fullName(user)}!
              </Text>
              <Badge tone="blue" label={user?.occupation ?? 'Jefe'} />
            </View>
          </View>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</Text>
        </Card>

        <Text className="mt-6 mb-3 text-xl font-bold text-gray-900 dark:text-white">
          Resumen
        </Text>

        {metrics.isError ? (
          <Card className="items-center gap-2 py-4">
            <Text className="text-sm text-red-500">No se pudieron cargar las métricas.</Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {(metrics.data?.metrics ?? []).map((m, i) => (
              <StatCard
                key={i}
                label={m.label}
                value={m.value}
                color={resolveStatColor(m.label)}
              />
            ))}
            {metrics.isLoading &&
              [1, 2, 3, 4].map((n) => (
                <View
                  key={n}
                  className="w-[48%] animate-pulse rounded-xl bg-gray-100 p-4 dark:bg-slate-800"
                >
                  <View className="mb-3 h-10 w-10 rounded-lg bg-gray-200 dark:bg-slate-700" />
                  <View className="h-7 w-16 rounded bg-gray-200 dark:bg-slate-700" />
                  <View className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                </View>
              ))}
          </View>
        )}

        {/* Alertas */}
        {(alertCount > 0 || alerts.isLoading) && (
          <>
            <View className="mt-6 mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Alertas
              </Text>
              {alertCount > 0 && (
                <Badge tone="red" label={`${alertCount}`} />
              )}
            </View>
            <Card className="gap-0">
              {alerts.isLoading ? (
                [1, 2].map((n) => (
                  <View key={n} className="animate-pulse border-b border-gray-100 py-3 dark:border-slate-800">
                    <View className="h-4 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                    <View className="mt-2 h-3 w-56 rounded bg-gray-200 dark:bg-slate-700" />
                  </View>
                ))
              ) : (
                (alerts.data?.alerts ?? []).slice(0, 5).map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))
              )}
            </Card>
          </>
        )}

        {/* Tareas pendientes */}
        {(taskCount > 0 || pendingTasks.isLoading) && (
          <>
            <View className="mt-6 mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Tareas pendientes
              </Text>
              {taskCount > 0 && (
                <Badge tone="yellow" label={`${taskCount}`} />
              )}
            </View>
            <Card className="gap-0">
              {pendingTasks.isLoading ? (
                [1, 2].map((n) => (
                  <View key={n} className="animate-pulse border-b border-gray-100 py-3 dark:border-slate-800">
                    <View className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                    <View className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                  </View>
                ))
              ) : (
                (pendingTasks.data ?? []).slice(0, 5).map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))
              )}
            </Card>
          </>
        )}

        <Text className="mt-6 mb-3 text-xl font-bold text-gray-900 dark:text-white">
          Pedidos recientes
        </Text>

        <Card className="gap-0">
          {recentOrders.isLoading ? (
            [1, 2, 3].map((n) => (
              <View key={n} className="animate-pulse border-b border-gray-100 py-3 dark:border-slate-800">
                <View className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                <View className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-slate-700" />
              </View>
            ))
          ) : recentOrders.isError ? (
            <View className="py-4 items-center">
              <Text className="text-sm text-red-500">No se pudieron cargar los pedidos.</Text>
            </View>
          ) : (recentOrders.data?.orders ?? []).length === 0 ? (
            <View className="py-4 items-center">
              <Text className="text-sm text-gray-500 dark:text-gray-400">No hay pedidos aún.</Text>
            </View>
          ) : (
            (recentOrders.data?.orders ?? []).map((o) => (
              <OrderRow key={o.order_id} order={o} />
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
