import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { BrandFormModal } from '@/components/admin/BrandFormModal';
import { StyleFormModal } from '@/components/admin/StyleFormModal';
import { catalogService } from '@/services/catalogService';
import type { Brand, Style } from '@/types/catalog';
import { cn } from '@/utils/cn';

type Tab = 'brands' | 'styles' | 'categories';

export default function CatalogManageScreen() {
  const [tab, setTab] = useState<Tab>('brands');
  const queryClient = useQueryClient();

  // ─── Brands ─────────────────────────────────────────────
  const brands = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => catalogService.listAdminBrands(),
  });

  const [brandModal, setBrandModal] = useState<{ open: boolean; edit?: Brand }>({
    open: false,
  });
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);

  const brandMutation = useMutation({
    mutationFn: (vars: { id?: string; name: string; description?: string }) =>
      vars.id
        ? catalogService.updateBrand(vars.id, vars.name, vars.description)
        : catalogService.createBrand(vars.name, vars.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      Alert.alert('Listo', 'Marca guardada');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const brandDeleteMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setDeleteBrand(null);
      Alert.alert('Listo', 'Marca eliminada');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  // ─── Styles ─────────────────────────────────────────────
  const styles = useQuery({
    queryKey: ['admin-styles'],
    queryFn: () => catalogService.listAdminStyles(),
  });

  const [styleModal, setStyleModal] = useState<{ open: boolean; edit?: Style }>({
    open: false,
  });
  const [deleteStyle, setDeleteStyle] = useState<Style | null>(null);

  const styleMutation = useMutation({
    mutationFn: (vars: { id?: string; name: string; brandId: string; description?: string }) =>
      vars.id
        ? catalogService.updateStyle(vars.id, vars.name, vars.brandId, vars.description)
        : catalogService.createStyle(vars.name, vars.brandId, vars.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-styles'] });
      Alert.alert('Listo', 'Estilo guardado');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const styleDeleteMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteStyle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-styles'] });
      setDeleteStyle(null);
      Alert.alert('Listo', 'Estilo eliminado');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  // ─── Categories (read-only from public endpoint) ────────
  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => catalogService.listCategories(),
  });

  const isLoading = brands.isLoading || styles.isLoading || categories.isLoading;

  const refetch = async () => {
    await Promise.all([brands.refetch(), styles.refetch(), categories.refetch()]);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'brands', label: 'Marcas', count: brands.data?.length ?? 0 },
    { key: 'styles', label: 'Estilos', count: styles.data?.length ?? 0 },
    { key: 'categories', label: 'Categorías', count: categories.data?.length ?? 0 },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Gestionar catálogo" back />

      <View className="flex-row border-b border-gray-200 px-4 dark:border-slate-800">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            className={cn(
              'flex-1 items-center border-b-2 py-3',
              tab === t.key
                ? 'border-primary dark:border-primary-light'
                : 'border-transparent',
            )}
          >
            <Text
              className={cn(
                'text-sm font-bold',
                tab === t.key
                  ? 'text-primary dark:text-primary-light'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              {t.label} ({t.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-gray-500">Cargando...</Text>
        </View>
      ) : tab === 'brands' ? (
        <FlatList
          data={brands.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={brands.isRefetching} onRefresh={refetch} tintColor="#1e40af" />
          }
          ListHeaderComponent={
            <Button onPress={() => setBrandModal({ open: true })} className="mb-4">
              <Ionicons name="add" size={18} color="white" /> Nueva marca
            </Button>
          }
          renderItem={({ item }) => (
            <Card className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white">{item.name}</Text>
                {item.description ? (
                  <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => setBrandModal({ open: true, edit: item })} className="p-2">
                  <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteBrand(item)} className="p-2">
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-gray-500">No hay marcas registradas</Text>
          }
        />
      ) : tab === 'styles' ? (
        <FlatList
          data={styles.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={styles.isRefetching} onRefresh={refetch} tintColor="#1e40af" />
          }
          ListHeaderComponent={
            <Button onPress={() => setStyleModal({ open: true })} className="mb-4">
              <Ionicons name="add" size={18} color="white" /> Nuevo estilo
            </Button>
          }
          renderItem={({ item }) => (
            <Card className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white">{item.name}</Text>
                <Badge tone="blue" label={item.brand_name} />
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => setStyleModal({ open: true, edit: item })} className="p-2">
                  <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteStyle(item)} className="p-2">
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-gray-500">No hay estilos registrados</Text>
          }
        />
      ) : (
        <FlatList
          data={categories.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={categories.isRefetching} onRefresh={refetch} tintColor="#1e40af" />
          }
          renderItem={({ item }) => (
            <Card className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white">{item.name}</Text>
                {item.description ? (
                  <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            </Card>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-gray-500">No hay categorías</Text>
          }
        />
      )}

      {/* Modals */}
      <BrandFormModal
        visible={brandModal.open}
        onClose={() => setBrandModal({ open: false })}
        initialName={brandModal.edit?.name}
        initialDescription={brandModal.edit?.description ?? undefined}
        onSubmit={async (name, desc) => {
          await brandMutation.mutateAsync({
            id: brandModal.edit?.id,
            name,
            description: desc,
          });
        }}
      />

      <StyleFormModal
        visible={styleModal.open}
        onClose={() => setStyleModal({ open: false })}
        brands={brands.data ?? []}
        initialName={styleModal.edit?.name}
        initialDescription={styleModal.edit?.description ?? undefined}
        initialBrandId={styleModal.edit?.brand_id}
        onSubmit={async (name, brandId, desc) => {
          await styleMutation.mutateAsync({
            id: styleModal.edit?.id,
            name,
            brandId,
            description: desc,
          });
        }}
      />

      <DeleteConfirmModal
        visible={!!deleteBrand}
        onClose={() => setDeleteBrand(null)}
        onConfirm={async () => {
          if (deleteBrand) await brandDeleteMutation.mutateAsync(deleteBrand.id);
        }}
        title="Eliminar marca"
        message={`¿Estás seguro de eliminar la marca "${deleteBrand?.name}"? Esta acción no se puede deshacer.`}
        loading={brandDeleteMutation.isPending}
      />

      <DeleteConfirmModal
        visible={!!deleteStyle}
        onClose={() => setDeleteStyle(null)}
        onConfirm={async () => {
          if (deleteStyle) await styleDeleteMutation.mutateAsync(deleteStyle.id);
        }}
        title="Eliminar estilo"
        message={`¿Estás seguro de eliminar el estilo "${deleteStyle?.name}"? Esta acción no se puede deshacer.`}
        loading={styleDeleteMutation.isPending}
      />
    </View>
  );
}
