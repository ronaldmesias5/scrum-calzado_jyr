import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { useToast } from '@/components/ui/Toast';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { catalogService } from '@/services/catalogService';
import type { Product, ProductListResponse } from '@/types/catalog';
import { cn } from '@/utils/cn';

const CATEGORY_COLORS: BadgeTone[] = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'];

function ProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const stock = product.stock_total ?? 0;
  const isLow = product.insufficient_threshold > 0 && stock < product.insufficient_threshold;

  const showActions = () => {
    const options = ['Editar', product.state ? 'Desactivar' : 'Activar', 'Eliminar', 'Cancelar'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 3, destructiveButtonIndex: 2 }, (i) => {
        if (i === 0) onEdit();
        else if (i === 1) onToggle();
        else if (i === 2) onDelete();
      });
    } else {
      onEdit();
    }
  };

  return (
    <View
      className={cn(
        'mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900/50',
      )}
    >
      <View className="flex-row gap-3">
        {product.image_url ? (
          <Image source={{ uri: resolveImageUrl(product.image_url) }} className="h-16 w-16 rounded-lg" resizeMode="cover" />
        ) : (
          <View className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800">
            <Ionicons name="image-outline" size={24} color="#94a3b8" />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {product.brand_name} · {product.style_name}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Badge tone={CATEGORY_COLORS[0]} label={product.category_name} />
            {product.color ? <Badge tone="purple" label={product.color} /> : null}
          </View>
        </View>

        <TouchableOpacity onPress={showActions} className="self-start p-1">
          <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={isLow ? 'warning-outline' : 'cube-outline'} size={14} color={isLow ? '#f59e0b' : '#3b82f6'} />
          <Text className={cn('text-sm font-bold', isLow ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400')}>
            {stock} pares
          </Text>
          {isLow ? <Text className="text-xs text-amber-500">(bajo)</Text> : null}
        </View>

        <View className="flex-row items-center gap-1">
          <View className={cn('h-2.5 w-2.5 rounded-full', product.state ? 'bg-green-500' : 'bg-red-500')} />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {product.state ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const [search, setSearch] = useState('');
  const [productModal, setProductModal] = useState<{ open: boolean; edit?: Product }>({ open: false });
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
  } = useInfiniteQuery<ProductListResponse>({
    queryKey: ['admin-products', search],
    queryFn: ({ pageParam = 1 }) =>
      catalogService.listProducts({ page: pageParam as number, page_size: 10 }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allProducts = data?.pages.flatMap((p) => p.products) ?? [];
  const products = search
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
          p.style_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : allProducts;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleMutation = useMutation({
    mutationFn: (id: string) => catalogService.toggleProductState(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast('Estado del producto actualizado', 'success');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showToast('Producto eliminado', 'success');
      setDeleteProduct(null);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Catálogo" back />

      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar producto, marca o estilo..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/catalog-manage')}
          className="rounded-xl bg-gray-100 p-3 dark:bg-slate-800"
        >
          <Ionicons name="settings-outline" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
          <Text className="mt-3 text-sm text-gray-500">Cargando catálogo...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Ionicons name="cloud-offline-outline" size={48} color="#94a3b8" />
          <Text className="text-center text-gray-500">{error?.message || 'Error al cargar'}</Text>
          <Button onPress={() => refetch()}>Reintentar</Button>
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Ionicons name="albums-outline" size={48} color="#94a3b8" />
          <Text className="text-center text-gray-500">
            {search ? 'No se encontraron productos' : 'Aún no hay productos'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEdit={() => setProductModal({ open: true, edit: item })}
              onToggle={() => toggleMutation.mutate(item.id)}
              onDelete={() => setDeleteProduct(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#1e40af" />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4"><ActivityIndicator size="small" color="#1e40af" /></View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setProductModal({ open: true })}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <ProductFormModal
        visible={productModal.open}
        onClose={() => setProductModal({ open: false })}
        editProduct={productModal.edit}
      />

      <DeleteConfirmModal
        visible={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={async () => {
          if (deleteProduct) await deleteMutation.mutateAsync(deleteProduct.id);
        }}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar "${deleteProduct?.name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}
