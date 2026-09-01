import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ordersService } from '@/services/ordersService';
import { listAllUsers, type AdminUser } from '@/services/adminService';
import type { OrderDetail, ProductionTask } from '@/types/orders';
import { cn } from '@/utils/cn';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const STAGES = [
  { key: 'corte', label: 'Corte', icon: 'cut-outline', occupation: 'cortador', color: '#f59e0b' },
  { key: 'guarnicion', label: 'Guarnición', icon: 'color-fill-outline', occupation: 'guarnecedor', color: '#3b82f6' },
  { key: 'soladura', label: 'Soladura', icon: 'hammer-outline', occupation: 'solador', color: '#a855f7' },
  { key: 'emplantillado', label: 'Emplantillado', icon: 'sparkles-outline', occupation: 'emplantillador', color: '#10b981' },
] as const;

const STAGE_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'Activo',
  completado: 'Hecho',
};

const STAGE_COLORS: Record<string, BadgeTone> = {
  pendiente: 'yellow',
  en_progreso: 'blue',
  completado: 'green',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface ProductionModalProps {
  visible: boolean;
  onClose: () => void;
  order: OrderDetail;
  productId: string;
  productName: string;
}

export function ProductionModal({
  visible,
  onClose,
  order,
  productId,
  productName,
}: ProductionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [option, setOption] = useState<'A' | 'B'>('B');
  const [stagePriorities, setStagePriorities] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const orderDetails = order.details.filter((d) => d.product_id === productId);

  const totalPairs = orderDetails.reduce((sum, d) => sum + d.amount, 0);
  const totalStock = orderDetails.reduce((sum, d) => sum + (d.stock_available ?? 0), 0);
  const missingCount = Math.max(0, totalPairs - totalStock);

  const {
    data: currentTasks,
    refetch: refetchTasks,
  } = useQuery<ProductionTask[]>({
    queryKey: ['order-tasks', order.id, productId],
    queryFn: () => ordersService.getOrderTasks(order.id, productId),
    enabled: visible,
  });

  const { data: employees } = useQuery<AdminUser[]>({
    queryKey: ['admin-employees'],
    queryFn: () => listAllUsers('employee'),
    staleTime: 300_000,
  });

  const tasksByStage: Record<string, ProductionTask | undefined> = {};
  if (currentTasks) {
    for (const t of currentTasks) {
      if (!tasksByStage[t.type]) tasksByStage[t.type] = t;
    }
  }

  const initTaskMutation = useMutation({
    mutationFn: async (vars: { stageKey: string; assignedTo?: string }) => {
      const stageInfo = STAGES.find((s) => s.key === vars.stageKey);
      if (!stageInfo) return;
      const pairs = option === 'A' ? totalPairs - totalStock : totalPairs;
      await ordersService.createProductionTasks(order.id, [
        {
          product_id: productId,
          assigned_to: vars.assignedTo || null,
          type: vars.stageKey,
          description: `${stageInfo.label} - ${productName}`,
          priority: stagePriorities[vars.stageKey] || 'baja',
          amount: pairs,
          line_group: orderDetails[0]?.line_group ?? 0,
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', order.id, productId] });
      refetchTasks();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      await ordersService.updateTaskStatus(taskId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', order.id, productId] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', order.id] });
      refetchTasks();
    },
  });

  const handleStartStage = (stageKey: string) => {
    const stage = STAGES.find((s) => s.key === stageKey);
    if (!stage) return;
    const prevStage = STAGES[STAGES.findIndex((s) => s.key === stageKey) - 1];
    if (prevStage && !tasksByStage[prevStage.key]) {
      Alert.alert('Bloqueado', `Completa "${prevStage.label}" primero`);
      return;
    }
    Alert.alert(
      `Iniciar ${stage.label}`,
      '¿Confirmar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar', onPress: () => initTaskMutation.mutate({ stageKey }) },
      ],
    );
  };

  const handleUpdateStatus = (taskId: string, status: string) => {
    const task = currentTasks?.find((t) => t.id === taskId);
    const stage = STAGES.find((s) => s.key === task?.type);
    Alert.alert(
      `Estado de ${stage?.label || 'Tarea'}`,
      `Cambiar a "${STATUS_OPTIONS.find((s) => s.value === status)?.label || status}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => updateStatusMutation.mutate({ taskId, status }) },
      ],
    );
  };

  const handleAssign = (taskId: string) => {
    if (!employees) return;
    const task = currentTasks?.find((t) => t.id === taskId);
    const stage = STAGES.find((s) => s.key === task?.type);
    const filtered = employees.filter(
      (e) => e.occupation === stage?.occupation || e.occupation === 'jefe',
    );
    if (filtered.length === 0) {
      Alert.alert('Sin empleados', 'No hay empleados disponibles para esta etapa');
      return;
    }
    const names = filtered.map((e) => `${e.name} ${e.last_name}`);
    Alert.alert('Asignar empleado', 'Selecciona el empleado:', [
      { text: 'Cancelar', style: 'cancel' },
      ...names.map((name, idx) => ({
        text: name,
        onPress: async () => {
          const emp = filtered[idx];
          if (task) {
            await ordersService.assignTask(task.id, emp.id);
            refetchTasks();
          }
        },
      })),
    ]);
  };

  const pairsToProduce = option === 'A' ? totalPairs - totalStock : totalPairs;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white">
            Producción
          </Text>
          <View className="w-8" />
        </View>

        {/* Step indicator */}
        <View className="flex-row items-center justify-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
          <View
            className={cn(
              'h-2 flex-1 rounded-full',
              step >= 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-700',
            )}
          />
          <View
            className={cn(
              'h-2 flex-1 rounded-full',
              step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-700',
            )}
          />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {step === 1 ? (
            <>
              <Text className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Selecciona opción
              </Text>
              <Text className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {productName} — {totalPairs} pares totales
              </Text>

              {/* Option A: Solo Faltantes */}
              {missingCount > 0 && (
                <Pressable
                  onPress={() => setOption('A')}
                  className={cn(
                    'mb-3 rounded-xl border-2 p-4',
                    option === 'A'
                      ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                  )}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">
                      Opción A — Solo Faltantes
                    </Text>
                    <Badge tone="orange" label={`${missingCount} pares`} />
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Producir solo la cantidad que falta (total - stock disponible)
                  </Text>
                </Pressable>
              )}

              {/* Option B: Lote Completo */}
              <Pressable
                onPress={() => setOption('B')}
                className={cn(
                  'rounded-xl border-2 p-4',
                  option === 'B'
                    ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-gray-900 dark:text-white">
                    Opción B — Lote Completo
                  </Text>
                  <Badge tone="blue" label={`${totalPairs} pares`} />
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Producir la cantidad completa ordenada
                </Text>
              </Pressable>

              {/* Size table */}
              <Card className="mt-4">
                <Text className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                  Desglose por talla
                </Text>
                <View className="gap-1">
                  {orderDetails.map((d) => {
                    const pairs = option === 'A'
                      ? Math.max(0, d.amount - (d.stock_available ?? 0))
                      : d.amount;
                    return (
                      <View key={d.id} className="flex-row items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                        <Text className="text-sm text-gray-900 dark:text-white">
                          Talla {d.size}
                        </Text>
                        <View className="flex-row items-center gap-3">
                          <Text className="text-xs text-gray-500">
                            Stock: {d.stock_available ?? 0}
                          </Text>
                          <Text className="text-xs font-bold text-primary">Producir: {pairs}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </>
          ) : (
            <>
              <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                Hoja de Producción
              </Text>

              {/* Product info card */}
              <Card className="mb-4">
                <View className="flex-row items-center gap-3">
                  {order.details[0]?.image_url && (
                    <Image
                      source={{ uri: resolveImageUrl(order.details[0].image_url) }}
                      className="h-12 w-12 rounded-lg"
                      resizeMode="cover"
                    />
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">{productName}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {customer(order)} · {pairsToProduce} pares a producir
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Size table */}
              <Card className="mb-4">
                <Text className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                  Tallas
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {orderDetails.map((d) => {
                    const pairs = option === 'A'
                      ? Math.max(0, d.amount - (d.stock_available ?? 0))
                      : d.amount;
                    return (
                      <View key={d.id} className="flex-1 min-w-[60px] items-center rounded-lg bg-gray-100 py-2 dark:bg-slate-800">
                        <Text className="text-xs text-gray-500">{d.size}</Text>
                        <Text className="text-sm font-bold text-primary">{pairs}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>

              {/* 4 Stage cards */}
              {STAGES.map((stage) => {
                const task = tasksByStage[stage.key];
                const stageIndex = STAGES.findIndex((s) => s.key === stage.key);
                const prevDone = stageIndex === 0 || !!tasksByStage[STAGES[stageIndex - 1].key];
                const isBlocked = !prevDone && !task;

                return (
                  <Card
                    key={stage.key}
                    className={cn('mb-3', isBlocked && 'opacity-50')}
                  >
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name={stage.icon as any} size={18} color={stage.color} />
                        <Text className="text-sm font-bold text-gray-900 dark:text-white">
                          {stage.label}
                        </Text>
                      </View>
                      {task ? (
                        <Badge
                          tone={STAGE_COLORS[task.status] || 'yellow'}
                          label={STAGE_LABELS[task.status] || task.status}
                        />
                      ) : (
                        <Badge tone="yellow" label="Pendiente" />
                      )}
                    </View>

                    {task && (
                      <View className="mb-2 flex-row items-center gap-2">
                        <Ionicons name="person-outline" size={12} color="#94a3b8" />
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {task.assigned_user_name || 'Sin asignar'}
                        </Text>
                        <Text className="text-xs text-gray-400">·</Text>
                        <Text className="text-xs font-bold text-primary">
                          {task.amount} pares
                        </Text>
                        {task.vale_number != null && (
                          <>
                            <Text className="text-xs text-gray-400">·</Text>
                            <Text className="text-xs text-gray-500">Vale #{task.vale_number}</Text>
                          </>
                        )}
                      </View>
                    )}

                    <View className="flex-row gap-2">
                      {!task && !isBlocked && (
                        <>
                          <View className="flex-1">
                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Prioridad</Text>
                            <View className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                              <Picker
                                selectedValue={stagePriorities[stage.key] || 'baja'}
                                onValueChange={(value) => setStagePriorities(p => ({ ...p, [stage.key]: value }))}
                              >
              <Picker.Item label="Alta" value="alta" />
              <Picker.Item label="Baja" value="baja" />
                              </Picker>
                            </View>
                          </View>
                          <Button
                            title={`Iniciar ${stage.label}`}
                            onPress={() => handleStartStage(stage.key)}
                            className="flex-1"
                          />
                        </>
                      )}
                      {!task && !isBlocked && (
                        <Button
                          title="Asignar"
                          variant="outline"
                          onPress={() => {
                            // Create task first, then assign
                            initTaskMutation.mutate({ stageKey: stage.key });
                          }}
                          className="flex-1"
                        />
                      )}
                      {task && task.status !== 'completado' && (
                        <View className="flex-row gap-2 flex-1">
                          {task.status === 'pendiente' && (
                            <Button
                              title="Asignar"
                              variant="outline"
                              onPress={() => handleAssign(task.id)}
                              className="flex-1"
                            />
                          )}
                          {['en_progreso', 'pendiente'].includes(task.status) && (
                            <Button
                              title="Completar"
                              onPress={() => handleUpdateStatus(task.id, 'completado')}
                              className="flex-1"
                            />
                          )}
                        </View>
                      )}
                      {task?.status === 'completado' && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          <Text className="text-xs font-bold text-green-600">Completado</Text>
                        </View>
                      )}
                    </View>
                  </Card>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="border-t border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          {step === 1 ? (
            <Button
              title={`Configurar Personal y Tareas (${pairsToProduce} pares)`}
              onPress={() => setStep(2)}
            />
          ) : (
            <Button title="Cerrar" variant="outline" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function customer(order: OrderDetail) {
  return (
    [order.customer_name, order.customer_last_name]
      .filter(Boolean)
      .join(' ') || 'Sin identificar'
  );
}