import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ordersService } from '@/services/ordersService';
import { listClients, type AdminUser } from '@/services/adminService';
import { catalogService } from '@/services/catalogService';
import type { Product } from '@/types/catalog';
import type { OrderDetailItem } from '@/types/orders';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

interface LineItem {
  uid: string;
  product_id: string;
  product_name: string;
  size: string;
  amount: string;
  colour: string;
}

interface OrderFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  orderId?: string;
  editProductId?: string | null;
  orderDetails?: OrderDetailItem[];
  addProductMode?: boolean;
}


export function OrderFormModal({ visible, onClose, onSuccess, orderId, editProductId, orderDetails, addProductMode = false }: OrderFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!orderId && !!editProductId;
  const isAddToOrder = !!orderId && addProductMode && !editProductId;
  const [selectedClient, setSelectedClient] = useState<AdminUser | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  const clientsQuery = useQuery({
    queryKey: ['admin-clients'],
    queryFn: listClients,
    enabled: showClientPicker,
    staleTime: 120_000,
  });

  const productsQuery = useQuery({
    queryKey: ['admin-products-for-order'],
    queryFn: () => catalogService.listProducts({ page: 1, page_size: 200 }),
    enabled: showProductPicker,
    staleTime: 120_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        if (!orderId || !editProductId || !orderDetails) return;
        const editedLines = lineItems.map((item) => ({
          product_id: editProductId,
          size: item.size,
          colour: item.colour || undefined,
          amount: parseInt(item.amount, 10) || 0,
        }));
        const otherLines = orderDetails
          .filter((d) => d.product_id !== editProductId)
          .map((d) => ({
            product_id: d.product_id,
            size: d.size,
            colour: d.colour ?? undefined,
            amount: d.amount,
          }));
        await ordersService.updateDetails(orderId, {
          delivery_date: orderDetails[0]?.order_date ?? null,
          details: [...otherLines, ...editedLines],
        });
      } else if (isAddToOrder) {
        if (!orderId || !orderDetails) return;
        if (lineItems.length === 0) throw new Error('Agrega al menos un producto');
        const existingLines = orderDetails.map((d) => ({
          product_id: d.product_id,
          size: d.size,
          colour: d.colour ?? undefined,
          amount: d.amount,
        }));
        const newLines = lineItems.map((item) => ({
          product_id: item.product_id,
          size: item.size,
          colour: item.colour || undefined,
          amount: parseInt(item.amount, 10) || 0,
        }));
        await ordersService.updateDetails(orderId, {
          delivery_date: orderDetails[0]?.order_date ?? null,
          details: [...existingLines, ...newLines],
        });
      } else {
        if (!selectedClient) throw new Error('Selecciona un cliente');
        if (lineItems.length === 0) throw new Error('Agrega al menos un producto');

        const totalPairs = lineItems.reduce(
          (sum, item) => sum + (parseInt(item.amount, 10) || 0),
          0,
        );
        if (totalPairs <= 0) throw new Error('La cantidad total debe ser mayor a 0');

        await ordersService.create({
          customer_id: selectedClient.id,
          total_pairs: totalPairs,
          delivery_date: deliveryDate || null,
          details: lineItems.map((item) => ({
            product_id: item.product_id,
            size: item.size,
            colour: item.colour || undefined,
            amount: parseInt(item.amount, 10) || 0,
          })),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (isEditMode || isAddToOrder) {
        queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      }
      resetForm();
      onClose();
      onSuccess?.();
    },
    onError: (err: Error) => {
      Alert.alert('Error', getErrorMessage(err));
    },
  });

  const resetForm = useCallback(() => {
    setSelectedClient(null);
    setDeliveryDate('');
    setLineItems([]);
    setClientSearch('');
    setProductSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStyle('');
  }, []);

  useEffect(() => {
    if (!visible) {
      resetForm();
    } else if (isEditMode && editProductId && orderDetails) {
      const productLines = orderDetails.filter((d) => d.product_id === editProductId);
      setLineItems(
        productLines.map((d) => ({
          uid: d.id,
          product_id: d.product_id,
          product_name: d.product_name || 'Producto',
          size: d.size,
          amount: String(d.amount),
          colour: d.colour ?? '',
        })),
      );
    } else if (isAddToOrder) {
      setLineItems([]);
    }
  }, [visible, isEditMode, isAddToOrder, editProductId, orderDetails, resetForm]);

  const addLineItem = (product: Product) => {
    setLineItems((prev) => [
      ...prev,
      {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product_id: product.id,
        product_name: product.name,
        size: '',
        amount: '1',
        colour: product.color ?? '',
      },
    ]);
  };

  const updateLineItem = (uid: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.uid === uid ? { ...item, [field]: value } : item)),
    );
  };

  const removeLineItem = (uid: string) => {
    setLineItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const totalPairs = lineItems.reduce(
    (sum, item) => sum + (parseInt(item.amount, 10) || 0),
    0,
  );

  const filteredClients = (clientsQuery.data ?? []).filter((c) => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const allProducts = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach((p) => {
      if (p.category_id && p.category_name) map.set(p.category_id, p.category_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allProducts]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    allProducts
      .filter((p) => !selectedCategory || p.category_id === selectedCategory)
      .forEach((p) => {
        if (p.brand_id && p.brand_name) map.set(p.brand_id, p.brand_name);
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allProducts, selectedCategory]);

  const styles = useMemo(() => {
    const map = new Map<string, string>();
    allProducts
      .filter((p) => {
        if (selectedCategory && p.category_id !== selectedCategory) return false;
        if (selectedBrand && p.brand_id !== selectedBrand) return false;
        return true;
      })
      .forEach((p) => {
        if (p.style_id && p.style_name) map.set(p.style_id, p.style_name);
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allProducts, selectedCategory, selectedBrand]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (selectedBrand && p.brand_id !== selectedBrand) return false;
      if (selectedStyle && p.style_id !== selectedStyle) return false;
      if (productSearch) {
        const q = productSearch.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchColor = p.color?.toLowerCase().includes(q);
        const matchBrand = p.brand_name?.toLowerCase().includes(q);
        const matchStyle = p.style_name?.toLowerCase().includes(q);
        if (!matchName && !matchColor && !matchBrand && !matchStyle) return false;
      }
      return true;
    });
  }, [allProducts, selectedCategory, selectedBrand, selectedStyle, productSearch]);

  const addedProductIds = useMemo(() => {
    return new Set(lineItems.map((item) => item.product_id));
  }, [lineItems]);

  const handleOpenProductPicker = () => {
    setProductSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStyle('');
    setShowProductPicker(true);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {isAddToOrder ? 'Agregar Producto' : isEditMode ? 'Editar Producto' : 'Nuevo Pedido'}
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
          {!isEditMode && !isAddToOrder && (
            <>
              <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Cliente *
              </Text>
              <Pressable
                onPress={() => setShowClientPicker(true)}
                className={cn(
                  'mb-4 flex-row items-center justify-between rounded-xl border bg-white px-4 py-3',
                  'border-gray-200 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    selectedClient
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {selectedClient
                    ? `${selectedClient.name} ${selectedClient.last_name}`
                    : 'Seleccionar cliente...'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>

              <Input
                label="Fecha de entrega (opcional)"
                placeholder="YYYY-MM-DD"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                keyboardType="numbers-and-punctuation"
              />
            </>
          )}

          {isAddToOrder && (
            <View className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
              <Text className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Agregando producto al pedido existente
              </Text>
            </View>
          )}

          {/* Productos */}
          <View className="mb-3 mt-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {isEditMode ? 'Tallas' : 'Productos *'}
            </Text>
            <Badge tone="blue" label={`${lineItems.length} \u00edtems`} />
          </View>

          {lineItems.map((item) => (
            <Card key={item.uid} className="mb-3 gap-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {item.product_name}
                  </Text>
                  {item.colour ? (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{item.colour}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => removeLineItem(item.uid)} className="p-1">
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">Talla</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="39"
                    placeholderTextColor="#94a3b8"
                    value={item.size}
                    onChangeText={(v) => updateLineItem(item.uid, 'size', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">Cantidad</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={(v) => updateLineItem(item.uid, 'amount', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">Color</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="Negro"
                    placeholderTextColor="#94a3b8"
                    value={item.colour}
                    onChangeText={(v) => updateLineItem(item.uid, 'colour', v)}
                  />
                </View>
              </View>
            </Card>
          ))}

          <Pressable
            onPress={handleOpenProductPicker}
            className={cn(
              'mb-4 flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4',
              'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20',
            )}
          >
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {isAddToOrder || isEditMode ? 'Agregar talla' : 'Agregar producto'}
            </Text>
          </Pressable>

          {/* Resumen */}
          {lineItems.length > 0 && (
            <Card className="mb-4 items-center gap-1 py-3">
              <Text className="text-sm text-gray-500 dark:text-gray-400">Total de pares</Text>
              <Text className="text-2xl font-bold text-primary">{totalPairs}</Text>
            </Card>
          )}

          {/* Submit */}
          <Button
            title={createMutation.isPending ? 'Guardando...' : isAddToOrder ? 'Agregar al Pedido' : isEditMode ? 'Guardar cambios' : 'Crear pedido'}
            onPress={() => createMutation.mutate()}
            disabled={createMutation.isPending || (!isEditMode && !isAddToOrder && !selectedClient) || lineItems.length === 0}
            loading={createMutation.isPending}
          />
        </ScrollView>

        {/* Client Picker */}
        <Modal visible={showClientPicker} animationType="slide" statusBarTranslucent>
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-700">
              <Pressable onPress={() => setShowClientPicker(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Seleccionar cliente
              </Text>
              <View className="w-8" />
            </View>
            <View className="px-4 py-2">
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Buscar cliente..."
                placeholderTextColor="#94a3b8"
                value={clientSearch}
                onChangeText={setClientSearch}
              />
            </View>
            <FlatList
              data={filteredClients}
              keyExtractor={(c) => c.id}
              renderItem={({ item: client }) => (
                <Pressable
                  onPress={() => {
                    setSelectedClient(client);
                    setShowClientPicker(false);
                  }}
                  className={cn(
                    'border-b border-gray-100 px-4 py-3 dark:border-slate-800',
                    'active:bg-gray-50 dark:active:bg-slate-800',
                  )}
                >
                  <Text className="text-sm font-bold text-gray-900 dark:text-white">
                    {client.name} {client.last_name}
                  </Text>
                  <Text className="text-xs text-gray-500">{client.email}</Text>
                  {client.business_name ? (
                    <Text className="text-xs text-gray-400">{client.business_name}</Text>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState icon="people-outline" title="Sin clientes" message="No hay clientes registrados" />
              }
            />
          </SafeAreaView>
        </Modal>

        {/* Product Picker */}
        <Modal visible={showProductPicker} animationType="slide" statusBarTranslucent>
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-700">
              <Pressable onPress={() => setShowProductPicker(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Seleccionar producto
              </Text>
              <Pressable
                onPress={() => setShowProductPicker(false)}
                className="rounded-lg bg-blue-600 px-3 py-1.5"
              >
                <Text className="text-xs font-bold text-white">
                  Listo ({lineItems.length})
                </Text>
              </Pressable>
            </View>

            {/* Search bar */}
            <View className="px-4 py-2">
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="Buscar producto, color o marca..."
                placeholderTextColor="#94a3b8"
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            {/* Filters: Category → Brand → Style */}
            <View className="flex-row gap-2 px-4 pb-2">
              <View className="flex-1">
                <Text className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Categoría
                </Text>
                <View className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                  {selectedCategory ? (
                    <Pressable onPress={() => { setSelectedCategory(''); setSelectedBrand(''); setSelectedStyle(''); }}>
                      <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-400" numberOfLines={1}>
                        {categories.find((c) => c.id === selectedCategory)?.name} ✕
                      </Text>
                    </Pressable>
                  ) : (
                    <FlatList
                      data={[{ id: '', name: 'Todas' }, ...categories]}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(c) => c.id}
                      renderItem={({ item: cat }) => (
                        <Pressable
                          onPress={() => { setSelectedCategory(cat.id); setSelectedBrand(''); setSelectedStyle(''); }}
                          className={cn(
                            'mr-1.5 rounded-full px-2.5 py-1',
                            cat.id === selectedCategory || (!selectedCategory && cat.id === '')
                              ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700',
                          )}
                        >
                          <Text className={cn(
                            'text-[10px] font-bold',
                            cat.id === selectedCategory || (!selectedCategory && cat.id === '')
                              ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                          )} numberOfLines={1}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 px-4 pb-2">
              <View className="flex-1">
                <Text className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Marca
                </Text>
                <View className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                  {selectedBrand ? (
                    <Pressable onPress={() => { setSelectedBrand(''); setSelectedStyle(''); }}>
                      <Text className="text-[11px] font-bold text-purple-600 dark:text-purple-400" numberOfLines={1}>
                        {brands.find((b) => b.id === selectedBrand)?.name} ✕
                      </Text>
                    </Pressable>
                  ) : (
                    <FlatList
                      data={[{ id: '', name: 'Todas' }, ...brands]}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(b) => b.id}
                      renderItem={({ item: brand }) => (
                        <Pressable
                          onPress={() => { setSelectedBrand(brand.id); setSelectedStyle(''); }}
                          className={cn(
                            'mr-1.5 rounded-full px-2.5 py-1',
                            brand.id === selectedBrand || (!selectedBrand && brand.id === '')
                              ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700',
                          )}
                        >
                          <Text className={cn(
                            'text-[10px] font-bold',
                            brand.id === selectedBrand || (!selectedBrand && brand.id === '')
                              ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                          )} numberOfLines={1}>
                            {brand.name}
                          </Text>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 px-4 pb-2">
              <View className="flex-1">
                <Text className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Estilo
                </Text>
                <View className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                  {selectedStyle ? (
                    <Pressable onPress={() => setSelectedStyle('')}>
                      <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400" numberOfLines={1}>
                        {styles.find((s) => s.id === selectedStyle)?.name} ✕
                      </Text>
                    </Pressable>
                  ) : (
                    <FlatList
                      data={[{ id: '', name: 'Todos' }, ...styles]}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(s) => s.id}
                      renderItem={({ item: style }) => (
                        <Pressable
                          onPress={() => setSelectedStyle(style.id)}
                          className={cn(
                            'mr-1.5 rounded-full px-2.5 py-1',
                            style.id === selectedStyle || (!selectedStyle && style.id === '')
                              ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-slate-700',
                          )}
                        >
                          <Text className={cn(
                            'text-[10px] font-bold',
                            style.id === selectedStyle || (!selectedStyle && style.id === '')
                              ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                          )} numberOfLines={1}>
                            {style.name}
                          </Text>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Product count */}
            <View className="px-4 pb-2">
              <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Product grid */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(p) => p.id}
              numColumns={2}
              contentContainerClassName="px-3 pb-4 gap-2"
              columnWrapperClassName="gap-2"
              renderItem={({ item: product }) => {
                const isAdded = addedProductIds.has(product.id);
                const resolvedImage = resolveImageUrl(product.image_url);
                return (
                  <Pressable
                    onPress={() => addLineItem(product)}
                    className={cn(
                      'flex-1 rounded-xl border-2 p-2',
                      isAdded
                        ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/30'
                        : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    )}
                  >
                    {isAdded && (
                      <View className="absolute -top-1.5 -left-1.5 z-10 rounded-full bg-green-500 px-1.5 py-0.5">
                        <Text className="text-[8px] font-black text-white">AGREGADO</Text>
                      </View>
                    )}
                    {resolvedImage ? (
                      <Image
                        source={{ uri: resolvedImage }}
                        className="h-20 w-full rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-20 w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700">
                        <Ionicons name="cube-outline" size={24} color="#94a3b8" />
                      </View>
                    )}
                    <Text className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-[10px] text-gray-500 dark:text-gray-400" numberOfLines={1}>
                      {[product.brand_name, product.style_name, product.category_name].filter(Boolean).join(' · ')}
                    </Text>
                    {product.color ? (
                      <View className="mt-1 flex-row items-center gap-1">
                        <View className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-slate-600" style={{ backgroundColor: product.color }} />
                        <Text className="text-[9px] text-gray-400 dark:text-gray-500">{product.color}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                  <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sin productos</Text>
                </View>
              }
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
