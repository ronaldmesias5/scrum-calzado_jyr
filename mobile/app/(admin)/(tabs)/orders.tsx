import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OrderFormModal } from '@/components/admin/OrderFormModal';
import { ordersService } from '@/services/ordersService';
import type { Order, OrderListResponse, OrderStatus } from '@/types/orders';
import { cn } from '@/utils/cn';

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_BADGE: Record<OrderStatus, { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'yellow', label: 'Pendiente' },
  en_progreso: { tone: 'blue', label: 'En Progreso' },
  completado: { tone: 'green', label: 'Completado' },
  entregado: { tone: 'purple', label: 'Entregado' },
  cancelado: { tone: 'red', label: 'Cancelado' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const statusInfo = STATUS_BADGE[order.state];
  const customer = [order.customer_name, order.customer_last_name]
    .filter(Boolean)
    .join(' ') || 'Sin identificar';

  return (
    <Pressable
      onPress={() => router.push(`/(admin)/order-detail?id=${order.id}`)}
      className={cn(
        'mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900/50',
        'active:scale-[0.98]',
      )}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="max-w-[60%] font-mono text-xs text-gray-500 dark:text-gray-400">
          #{order.id.slice(0, 8)}
        </Text>
        <Badge tone={statusInfo.tone} label={statusInfo.label} />
      </View>

      <Text
        className="mb-1 text-base font-bold text-gray-900 dark:text-white"
        numberOfLines={1}
      >
        {customer}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="cube-outline" size={14} color="#3b82f6" />
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {order.total_pairs} pares
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(order.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AdminOrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery<OrderListResponse>({
    queryKey: ['orders', selectedStatus, search],
    queryFn: ({ pageParam = 1 }) =>
      ordersService.list(pageParam as number, 10, selectedStatus || undefined, search || undefined),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Pedidos" />

      <View className="px-4 pb-3 pt-2">
        <View className="mb-3 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar por cliente..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedStatus(item.value as OrderStatus | '')}
              className={cn(
                'mr-2 rounded-full px-3.5 py-1.5',
                selectedStatus === item.value
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  selectedStatus === item.value
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300',
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
          <Text className="mt-3 text-sm text-gray-500">Cargando pedidos...</Text>
        </View>
      ) : isError ? (
        <ErrorState
          message={error?.message || 'No se pudieron cargar los pedidos'}
          onRetry={() => refetch()}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Sin pedidos"
          message={search || selectedStatus ? 'No se encontraron pedidos con esos filtros' : 'Aún no hay pedidos registrados'}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#1e40af"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#1e40af" />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB - Crear pedido */}
      <Pressable
        onPress={() => setShowCreateModal(true)}
        className={cn(
          'absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full',
          'bg-blue-600 shadow-lg dark:bg-blue-500',
          'active:scale-95',
        )}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <OrderFormModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}
