import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loading } from '@/components/ui/Loading';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationsService';
import type { Notification } from '@/types/notifications';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

const TYPE_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  advertencia: { icon: 'warning', color: '#f59e0b' },
  info: { icon: 'information-circle', color: '#3b82f6' },
  exito: { icon: 'checkmark-circle', color: '#22c55e' },
  error: { icon: 'alert-circle', color: '#ef4444' },
};

function formatTime(time: string): string {
  if (!time) return '';
  try {
    const d = new Date(time);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return time;
  }
}

function NotificationCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Notification;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const meta = TYPE_ICON[item.type_notification] ?? TYPE_ICON.info;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn(
        'mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900/50',
        'active:scale-[0.98]',
      )}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className={cn(
                'flex-1 text-sm font-bold text-gray-900 dark:text-white',
                !item.is_read && 'font-extrabold',
              )}
              numberOfLines={1}
            >
              {item.title_notification}
            </Text>
            {!item.is_read && <View className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
          </View>
          <Text className="mt-1 text-sm text-gray-600 dark:text-gray-300" numberOfLines={3}>
            {item.message_notification}
          </Text>
          <Text className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AlertsScreen() {
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(50),
    staleTime: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  };

  const markReadMut = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const items = notifications.data?.items ?? [];
  const unreadCount = notifications.data?.unread_count ?? 0;

  const confirmDelete = (item: Notification) => {
    Alert.alert('Eliminar alerta', '¿Eliminar esta alerta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteMut.mutate(item.id),
      },
    ]);
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    Alert.alert('Marcar todo leído', '¿Marcar todas las alertas como leídas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Marcar', onPress: () => markAllMut.mutate() },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Alertas" back />

      {/* Header action */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo leído'}
        </Text>
        <Pressable
          onPress={handleMarkAll}
          disabled={unreadCount === 0 || markAllMut.isPending}
          className={cn(
            'flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
            unreadCount > 0
              ? 'bg-blue-600 dark:bg-blue-500'
              : 'bg-gray-100 dark:bg-slate-800',
          )}
        >
          <Ionicons
            name="checkmark-done"
            size={16}
            color={unreadCount > 0 ? '#ffffff' : '#94a3b8'}
          />
          <Text
            className={cn(
              'text-xs font-bold',
              unreadCount > 0 ? 'text-white' : 'text-gray-400',
            )}
          >
            Marcar todo leído
          </Text>
        </Pressable>
      </View>

      {notifications.isLoading ? (
        <Loading label="Cargando alertas..." />
      ) : notifications.isError ? (
        <ErrorState
          message="No se pudieron cargar las alertas"
          onRetry={() => notifications.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Sin alertas"
          message="No tienes notificaciones por ahora"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => {
                if (!item.is_read) markReadMut.mutate(item.id);
              }}
              onLongPress={() => confirmDelete(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={() => notifications.refetch()}
              tintColor="#1e40af"
            />
          }
        />
      )}
    </View>
  );
}
