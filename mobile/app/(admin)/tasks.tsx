import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { listAllUsers } from '@/services/adminService';
import { ordersService } from '@/services/ordersService';
import type { ProductionTask } from '@/types/orders';
import type { AdminUser } from '@/types/users';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

// ─── Constantes ─────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_progreso', label: 'En Progreso' },
  { key: 'completado', label: 'Completado' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'cancelado', label: 'Cancelado' },
];

const TYPE_FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'corte', label: 'Corte' },
  { key: 'guarnicion', label: 'Guarnición' },
  { key: 'soladura', label: 'Soladura' },
  { key: 'emplantillado', label: 'Emplantillado' },
];

const TASK_TYPE_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  corte: {
    label: 'Corte',
    icon: 'cut-outline',
    color: '#3b82f6',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  guarnicion: {
    label: 'Guarnición',
    icon: 'layers-outline',
    color: '#a855f7',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  soladura: {
    label: 'Soladura',
    icon: 'flame-outline',
    color: '#f97316',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  emplantillado: {
    label: 'Emplantillado',
    icon: 'footsteps-outline',
    color: '#22c55e',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
};

const TASK_STATUS_BADGE: Record<string, { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'yellow', label: 'Pendiente' },
  por_liquidar: { tone: 'orange', label: 'Por Liquidar' },
  en_progreso: { tone: 'blue', label: 'En Progreso' },
  completado: { tone: 'green', label: 'Completado' },
  pagado: { tone: 'purple', label: 'Pagado' },
  cancelado: { tone: 'red', label: 'Cancelado' },
};

const PRODUCTION_OCCUPATIONS = ['cortador', 'guarnecedor', 'solador', 'emplantillador'];

const OCCUPATION_LABELS: Record<string, string> = {
  cortador: 'Cortador',
  guarnecedor: 'Guarnecedor',
  solador: 'Solador',
  emplantillador: 'Emplantillador',
};

// ─── Chip de filtro ─────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'rounded-full border px-4 py-2',
        active
          ? 'border-primary bg-primary dark:border-primary-light dark:bg-primary-light'
          : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900',
      )}
    >
      <Text
        className={cn(
          'text-sm font-bold',
          active ? 'text-white' : 'text-gray-600 dark:text-gray-300',
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tarjeta de tarea ───────────────────────────────────────

function TaskCard({
  task,
  onAssign,
  onChangeStatus,
  onViewOrder,
}: {
  task: ProductionTask;
  onAssign: () => void;
  onChangeStatus: () => void;
  onViewOrder: () => void;
}) {
  const typeMeta = TASK_TYPE_META[task.type] ?? TASK_TYPE_META.corte;
  const statusInfo = TASK_STATUS_BADGE[task.status] ?? TASK_STATUS_BADGE.pendiente;
  const canAssign = task.status === 'pendiente' && !task.assigned_to;
  const canChangeStatus = task.status === 'pendiente' || task.status === 'en_progreso';

  const showActions = () => {
    const buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [];
    if (canAssign) {
      buttons.push({ text: 'Asignar empleado', onPress: onAssign });
    }
    if (canChangeStatus) {
      buttons.push({ text: 'Cambiar estado', onPress: onChangeStatus });
    }
    buttons.push({ text: 'Ver orden', onPress: onViewOrder });
    buttons.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert(`Tarea de ${typeMeta.label}`, task.product_name ?? 'Sin producto', buttons);
  };

  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-3">
          <View className={cn('h-10 w-10 items-center justify-center rounded-full', typeMeta.bg)}>
            <Ionicons name={typeMeta.icon} size={20} color={typeMeta.color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {typeMeta.label}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {task.product_name ?? 'Sin producto'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={showActions} className="p-1">
          <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="person-outline" size={14} color="#64748b" />
            <Text className="text-xs text-gray-600 dark:text-gray-300" numberOfLines={1}>
              {task.assigned_user_name || 'Sin asignar'}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cube-outline" size={14} color="#3b82f6" />
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {task.amount} pares
              </Text>
            </View>
            {task.vale_number ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="pricetag-outline" size={14} color="#64748b" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Vale #{task.vale_number}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Badge tone={statusInfo.tone} label={statusInfo.label} />
      </View>
    </View>
  );
}

// ─── Modal asignar empleado ─────────────────────────────────

function AssignEmployeeModal({
  visible,
  task,
  employees,
  loading,
  onClose,
  onAssign,
}: {
  visible: boolean;
  task: ProductionTask | null;
  employees: AdminUser[];
  loading: boolean;
  onClose: () => void;
  onAssign: (employeeId: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[70%] rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Asignar empleado
            </Text>
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </View>
          {task ? (
            <Text className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Tarea de {TASK_TYPE_META[task.type]?.label ?? task.type} ·{' '}
              {task.product_name ?? 'Sin producto'}
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator size="large" color="#1e40af" className="py-8" />
          ) : employees.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Sin empleados"
              message="No hay empleados de producción disponibles para asignar"
            />
          ) : (
            <ScrollView>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => onAssign(emp.id)}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Ionicons name="person" size={16} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">
                      {emp.name} {emp.last_name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {OCCUPATION_LABELS[emp.occupation ?? ''] ?? emp.occupation}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ─────────────────────────────────────

export default function TasksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<ProductionTask | null>(null);

  const tasksQuery = useQuery<ProductionTask[]>({
    queryKey: ['admin-tasks', statusFilter, typeFilter],
    queryFn: () =>
      ordersService.getAllTasks({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const employeesQuery = useQuery<AdminUser[]>({
    queryKey: ['admin-employees'],
    queryFn: () => listAllUsers('employee'),
  });

  const productionEmployees = useMemo(
    () =>
      (employeesQuery.data ?? []).filter(
        (u) => u.occupation && PRODUCTION_OCCUPATIONS.includes(u.occupation),
      ),
    [employeesQuery.data],
  );

  const filtered = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    if (!search) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.vale_number?.toString().includes(q) ||
        t.product_name?.toLowerCase().includes(q),
    );
  }, [tasksQuery.data, search]);

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      ordersService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      showToast('Estado de la tarea actualizado', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, employeeId }: { taskId: string; employeeId: string }) =>
      ordersService.assignTask(taskId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setAssignTarget(null);
      showToast('Empleado asignado correctamente', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const handleChangeStatus = (task: ProductionTask) => {
    Alert.alert(
      'Cambiar estado',
      `Nuevo estado para la tarea de ${TASK_TYPE_META[task.type]?.label ?? task.type}`,
      [
        {
          text: 'Por Liquidar',
          onPress: () => statusMutation.mutate({ taskId: task.id, status: 'por_liquidar' }),
        },
        {
          text: 'En Progreso',
          onPress: () => statusMutation.mutate({ taskId: task.id, status: 'en_progreso' }),
        },
        {
          text: 'Completado',
          onPress: () => statusMutation.mutate({ taskId: task.id, status: 'completado' }),
        },
        {
          text: 'Pagado',
          onPress: () => statusMutation.mutate({ taskId: task.id, status: 'pagado' }),
        },
        {
          text: 'Cancelado',
          style: 'destructive',
          onPress: () => statusMutation.mutate({ taskId: task.id, status: 'cancelado' }),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleViewOrder = (task: ProductionTask) => {
    router.push(`/(admin)/order-detail?id=${task.order_id}`);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Tareas de Producción" back />

      {/* Chips por estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row items-center gap-2 px-4 py-3">
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s.key}
              label={s.label}
              active={statusFilter === s.key}
              onPress={() => setStatusFilter(s.key)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Chips por tipo de tarea */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row items-center gap-2 px-4 pb-2">
          {TYPE_FILTERS.map((t) => (
            <FilterChip
              key={t.key}
              label={t.label}
              active={typeFilter === t.key}
              onPress={() => setTypeFilter(t.key)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Búsqueda */}
      <View className="px-4 pb-3 pt-1">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar por vale o producto..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {filtered.length > 0 && (
        <View className="mx-4 mb-3 flex-row items-center justify-between rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
          <Text className="text-sm font-bold text-blue-800 dark:text-blue-300">
            {filtered.length} {filtered.length === 1 ? 'tarea' : 'tareas'}
          </Text>
        </View>
      )}

      {tasksQuery.isLoading ? (
        <Loading label="Cargando tareas..." />
      ) : tasksQuery.isError ? (
        <ErrorState
          message={getErrorMessage(tasksQuery.error)}
          onRetry={() => tasksQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title="Sin tareas"
          message={
            search || statusFilter || typeFilter
              ? 'No se encontraron tareas con los filtros actuales'
              : 'Aún no hay tareas de producción'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onAssign={() => setAssignTarget(item)}
              onChangeStatus={() => handleChangeStatus(item)}
              onViewOrder={() => handleViewOrder(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isRefetching}
              onRefresh={() => tasksQuery.refetch()}
              tintColor="#1e40af"
            />
          }
        />
      )}

      <AssignEmployeeModal
        visible={!!assignTarget}
        task={assignTarget}
        employees={productionEmployees}
        loading={employeesQuery.isLoading}
        onClose={() => setAssignTarget(null)}
        onAssign={(employeeId) => {
          if (assignTarget) {
            assignMutation.mutate({ taskId: assignTarget.id, employeeId });
          }
        }}
      />
    </View>
  );
}