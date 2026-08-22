import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loading } from '@/components/ui/Loading';
import { ContactClientModal } from '@/components/admin/ContactClientModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ImageViewerModal } from '@/components/admin/ImageViewerModal';
import { OrderFormModal } from '@/components/admin/OrderFormModal';
import { ProductionModal } from '@/components/admin/ProductionModal';
import { ordersService } from '@/services/ordersService';
import type { OrderDetail, OrderDetailItem, OrderStatus, ProductionTask } from '@/types/orders';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/utils/cn';

const STATUS_BADGE: Record<OrderStatus, { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'yellow', label: 'Pendiente' },
  en_progreso: { tone: 'blue', label: 'En Progreso' },
  completado: { tone: 'green', label: 'Completado' },
  entregado: { tone: 'purple', label: 'Entregado' },
  cancelado: { tone: 'red', label: 'Cancelado' },
};

const TASK_TYPE_LABELS: Record<string, string> = {
  corte: 'Corte', guarnicion: 'Guarnición', soladura: 'Soladura', emplantillado: 'Emplantillado',
};

const TASK_STATUS_BADGE: Record<string, { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'yellow', label: 'Pendiente' },
  por_liquidar: { tone: 'orange', label: 'Por Liquidar' },
  en_progreso: { tone: 'blue', label: 'En Progreso' },
  completado: { tone: 'green', label: 'Completado' },
  pagado: { tone: 'purple', label: 'Pagado' },
  cancelado: { tone: 'red', label: 'Cancelado' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

interface GroupedProduct {
  product_id: string;
  product_name: string;
  brand_name: string | null;
  style_name: string | null;
  image_url: string | null;
  state: OrderStatus | null;
  items: OrderDetailItem[];
}

function groupByProduct(details: OrderDetailItem[]): GroupedProduct[] {
  const map = new Map<string, GroupedProduct>();
  for (const d of details) {
    const key = d.product_id;
    if (!map.has(key)) {
      map.set(key, {
        product_id: key,
        product_name: d.product_name || 'Producto',
        brand_name: d.brand_name,
        style_name: d.style_name,
        image_url: d.image_url,
        state: d.state,
        items: [],
      });
    }
    map.get(key)!.items.push(d);
  }
  return Array.from(map.values());
}

function StockIndicator({ available, amount }: { available: number | null; amount: number }) {
  if (available === null) return null;
  const bg = available >= amount ? 'bg-green-500' : available > 0 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <View className="flex-row items-center gap-1">
      <View className={cn('h-2 w-2 rounded-full', bg)} />
      <Text className="text-[11px] text-gray-500 dark:text-gray-400">
        {available} / {amount}
      </Text>
    </View>
  );
}

