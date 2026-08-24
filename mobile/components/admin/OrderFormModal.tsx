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
import { Loading } from '@/components/ui/Loading';
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

export function OrderFormModal({
  visible,
  onClose,
  onSuccess,
  orderId,
  editProductId,
  orderDetails,
  addProductMode = false,
}: OrderFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!orderId && !!editProductId;
  const isAddToOrder = !!orderId && addProductMode && !editProductId;

  const [selectedClient, setSelectedClient] = useState<AdminUser | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Cascade filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  // Size picker state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeAmounts, setSizeAmounts] = useState<Record<string, string>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────

  const clientsQuery = useQuery({
    queryKey: ['admin-clients'],
    queryFn: listClients,
    enabled: showClientPicker,
    staleTime: 120_000,
  });

  // Categories — loaded when modal opens
  const categoriesQuery = useQuery({
    queryKey: ['catalog-categories-for-order'],
    queryFn: () => catalogService.listCategories(),
    enabled: visible && !isEditMode,
    staleTime: 120_000,
  });

  // Products by category — derive brands from these (like web does)
  const categoryProductsQuery = useQuery({
    queryKey: ['catalog-products-by-category', selectedCategory],
    queryFn: () =>
      catalogService.listProducts({
        category_id: selectedCategory,
        page: 1,
        page_size: 100,
      }),
    enabled: visible && !isEditMode && !!selectedCategory,
    staleTime: 120_000,
  });

  // Products by category+brand — derive styles from these
  const brandProductsQuery = useQuery({
    queryKey: ['catalog-products-by-brand', selectedCategory, selectedBrand],
    queryFn: () =>
      catalogService.listProducts({
        category_id: selectedCategory,
        brand_id: selectedBrand,
        page: 1,
        page_size: 100,
      }),
    enabled: visible && !isEditMode && !!selectedCategory && !!selectedBrand,
    staleTime: 120_000,
  });

  // Products — loaded after all 3 filters selected
  const productsQuery = useQuery({
    queryKey: ['admin-products-cascade', selectedCategory, selectedBrand, selectedStyle],
    queryFn: () =>
      catalogService.listProducts({
        category_id: selectedCategory,
        brand_id: selectedBrand,
        style_id: selectedStyle,
        page: 1,
        page_size: 100,
      }),
    enabled: visible && !isEditMode && !!selectedCategory && !!selectedBrand && !!selectedStyle,
    staleTime: 120_000,
  });

  // ─── Mutations ────────────────────────────────────────────

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

  // ─── Form logic ───────────────────────────────────────────

  const resetForm = useCallback(() => {
    setSelectedClient(null);
    setDeliveryDate('');
    setLineItems([]);
    setClientSearch('');
    setProductSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStyle('');
    setSelectedProduct(null);
    setSizeAmounts({});
    setActivePreset(null);
    setAvailableSizes([]);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetForm();
    } else if (isEditMode && editProductId && orderDetails) {
      const productLines = orderDetails.filter((d) => d.product_id === editProductId);
      // Keep lineItems populated for the mutation and the compact list
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
      // Determine sizes based on first line's category (or default to 33-43)
      const firstLine = productLines[0];
      const catName = firstLine?.category_name;
      const sizes =
        catName === 'Infantil'
          ? Array.from({ length: 12 }, (_, i) => String(21 + i))
          : Array.from({ length: 11 }, (_, i) => String(33 + i));
      setAvailableSizes(sizes);
      // Aggregate amounts by size (in case of duplicates)
      const amounts: Record<string, string> = {};
      sizes.forEach((s) => (amounts[s] = '0'));
      productLines.forEach((d) => {
        amounts[d.size] = String((parseInt(amounts[d.size]) || 0) + d.amount);
      });
      setSizeAmounts(amounts);
      // Set selected product info for display
      setSelectedProduct({
        id: editProductId,
        name: firstLine?.product_name || 'Producto',
        image_url: firstLine?.image_url ?? null,
        color: firstLine?.colour ?? null,
        brand_name: firstLine?.brand_name ?? null,
        style_name: firstLine?.style_name ?? null,
        category_name: firstLine?.category_name ?? null,
      } as Product);
    } else if (isAddToOrder) {
      setLineItems([]);
    }
  }, [visible, isEditMode, isAddToOrder, editProductId, orderDetails, resetForm]);

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

  // ─── Filtered data ────────────────────────────────────────

  const filteredClients = (clientsQuery.data ?? []).filter((c) => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const categories = useMemo(() => {
    return (categoriesQuery.data ?? []).map((c) => ({ id: c.id, name: c.name }));
  }, [categoriesQuery.data]);

  // Derive brands from products that match the selected category (like web)
  const brands = useMemo(() => {
    const products = categoryProductsQuery.data?.products ?? [];
    const brandMap = new Map<string, string>();
    products.forEach((p) => {
      if (p.brand_id && p.brand_name) brandMap.set(p.brand_id, p.brand_name);
    });
    return Array.from(brandMap.entries()).map(([id, name]) => ({ id, name }));
  }, [categoryProductsQuery.data]);

  // Derive styles from products that match category + brand (like web)
  const filteredStyles = useMemo(() => {
    const products = brandProductsQuery.data?.products ?? [];
    const styleMap = new Map<string, string>();
    products.forEach((p) => {
      if (p.style_id && p.style_name) styleMap.set(p.style_id, p.style_name);
    });
    return Array.from(styleMap.entries()).map(([id, name]) => ({ id, name }));
  }, [brandProductsQuery.data]);

  const allProducts = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
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
  }, [allProducts, productSearch]);

  const addedProductIds = useMemo(() => {
    return new Set(lineItems.map((item) => item.product_id));
  }, [lineItems]);

  const cascadeReady = !!selectedCategory && !!selectedBrand && !!selectedStyle;

  // ─── Cascade filter change handlers ───────────────────────

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedBrand('');
    setSelectedStyle('');
    setProductSearch('');
  };

  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedStyle('');
    setProductSearch('');
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setProductSearch('');
  };

  // ─── Size picker presets ──────────────────────────────────

  const COMERCIAL_PATTERN: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 3,
    '5': 2,
    '6': 1,
  };

  const applyRelativeCurve = (
    curve: Record<string, number>,
    startSize: string,
    presetId: string,
  ) => {
    const newAmounts = { ...sizeAmounts };
    const startIndex = availableSizes.indexOf(startSize);
    if (startIndex !== -1) {
      availableSizes.forEach((size, idx) => {
        const offset = idx - startIndex + 1;
        newAmounts[size] = curve[String(offset)] ? String(curve[String(offset)]) : '0';
      });
      setSizeAmounts(newAmounts);
    }
    setActivePreset(presetId);
  };

  const applyFixedX = (amount: number, range: string[], presetId: string) => {
    const newAmounts = { ...sizeAmounts };
    availableSizes.forEach((size) => {
      newAmounts[size] = range.includes(size) ? String(amount) : '0';
    });
    setSizeAmounts(newAmounts);
    setActivePreset(presetId);
  };

  const applySpecificCurve = (curve: Record<string, number>, presetId: string) => {
    const newAmounts = { ...sizeAmounts };
    availableSizes.forEach((size) => {
      newAmounts[size] = String(curve[size] || '0');
    });
    setSizeAmounts(newAmounts);
    setActivePreset(presetId);
  };

  const clearSizeAmounts = () => {
    const newAmounts: Record<string, string> = {};
    availableSizes.forEach((s) => (newAmounts[s] = '0'));
    setSizeAmounts(newAmounts);
    setActivePreset(null);
  };

  const sizePairsTotal = Object.values(sizeAmounts).reduce(
    (sum, v) => sum + (parseInt(v) || 0),
    0,
  );

  const confirmProductSizes = () => {
    if (!selectedProduct) return;
    const newItems = Object.entries(sizeAmounts)
      .filter(([, amount]) => (parseInt(amount) || 0) > 0)
      .map(([size, amount]) => ({
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${size}`,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        size,
        amount,
        colour: selectedProduct.color ?? '',
      }));
    if (newItems.length === 0) {
      Alert.alert('Sin tallas', 'Ingresa al menos una cantidad mayor a 0');
      return;
    }
    setLineItems((prev) => [...prev, ...newItems]);
    setSelectedProduct(null);
    setSizeAmounts({});
    setActivePreset(null);
  };

  // ─── Dropdown component ───────────────────────────────────

  function CascadeDropdown({
    label,
    color,
    enabled,
    selectedName,
    onSelect,
    onClear,
    options,
    loading,
    emptyMessage,
  }: {
    label: string;
    color: string;
    enabled: boolean;
    selectedName: string | undefined;
    onSelect: (id: string) => void;
    onClear: () => void;
    options: { id: string; name: string }[];
    loading?: boolean;
    emptyMessage?: string;
  }) {
    const [open, setOpen] = useState(false);

    const colorClasses: Record<string, { active: string; text: string; border: string }> = {
      blue: {
        active: 'bg-blue-600',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
      },
      purple: {
        active: 'bg-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-300 dark:border-purple-700',
      },
      green: {
        active: 'bg-emerald-600',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700',
      },
    };
    const cc = colorClasses[color] ?? colorClasses.blue;

    return (
      <View className="mb-3">
        <Text className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {label}
        </Text>
        {!enabled ? (
          <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <Ionicons name="lock-closed-outline" size={14} color="#94a3b8" />
            <Text className="text-sm text-gray-400 dark:text-gray-600">
              Selecciona {label.toLowerCase()} primero
            </Text>
          </View>
        ) : selectedName && !open ? (
          <Pressable
            onPress={() => setOpen(true)}
            className={cn(
              'flex-row items-center justify-between rounded-xl border bg-white px-4 py-3 dark:bg-slate-900',
              cc.border,
            )}
          >
            <View className="flex-row items-center gap-2">
              <View className={cn('h-2.5 w-2.5 rounded-full', cc.active)} />
              <Text className={cn('text-sm font-bold', cc.text)}>{selectedName}</Text>
            </View>
            <Pressable onPress={onClear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          </Pressable>
        ) : (
          <View
            className={cn(
              'rounded-xl border bg-white dark:bg-slate-900',
              cc.border,
            )}
          >
            {loading ? (
              <View className="flex-row items-center gap-2 px-4 py-3">
                <Loading label="" />
                <Text className="text-xs text-gray-400">Cargando...</Text>
              </View>
            ) : options.length === 0 && emptyMessage ? (
              <View className="px-4 py-3">
                <Text className="text-xs text-gray-400 dark:text-gray-500 italic">{emptyMessage}</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-2 py-2 gap-1.5"
              >
                {options.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'rounded-full px-3 py-1.5',
                      opt.id === selectedCategory || opt.id === selectedBrand || opt.id === selectedStyle
                        ? cc.active
                        : 'bg-gray-100 dark:bg-slate-800',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-bold',
                        opt.id === selectedCategory || opt.id === selectedBrand || opt.id === selectedStyle
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-300',
                      )}
                      numberOfLines={1}
                    >
                      {opt.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, overflow: 'hidden' }} className="bg-gray-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {isAddToOrder
              ? 'Agregar Producto'
              : isEditMode
                ? 'Editar Producto'
                : 'Nuevo Pedido'}
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          {/* Client picker (only for new orders) */}
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

          {/* Add-to-order banner */}
          {isAddToOrder && (
            <View className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
              <Text className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Agregando producto al pedido existente
              </Text>
            </View>
          )}

          {/* ─── Cascade Filters (only for add/create, not edit) ─── */}
          {!isEditMode && (
            <View className="mb-4">
              <Text className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                Seleccionar producto
              </Text>

              <CascadeDropdown
                label="Categoría"
                color="blue"
                enabled={true}
                selectedName={categories.find((c) => c.id === selectedCategory)?.name}
                onSelect={handleCategoryChange}
                onClear={() => handleCategoryChange('')}
                options={categories}
                loading={categoriesQuery.isLoading}
              />

              <CascadeDropdown
                label="Marca"
                color="purple"
                enabled={!!selectedCategory}
                selectedName={brands.find((b) => b.id === selectedBrand)?.name}
                onSelect={handleBrandChange}
                onClear={() => handleBrandChange('')}
                options={brands}
                loading={categoryProductsQuery.isLoading}
                emptyMessage="No hay marcas para esta categoría"
              />

              <CascadeDropdown
                label="Estilo"
                color="green"
                enabled={!!selectedBrand}
                selectedName={filteredStyles.find((s) => s.id === selectedStyle)?.name}
                onSelect={handleStyleChange}
                onClear={() => handleStyleChange('')}
                options={filteredStyles}
                loading={brandProductsQuery.isLoading}
                emptyMessage="No hay estilos para esta marca"
              />

              {/* Product grid — only after all 3 filters selected */}
              {cascadeReady && (
                <>
                  {/* Search bar */}
                  <View className="mb-2 mt-1">
                    <TextInput
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder="Buscar producto, color..."
                      placeholderTextColor="#94a3b8"
                      value={productSearch}
                      onChangeText={setProductSearch}
                    />
                  </View>

                  {/* Product count */}
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {filteredProducts.length} producto
                      {filteredProducts.length !== 1 ? 's' : ''}
                    </Text>
                    {addedProductIds.size > 0 && (
                      <Badge tone="blue" label={`${addedProductIds.size} agregado${addedProductIds.size !== 1 ? 's' : ''}`} />
                    )}
                  </View>

                  {/* Loading */}
                  {productsQuery.isLoading ? (
                    <View className="items-center py-8">
                      <Loading label="Cargando productos..." />
                    </View>
                  ) : (
                    <FlatList
                      data={filteredProducts}
                      keyExtractor={(p) => p.id}
                      numColumns={2}
                      scrollEnabled={false}
                      contentContainerClassName="gap-2"
                      columnWrapperClassName="gap-2"
                      renderItem={({ item: product }) => {
                        const isAdded = addedProductIds.has(product.id);
                        const resolvedImage = resolveImageUrl(product.image_url);
                        return (
                          <Pressable
                            onPress={() => {
                              setSelectedProduct(product);
                              // Determine sizes based on category
                              const catName = categories.find(
                                (c) => c.id === selectedCategory,
                              )?.name;
                              const sizes =
                                catName === 'Infantil'
                                  ? Array.from({ length: 12 }, (_, i) => String(21 + i))
                                  : Array.from({ length: 11 }, (_, i) => String(33 + i));
                              setAvailableSizes(sizes);
                              const initial: Record<string, string> = {};
                              sizes.forEach((s) => (initial[s] = '0'));
                              setSizeAmounts(initial);
                              setActivePreset(null);
                            }}
                            className={cn(
                              'flex-1 rounded-xl border-2 p-2',
                              isAdded
                                ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/30'
                                : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                            )}
                          >
                            {isAdded && (
                              <View className="absolute -top-1.5 -left-1.5 z-10 rounded-full bg-green-500 px-1.5 py-0.5">
                                <Text className="text-[8px] font-black text-white">
                                  AGREGADO
                                </Text>
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
                            <Text
                              className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white"
                              numberOfLines={1}
                            >
                              {product.name}
                            </Text>
                            <Text
                              className="text-[10px] text-gray-500 dark:text-gray-400"
                              numberOfLines={1}
                            >
                              {[product.brand_name, product.style_name, product.category_name]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                            {product.color ? (
                              <View className="mt-1 flex-row items-center gap-1">
                                <View
                                  className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-slate-600"
                                  style={{ backgroundColor: product.color }}
                                />
                                <Text className="text-[9px] text-gray-400 dark:text-gray-500">
                                  {product.color}
                                </Text>
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      }}
                      ListEmptyComponent={
                        <View className="items-center py-8">
                          <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                          <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron productos
                          </Text>
                        </View>
                      }
                    />
                  )}
                </>
              )}
            </View>
          )}

          {/* ─── Size Picker / Line Items ─────────────────────── */}
          {selectedProduct && !isEditMode ? (
            <View className="mb-4">
              {/* Product header card */}
              <View className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedProduct.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {[selectedProduct.brand_name, selectedProduct.style_name, selectedProduct.category_name]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedProduct(null);
                      setSizeAmounts({});
                    }}
                    className="p-1"
                  >
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              {/* Numeraciones Rápidas */}
              <View className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <View className="mb-2 flex-row items-center justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Numeraciones Rápidas
                  </Text>
                  <Pressable onPress={clearSizeAmounts} hitSlop={8}>
                    <Text className="text-[10px] font-bold uppercase text-red-500">
                      Limpiar
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {(() => {
                    const catName = categories.find((c) => c.id === selectedCategory)?.name;

                    // Use inline style for bg color — NativeWind can't resolve dynamic className strings
                    const COLORS: Record<string, string> = {
                      orange: '#ea580c',
                      blue: '#2563eb',
                      emerald: '#059669',
                      purple: '#9333ea',
                      rose: '#e11d48',
                      amber: '#d97706',
                      indigo: '#4f46e5',
                    };
                    const presetBtn = (
                      label: string,
                      presetId: string,
                      colorKey: string,
                      onPress: () => void,
                    ) => {
                      const hex = COLORS[colorKey] ?? COLORS.blue;
                      const isActive = activePreset === presetId;
                      return (
                        <Pressable
                          key={presetId}
                          onPress={onPress}
                          style={{ backgroundColor: hex, opacity: isActive ? 1 : 0.8 }}
                          className={cn(
                            'rounded-lg px-2.5 py-1.5',
                            isActive && 'ring-2 ring-white',
                          )}
                        >
                          <Text className="text-[10px] font-bold text-white">{label}</Text>
                        </Pressable>
                      );
                    };
                    const damaRange = ['33', '34', '35', '36', '37', '38'];
                    const cabFullRange = [
                      '33', '34', '35', '36', '37', '38', '39', '40', '41', '42',
                    ];
                    const infSmall = ['21', '22', '23', '24', '25', '26'];
                    const infLarge = ['27', '28', '29', '30', '31', '32'];
                    const infFull = [...infSmall, ...infLarge];

                    if (catName === 'Dama') {
                      return (
                        <>
                          {presetBtn('Comercial', 'com-dama', 'orange', () =>
                            applyRelativeCurve(COMERCIAL_PATTERN, '33', 'com-dama'),
                          )}
                          {presetBtn('2x Talla', 'fixed-2-dama', 'blue', () => applyFixedX(2, damaRange, 'fixed-2-dama'))}
                          {presetBtn('3x Talla', 'fixed-3-dama', 'emerald', () => applyFixedX(3, damaRange, 'fixed-3-dama'))}
                          {presetBtn('4x Talla', 'fixed-4-dama', 'purple', () => applyFixedX(4, damaRange, 'fixed-4-dama'))}
                          {presetBtn('5x Talla', 'fixed-5-dama', 'rose', () => applyFixedX(5, damaRange, 'fixed-5-dama'))}
                        </>
                      );
                    }

                    if (catName === 'Caballero') {
                      return (
                        <>
                          {presetBtn('Comercial (33-38)', 'com-cab', 'orange', () =>
                            applyRelativeCurve(COMERCIAL_PATTERN, '33', 'com-cab'),
                          )}
                          {presetBtn('Comer. Grande (37-42)', 'com-cab-grande', 'amber', () =>
                            applySpecificCurve(
                              { '37': 1, '38': 2, '39': 3, '40': 3, '41': 2, '42': 1 },
                              'com-cab-grande',
                            ),
                          )}
                          {presetBtn('Curva (33-42)', 'curva-cab', 'indigo', () => {
                            const curve: Record<string, number> = {};
                            cabFullRange.forEach(
                              (s) => (curve[s] = s === '38' || s === '39' ? 2 : 1),
                            );
                            applySpecificCurve(curve, 'curva-cab');
                          })}
                          {presetBtn('2x Talla', 'fixed-2-cab', 'blue', () => applyFixedX(2, cabFullRange, 'fixed-2-cab'))}
                          {presetBtn('3x Talla', 'fixed-3-cab', 'emerald', () => applyFixedX(3, cabFullRange, 'fixed-3-cab'))}
                          {presetBtn('4x Talla', 'fixed-4-cab', 'purple', () => applyFixedX(4, cabFullRange, 'fixed-4-cab'))}
                          {presetBtn('5x Talla', 'fixed-5-cab', 'rose', () => applyFixedX(5, cabFullRange, 'fixed-5-cab'))}
                        </>
                      );
                    }

                    if (catName === 'Infantil') {
                      return (
                        <>
                          {presetBtn('2xT (21-26)', 'fixed-2-inf-s', 'orange', () => applyFixedX(2, infSmall, 'fixed-2-inf-s'))}
                          {presetBtn('3xT (21-26)', 'fixed-3-inf-s', 'blue', () => applyFixedX(3, infSmall, 'fixed-3-inf-s'))}
                          {presetBtn('4xT (21-26)', 'fixed-4-inf-s', 'emerald', () => applyFixedX(4, infSmall, 'fixed-4-inf-s'))}
                          {presetBtn('5xT (21-26)', 'fixed-5-inf-s', 'purple', () => applyFixedX(5, infSmall, 'fixed-5-inf-s'))}
                          {presetBtn('6xT (21-26)', 'fixed-6-inf-s', 'rose', () => applyFixedX(6, infSmall, 'fixed-6-inf-s'))}
                          {presetBtn('2xT (27-32)', 'fixed-2-inf-l', 'blue', () => applyFixedX(2, infLarge, 'fixed-2-inf-l'))}
                          {presetBtn('3xT (27-32)', 'fixed-3-inf-l', 'emerald', () => applyFixedX(3, infLarge, 'fixed-3-inf-l'))}
                          {presetBtn('4xT (27-32)', 'fixed-4-inf-l', 'purple', () => applyFixedX(4, infLarge, 'fixed-4-inf-l'))}
                          {presetBtn('5xT (27-32)', 'fixed-5-inf-l', 'rose', () => applyFixedX(5, infLarge, 'fixed-5-inf-l'))}
                          {presetBtn('6xT (27-32)', 'fixed-6-inf-l', 'amber', () => applyFixedX(6, infLarge, 'fixed-6-inf-l'))}
                          {presetBtn('1xT (21-32)', 'curve-1-inf', 'emerald', () => applyFixedX(1, infFull, 'curve-1-inf'))}
                          {presetBtn('2xT (21-32)', 'curve-2-inf', 'purple', () => applyFixedX(2, infFull, 'curve-2-inf'))}
                          {presetBtn('3xT (21-32)', 'curve-3-inf', 'rose', () => applyFixedX(3, infFull, 'curve-3-inf'))}
                          {presetBtn('4xT (21-32)', 'curve-4-inf', 'amber', () => applyFixedX(4, infFull, 'curve-4-inf'))}
                        </>
                      );
                    }

                    return null;
                  })()}
                </View>
              </View>

              {/* Size grid */}
              <View className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <Text className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Tallas y Cantidades
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const val = parseInt(sizeAmounts[size] || '0');
                    const hasValue = val > 0;
                    return (
                      <View key={size} className="w-[22%] items-center gap-1">
                        <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500">
                          T{size}
                        </Text>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#94a3b8"
                          value={hasValue ? String(val) : ''}
                          onChangeText={(v) => {
                            const newAmounts = { ...sizeAmounts, [size]: v.replace(/[^0-9]/g, '') };
                            setSizeAmounts(newAmounts);
                            setActivePreset(null);
                          }}
                          className={cn(
                            'w-full rounded-lg px-1 py-2 text-center text-sm font-black',
                            hasValue
                              ? 'border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'border border-gray-200 bg-gray-50 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white',
                          )}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Summary */}
              {sizePairsTotal > 0 && (
                <View className="mb-3 items-center rounded-xl bg-blue-50 py-2 dark:bg-blue-950/30">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Total de pares
                  </Text>
                  <Text className="text-xl font-bold text-primary">{sizePairsTotal}</Text>
                </View>
              )}

              {/* Actions */}
              <View className="flex-row gap-2">
                <Button
                  title="Agregar al Pedido"
                  onPress={confirmProductSizes}
                  className="flex-1"
                />
                <Button
                  title="Volver a productos"
                  variant="outline"
                  onPress={() => {
                    setSelectedProduct(null);
                    setSizeAmounts({});
                  }}
                  className="flex-1"
                />
              </View>
            </View>
          ) : lineItems.length > 0 ? (
            <>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {isEditMode ? 'Tallas' : 'Tallas agregadas'}
                </Text>
                <Badge tone="blue" label={`${lineItems.length} ítems`} />
              </View>

              {lineItems.map((item) => (
                <Card key={item.uid} className="mb-3 gap-2">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text
                        className="text-sm font-bold text-gray-900 dark:text-white"
                        numberOfLines={1}
                      >
                        {item.product_name}
                      </Text>
                      {item.colour ? (
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {item.colour}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable onPress={() => removeLineItem(item.uid)} className="p-1">
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </Pressable>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        Talla
                      </Text>
                      <TextInput
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="39"
                        placeholderTextColor="#94a3b8"
                        value={item.size}
                        onChangeText={(v) => updateLineItem(item.uid, 'size', v)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        Cantidad
                      </Text>
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
                      <Text className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        Color
                      </Text>
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
            </>
          ) : (
            <View className="items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 dark:border-slate-700 dark:bg-slate-900">
              <Ionicons name="cube-outline" size={32} color="#94a3b8" />
              <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                {isEditMode
                  ? 'Sin tallas'
                  : 'Selecciona una categoría, marca y estilo para ver productos'}
              </Text>
            </View>
          )}

          {/* ─── Summary ──────────────────────────────────────── */}
          {lineItems.length > 0 && (
            <Card className="mb-4 items-center gap-1 py-3">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Total de pares
              </Text>
              <Text className="text-2xl font-bold text-primary">{totalPairs}</Text>
            </Card>
          )}

          {/* ─── Submit (hidden while size picker is open) ────── */}
          {!selectedProduct && (
            <Button
              title={
                createMutation.isPending
                  ? 'Guardando...'
                  : isAddToOrder
                    ? 'Agregar al Pedido'
                    : isEditMode
                      ? 'Guardar cambios'
                      : 'Crear pedido'
              }
              onPress={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                (!isEditMode && !isAddToOrder && !selectedClient) ||
                lineItems.length === 0
              }
              loading={createMutation.isPending}
            />
          )}
        </ScrollView>

        {/* ─── Client Picker Modal ──────────────────────────── */}
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
                <EmptyState
                  icon="people-outline"
                  title="Sin clientes"
                  message="No hay clientes registrados"
                />
              }
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
      </View>
    </Modal>
  );
}
