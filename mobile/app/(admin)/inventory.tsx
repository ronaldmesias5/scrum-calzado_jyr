import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { AdjustInventoryModal } from '@/components/admin/AdjustInventoryModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { catalogService } from '@/services/catalogService';
import type { InventoryItem } from '@/types/catalog';
import { cn } from '@/utils/cn';

function InventoryCard({
  item,
  onAdjust,
  onDelete,
}: {
  item: InventoryItem;
  onAdjust: () => void;
  onDelete: () => void;
}) {
  const showActions = () => {
    const options = ['Ajustar cantidad', 'Eliminar', 'Cancelar'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, destructiveButtonIndex: 1 },
        (i) => {
          if (i === 0) onAdjust();
          else if (i === 1) onDelete();
        },
      );
    } else {
      Alert.alert('Inventario', `${item.product_name} — Talla ${item.size}`, [
        { text: 'Ajustar', onPress: onAdjust },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  return (
    <View
      className={cn(
        'mx-4 mb-3 flex-row items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900/50',
      )}
    >
      <View className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
        <Ionicons name="cube-outline" size={18} color="#3b82f6" />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {item.product_name}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">Talla {item.size}</Text>
      </View>

      <View className="items-end">
        <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.quantity}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">pares</Text>
      </View>

      <TouchableOpacity onPress={showActions} className="ml-2 p-1">
        <Ionicons name="ellipsis-vertical" size={16} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item?: InventoryItem }>({
    open: false,
  });
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const queryClient = useQueryClient();

  const {
    data: inventory,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: () => catalogService.listInventory(),
  });

  const filtered = search
    ? (inventory ?? []).filter(
        (item) =>
          item.product_name.toLowerCase().includes(search.toLowerCase()) ||
          item.size.toLowerCase().includes(search.toLowerCase()),
      )
    : inventory ?? [];

  const totalPairs = filtered.reduce((sum, item) => sum + item.quantity, 0);

  const adjustMutation = useMutation({
    mutationFn: (vars: { productId: string; size: string; quantity: number }) =>
      catalogService.createOrUpdateInventory(vars.productId, vars.size, vars.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      Alert.alert('Listo', 'Inventario actualizado');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeleteItem(null);
      Alert.alert('Listo', 'Registro eliminado');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Inventario" back />

      <View className="px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar producto o talla..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {filtered.length > 0 && (
        <View className="mx-4 mb-3 flex-row items-center justify-between rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
          <Text className="text-sm font-bold text-blue-800 dark:text-blue-300">
            {filtered.length} registros · {totalPairs} pares totales
          </Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
          <Text className="mt-3 text-sm text-gray-500">Cargando inventario...</Text>
        </View>
      ) : isError ? (
        <ErrorState message={error?.message || 'No se pudo cargar el inventario'} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="Sin inventario"
          message={search ? 'No se encontraron registros' : 'Aún no hay registros de inventario'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InventoryCard
              item={item}
              onAdjust={() => setAdjustModal({ open: true, item })}
              onDelete={() => setDeleteItem(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#1e40af" />
          }
        />
      )}

      <AdjustInventoryModal
        visible={adjustModal.open}
        onClose={() => setAdjustModal({ open: false })}
        productName={adjustModal.item?.product_name ?? ''}
        currentSize={adjustModal.item?.size}
        currentQuantity={adjustModal.item?.quantity}
        onSubmit={async (size, quantity) => {
          await adjustMutation.mutateAsync({
            productId: adjustModal.item?.product_id ?? '',
            size,
            quantity,
          });
        }}
      />

      <DeleteConfirmModal
        visible={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (deleteItem) await deleteMutation.mutateAsync(deleteItem.id);
        }}
        title="Eliminar registro"
        message={`¿Eliminar inventario de "${deleteItem?.product_name}" talla ${deleteItem?.size}?`}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}