function ProductGroupCard({
  group,
  onViewImage,
  productState,
  onStartProduction,
  onEdit,
  onDelete,
}: {
  group: GroupedProduct;
  onViewImage: (url: string | null) => void;
  productState: string;
  onStartProduction: (productId: string, productName: string) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string, productName: string) => void;
}) {
  const statusInfo = group.state ? STATUS_BADGE[group.state] : null;
  const resolvedImage = resolveImageUrl(group.image_url);

  return (
    <Card className="mb-4 overflow-hidden">
      <View className="mb-3 flex-row gap-3">
        {resolvedImage ? (
          <Pressable onPress={() => onViewImage(resolvedImage)}>
            <Image
              source={{ uri: resolvedImage }}
              className="h-20 w-20 rounded-lg"
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800">
            <Ionicons name="image-outline" size={24} color="#94a3b8" />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
              {group.product_name}
            </Text>
            {statusInfo && <Badge tone={statusInfo.tone} label={statusInfo.label} />}
          </View>
          <View className="mt-1 flex-row flex-wrap gap-2">
            {group.brand_name && (
              <Badge tone="blue" label={group.brand_name} className="self-start" />
            )}
            {group.style_name && (
              <Badge tone="purple" label={group.style_name} className="self-start" />
            )}
          </View>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cube-outline" size={14} color="#3b82f6" />
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {group.items.reduce((s, i) => s + i.amount, 0)} pares
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row border-t border-gray-100 px-2 py-2 dark:border-slate-800">
        <Text className="w-[30%] text-[10px] font-bold uppercase text-gray-400">Talla</Text>
        <Text className="w-[30%] text-[10px] font-bold uppercase text-gray-400">Pares</Text>
        <Text className="w-[40%] text-[10px] font-bold uppercase text-gray-400">Stock</Text>
      </View>
      {group.items
        .sort((a, b) => (a.size || '').localeCompare(b.size || ''))
        .map((item) => (
          <View key={item.id} className="flex-row items-center border-t border-gray-50 px-2 py-2 dark:border-slate-800/50">
            <Text className="w-[30%] text-xs font-bold text-gray-900 dark:text-white">{item.size}</Text>
            <Text className="w-[30%] text-xs font-bold text-blue-600 dark:text-blue-400">{item.amount}</Text>
            <View className="w-[40%]">
              <StockIndicator available={item.stock_available} amount={item.amount} />
            </View>
          </View>
        ))}

      {productState === 'pendiente' && (
        <View className="flex-row gap-2 border-t border-gray-100 px-2 py-3 dark:border-slate-800">
          <Pressable
            onPress={() => onStartProduction(group.product_id, group.product_name)}
            className="flex-1 flex-row items-center justify-center gap-1 rounded-lg bg-blue-600 py-2.5 dark:bg-blue-500"
          >
            <Ionicons name="play-circle-outline" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Iniciar</Text>
          </Pressable>
          <Pressable
            onPress={() => onEdit(group.product_id)}
            className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-purple-300 py-2.5 dark:border-purple-700"
          >
            <Ionicons name="create-outline" size={16} color="#9333ea" />
            <Text className="text-xs font-bold text-purple-600 dark:text-purple-400">Editar</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(group.product_id, group.product_name)}
            className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-red-300 py-2.5 dark:border-red-700"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text className="text-xs font-bold text-red-600 dark:text-red-400">Eliminar</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function TaskCard({ task }: { task: ProductionTask }) {
  const statusInfo = TASK_STATUS_BADGE[task.status] || TASK_STATUS_BADGE.pendiente;
  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-gray-900 dark:text-white">
          {TASK_TYPE_LABELS[task.type] || task.type}
        </Text>
        <Badge tone={statusInfo.tone} label={statusInfo.label} />
      </View>
      <View className="mt-1 flex-row items-center gap-3">
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {task.assigned_user_name || 'Sin asignar'}
        </Text>
        <Text className="text-xs text-gray-400">·</Text>
        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
          {task.amount} pares
        </Text>
        {task.vale_number != null && (
          <>
            <Text className="text-xs text-gray-400">·</Text>
            <Text className="text-xs text-gray-500">Vale #{task.vale_number}</Text>
          </>
        )}
      </View>
    </Card>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showContactModal, setShowContactModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [imageModalName, setImageModalName] = useState('');
  const [productionModalProductId, setProductionModalProductId] = useState<string | null>(null);
  const [productionModalProductName, setProductionModalProductName] = useState('');
  const [editModalProductId, setEditModalProductId] = useState<string | null>(null);
  const [deleteTargetProductId, setDeleteTargetProductId] = useState<string | null>(null);
  const [deleteTargetProductName, setDeleteTargetProductName] = useState('');

  const { data: order, isLoading, isError, error, refetch } = useQuery<OrderDetail>({
    queryKey: ['order-detail', id],
    queryFn: () => ordersService.detail(id!),
    enabled: !!id,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<ProductionTask[]>({
    queryKey: ['order-tasks', id],
    queryFn: () => ordersService.getOrderTasks(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, state }: { orderId: string; state: OrderStatus }) =>
      ordersService.updateStatus(orderId, { state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!order) return;
      const remaining = order.details.filter((d) => d.product_id !== productId);
      await ordersService.updateDetails(order.id, {
        details: remaining.map((d) => ({
          product_id: d.product_id,
          size: d.size,
          colour: d.colour ?? undefined,
          amount: d.amount,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteTargetProductId(null);
    },
  });

  const grouped = useMemo(() => (order ? groupByProduct(order.details) : []), [order]);

  const handleStatusChange = (newState: OrderStatus) => {
    if (!order) return;
    const labels: Record<OrderStatus, string> = {
      pendiente: 'Pendiente', en_progreso: 'En Progreso', completado: 'Completado',
      entregado: 'Entregado', cancelado: 'Cancelado',
    };
    Alert.alert('Cambiar estado', `¿Cambiar estado a "${labels[newState]}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => statusMutation.mutate({ orderId: order.id, state: newState }) },
    ]);
  };

  const handleOpenImage = (url: string | null) => { if (url) { setImageModalUrl(url); setImageModalName('Imagen del producto'); } };

  const handleOpenProduction = (productId: string, productName: string) => {
    setProductionModalProductId(productId);
    setProductionModalProductName(productName);
  };

  const handleEditProduct = (productId: string) => {
    setEditModalProductId(productId);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteTargetProductId(productId);
    setDeleteTargetProductName(productName);
  };

  if (isLoading) return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Detalle" back />
      <Loading label="Cargando pedido..." />
    </View>
  );

  if (isError || !order) return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Detalle" back />
      <ErrorState message={error?.message || 'No se pudo cargar el pedido'} onRetry={() => refetch()} />
    </View>
  );

  const statusInfo = STATUS_BADGE[order.state];
  const customer = [order.customer_name, order.customer_last_name].filter(Boolean).join(' ') || 'Sin identificar';

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title={`Pedido #${order.id.slice(0, 8)}`} back />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Card className="mx-4 mt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Badge tone={statusInfo.tone} label={statusInfo.label} />
            <Text className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.created_at)}</Text>
          </View>

          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons name="person-outline" size={16} color="#64748b" />
            <Text className="text-sm font-bold text-gray-900 dark:text-white">{customer}</Text>
          </View>

          {order.customer_phone && (
            <View className="mb-1 flex-row items-center gap-2">
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-300">{order.customer_phone}</Text>
            </View>
          )}
          {order.customer_email && (
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons name="mail-outline" size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-300">{order.customer_email}</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="cube-outline" size={18} color="#3b82f6" />
              <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">{order.total_pairs} pares</Text>
            </View>
            {order.delivery_date && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">Entrega: {formatDate(order.delivery_date)}</Text>
              </View>
            )}
          </View>
        </Card>

        <Pressable onPress={() => setShowContactModal(true)} className="mx-4 mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 dark:border-slate-700">
          <Ionicons name="chatbubbles-outline" size={16} color="#3b82f6" />
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">Contactar Cliente</Text>
        </Pressable>

        <View className="mx-4 mt-4">
          <Text className="mb-2 text-base font-bold text-gray-900 dark:text-white">Detalles del Pedido</Text>
          {grouped.length === 0 ? (
            <EmptyState icon="cube-outline" title="Sin detalles" message="Este pedido no tiene líneas de producto" />
          ) : (
            grouped.map((group) => (
              <ProductGroupCard
                key={group.product_id}
                group={group}
                onViewImage={handleOpenImage}
                productState={order.state}
                onStartProduction={handleOpenProduction}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))
          )}
        </View>

        {order.state === 'pendiente' && (
          <View className="mx-4 mt-3">
            <Pressable onPress={() => handleStatusChange('cancelado')} className="items-center rounded-xl border border-red-300 py-3 dark:border-red-700">
              <Text className="text-sm font-bold text-red-600 dark:text-red-400">Cancelar Pedido</Text>
            </Pressable>
          </View>
        )}
        {order.state === 'en_progreso' && (
          <View className="mx-4 mt-3">
            <Pressable onPress={() => handleStatusChange('completado')} className="items-center rounded-xl bg-green-600 py-3 dark:bg-green-500">
              <Text className="text-sm font-bold text-white">Marcar Completado</Text>
            </Pressable>
          </View>
        )}
        {order.state === 'completado' && (
          <View className="mx-4 mt-3">
            <Pressable onPress={() => handleStatusChange('entregado')} className="items-center rounded-xl bg-purple-600 py-3 dark:bg-purple-500">
              <Text className="text-sm font-bold text-white">Marcar Entregado</Text>
            </Pressable>
          </View>
        )}

        <View className="mx-4 mt-4">
          <Text className="mb-2 text-base font-bold text-gray-900 dark:text-white">Tareas de Producción</Text>
          {tasksLoading ? (
            <ActivityIndicator size="small" color="#1e40af" className="mt-2" />
          ) : !tasks || tasks.length === 0 ? (
            <EmptyState icon="checkbox-outline" title="Sin tareas" message="Aún no se han creado tareas para este pedido" />
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </View>
      </ScrollView>

      <ContactClientModal visible={showContactModal} onClose={() => setShowContactModal(false)} clientName={customer} clientEmail={order.customer_email} clientPhone={order.customer_phone} orderId={order.id} />
      <ImageViewerModal visible={!!imageModalUrl} imageUrl={imageModalUrl} productName={imageModalName} onClose={() => setImageModalUrl(null)} />
      {productionModalProductId && <ProductionModal visible={!!productionModalProductId} onClose={() => setProductionModalProductId(null)} order={order} productId={productionModalProductId} productName={productionModalProductName} />}
      <DeleteConfirmModal
        visible={!!deleteTargetProductId}
        onClose={() => setDeleteTargetProductId(null)}
        onConfirm={() => deleteProductMutation.mutateAsync(deleteTargetProductId!)}
        title="Eliminar producto"
        message={`Se eliminar\u00e1 "${deleteTargetProductName}" y todas sus l\u00edneas del pedido. \u00bfConfirmas?`}
        loading={deleteProductMutation.isPending}
      />
      <OrderFormModal
        visible={!!editModalProductId}
        onClose={() => setEditModalProductId(null)}
        orderId={order.id}
        editProductId={editModalProductId}
        orderDetails={order.details}
      />
    </View>
  );
}
