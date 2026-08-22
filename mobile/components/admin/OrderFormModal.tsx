import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
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
}

export function OrderFormModal({ visible, onClose, onSuccess, orderId, editProductId, orderDetails }: OrderFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!orderId && !!editProductId;
  const [selectedClient, setSelectedClient] = useState<AdminUser | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const clientsQuery = useQuery({
    queryKey: ['admin-clients'],
    queryFn: listClients,
    enabled: showClientPicker,
    staleTime: 120_000,
  });

  const productsQuery = useQuery({
    queryKey: ['admin-products-for-order'],
    queryFn: () => catalogService.listProducts({ page: 1, page_size: 100 }),
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
      if (isEditMode) {
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
    }
  }, [visible, isEditMode, editProductId, orderDetails, resetForm]);

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
    setShowProductPicker(false);
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

  const products = productsQuery.data?.products ?? [];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Editar Producto' : 'Nuevo Pedido'}
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
          {!isEditMode && (
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
                    <Text className="text-xs text-gray-500">{item.colour}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => removeLineItem(item.uid)} className="p-1">
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500">Talla</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="39"
                    placeholderTextColor="#94a3b8"
                    value={item.size}
                    onChangeText={(v) => updateLineItem(item.uid, 'size', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500">Cantidad</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={(v) => updateLineItem(item.uid, 'amount', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-gray-500">Color</Text>
                  <TextInput
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
            onPress={() => setShowProductPicker(true)}
            className={cn(
              'mb-4 flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4',
              'border-gray-300 dark:border-slate-600',
            )}
          >
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text className="text-sm font-bold text-blue-600">{isEditMode ? 'Agregar talla' : 'Agregar producto'}</Text>
          </Pressable>

          {/* Resumen */}
          {lineItems.length > 0 && (
            <Card className="mb-4 items-center gap-1 py-3">
              <Text className="text-sm text-gray-500">Total de pares</Text>
              <Text className="text-2xl font-bold text-primary">{totalPairs}</Text>
            </Card>
          )}

          {/* Submit */}
          <Button
            title={createMutation.isPending ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear pedido'}
            onPress={() => createMutation.mutate()}
            disabled={createMutation.isPending || (!isEditMode && !selectedClient) || lineItems.length === 0}
            loading={createMutation.isPending}
          />
        </ScrollView>

        {/* Client Picker */}
        <Modal visible={showClientPicker} animationType="slide" statusBarTranslucent>
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
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
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
              <Pressable onPress={() => setShowProductPicker(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Seleccionar producto
              </Text>
              <View className="w-8" />
            </View>
            <FlatList
              data={products}
              keyExtractor={(p) => p.id}
              renderItem={({ item: product }) => (
                <Pressable
                  onPress={() => addLineItem(product)}
                  className={cn(
                    'border-b border-gray-100 px-4 py-3 dark:border-slate-800',
                    'active:bg-gray-50 dark:active:bg-slate-800',
                  )}
                >
                  <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View className="flex-row gap-2 mt-1">
                    <Badge tone="blue" label={product.brand_name} />
                    {product.style_name ? <Badge tone="purple" label={product.style_name} /> : null}
                    {product.color ? (
                      <Badge tone="yellow" label={product.color} />
                    ) : null}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState icon="cube-outline" title="Sin productos" message="No hay productos en el catálogo" />
              }
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
