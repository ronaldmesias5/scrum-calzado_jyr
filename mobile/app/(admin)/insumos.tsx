import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { catalogService } from '@/services/catalogService';
import {
  createSupply,
  createSupplyCategory,
  deleteSupply,
  linkSupplyToProduct,
  listSupplyCategories,
  listSupplies,
  unlinkSupplyFromProduct,
  updateSupply,
} from '@/services/suppliesService';
import type {
  Supply,
  SupplyCategory,
  SupplyCategoryCreateRequest,
  SupplyCreateRequest,
  SupplyListResponse,
} from '@/types/supplies';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

// ─── Constantes ─────────────────────────────────────────────

const PRODUCTION_STAGES = [
  { key: 'all', label: 'Todos' },
  { key: 'corte', label: 'Corte' },
  { key: 'guarnicion', label: 'Guarnición' },
  { key: 'soladura', label: 'Soladura' },
  { key: 'emplantillado', label: 'Emplantillado' },
  { key: 'otros', label: 'Otros' },
];

const STAGE_BADGE_TONE: Record<string, BadgeTone> = {
  corte: 'yellow',
  guarnicion: 'blue',
  soladura: 'purple',
  emplantillado: 'green',
  otros: 'orange',
};

const UNITS = ['unidades', 'pares', 'metros', 'tallas'];

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ─── Chip de filtro ─────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'rounded-full border px-4 py-2',
        active
          ? 'border-primary bg-primary dark:border-primary-light dark:bg-primary-light'
          : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900',
      )}
    >
      <Text
        className={cn(
          'text-sm font-bold',
          active ? 'text-white' : 'text-gray-600 dark:text-gray-300',
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tarjeta de insumo ──────────────────────────────────────

function SupplyCard({
  supply,
  stage,
  onEdit,
  onLink,
  onDelete,
}: {
  supply: Supply;
  stage: string;
  onEdit: () => void;
  onLink: () => void;
  onDelete: () => void;
}) {
  const showActions = () => {
    Alert.alert(supply.name, 'Selecciona una acción', [
      { text: 'Editar', onPress: onEdit },
      { text: 'Vincular a Producto', onPress: onLink },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const stageTone = STAGE_BADGE_TONE[stage] ?? 'orange';
  const sizesCount = supply.sizes ? Object.keys(supply.sizes).length : 0;
  const linkedCount = supply.linked_products?.length ?? 0;
  const stock = supply.stock_quantity % 1 === 0 ? supply.stock_quantity : supply.stock_quantity.toFixed(2);

  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {supply.name}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <Badge tone={stageTone} label={supply.category} />
            {supply.color ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="color-palette-outline" size={12} color="#94a3b8" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">{supply.color}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity onPress={showActions} className="p-1">
          <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={supply.stock_quantity > 0 ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={supply.stock_quantity > 0 ? '#22c55e' : '#ef4444'}
          />
          <Text className="text-sm font-bold text-gray-900 dark:text-white">{stock}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {supply.unit ?? 'unidades'}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {sizesCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="resize-outline" size={14} color="#64748b" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">{sizesCount} tallas</Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <Ionicons name="link-outline" size={14} color="#3b82f6" />
            <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {linkedCount} {linkedCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Modal crear / editar insumo ────────────────────────────

interface SupplyFormModalProps {
  visible: boolean;
  onClose: () => void;
  categories: SupplyCategory[];
  editSupply?: Supply | null;
  onSubmit: (body: SupplyCreateRequest) => Promise<void>;
}

function SupplyFormModal({ visible, onClose, categories, editSupply, onSubmit }: SupplyFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [stockText, setStockText] = useState('0');
  const [unit, setUnit] = useState('unidades');
  const [sizesText, setSizesText] = useState('');
  const [selectedStage, setSelectedStage] = useState('corte');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editSupply) {
      const catObj = categories.find(
        (c) => c.name.toLowerCase() === editSupply.category.toLowerCase(),
      );
      setSelectedStage(catObj?.global_stage ?? 'otros');
      setCategory(editSupply.category);
      setName(editSupply.name);
      setDescription(editSupply.description ?? '');
      setColor(editSupply.color ?? '');
      setUnit(editSupply.unit ?? 'unidades');
      setStockText(String(editSupply.stock_quantity ?? 0));
      setSizesText(editSupply.sizes ? JSON.stringify(editSupply.sizes) : '');
    } else {
      setSelectedStage('corte');
      setCategory('');
      setName('');
      setDescription('');
      setColor('');
      setUnit('unidades');
      setStockText('0');
      setSizesText('');
    }
  }, [visible, editSupply, categories]);

  const stageCategories = useMemo(
    () =>
      categories.filter(
        (c) => normalize(c.global_stage ?? 'otros') === normalize(selectedStage),
      ),
    [categories, selectedStage],
  );

  const parsedSizes = useMemo(() => {
    if (unit !== 'tallas') return null;
    try {
      const parsed = JSON.parse(sizesText || '{}');
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        const num = Number(value);
        if (Number.isFinite(num) && num > 0) result[key] = num;
      }
      return result;
    } catch {
      return null;
    }
  }, [sizesText, unit]);

  const computedStock =
    unit === 'tallas'
      ? Object.values(parsedSizes ?? {}).reduce((acc, v) => acc + v, 0)
      : parseFloat(stockText) || 0;

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage);
    const first = categories.find(
      (c) => normalize(c.global_stage ?? 'otros') === normalize(stage),
    );
    setCategory(first?.name ?? '');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }
    if (unit === 'tallas' && sizesText.trim() && parsedSizes === null) {
      Alert.alert('Error', 'El formato de tallas debe ser JSON válido, ej: {"36": 10, "37": 5}');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        color: color.trim() || undefined,
        stock_quantity: computedStock,
        unit,
        sizes: unit === 'tallas' ? (parsedSizes ?? {}) : undefined,
      });
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 rounded-t-3xl bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {editSupply ? 'Editar insumo' : 'Nuevo insumo'}
            </Text>
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </View>

          <ScrollView contentContainerClassName="px-6 pb-10">
            <Text className="mb-2 mt-2 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
              Etapa de producción
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PRODUCTION_STAGES.filter((s) => s.key !== 'all').map((stage) => (
                <Button
                  key={stage.key}
                  variant={selectedStage === stage.key ? 'primary' : 'outline'}
                  onPress={() => handleStageChange(stage.key)}
                >
                  {stage.label}
                </Button>
              ))}
            </View>

            <Text className="mb-2 mt-4 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
              Categoría *
            </Text>
            {stageCategories.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {'No hay categorías en esta etapa. Crea una desde el botón "+ Categoría".'}
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {stageCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.name ? 'primary' : 'outline'}
                    onPress={() => setCategory(cat.name)}
                  >
                    {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                  </Button>
                ))}
              </View>
            )}

            <Input
              label="Nombre *"
              value={name}
              onChangeText={setName}
              placeholder="Ej: Terry Gris"
              className="mt-4"
            />
            <Input
              label="Descripción"
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción opcional"
              className="mt-4"
            />
            <Input
              label="Color"
              value={color}
              onChangeText={setColor}
              placeholder="Ej: Negro, Blanco..."
              className="mt-4"
            />

            <Text className="mb-2 mt-4 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
              Unidad
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {UNITS.map((u) => (
                <Button
                  key={u}
                  variant={unit === u ? 'primary' : 'outline'}
                  onPress={() => {
                    setUnit(u);
                    if (u !== 'tallas') setSizesText('');
                  }}
                >
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Button>
              ))}
            </View>

            {unit === 'tallas' ? (
              <>
                <Input
                  label="Stock por tallas (JSON)"
                  value={sizesText}
                  onChangeText={setSizesText}
                  placeholder='{"36": 10, "37": 5}'
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="mt-4"
                  multiline
                />
                <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total: {computedStock} pares · {Object.keys(parsedSizes ?? {}).length} tallas
                </Text>
              </>
            ) : (
              <Input
                label={`Stock inicial (${unit})`}
                value={stockText}
                onChangeText={setStockText}
                placeholder="0"
                keyboardType="numeric"
                className="mt-4"
              />
            )}

            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={!name.trim() || !category}
              className="mt-6"
            >
              {editSupply ? 'Guardar cambios' : 'Crear insumo'}
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal crear categoría ──────────────────────────────────

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: SupplyCategoryCreateRequest) => Promise<void>;
}

function CategoryFormModal({ visible, onClose, onSubmit }: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [globalStage, setGlobalStage] = useState('otros');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setGlobalStage('otros');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name: name.trim().toLowerCase(), global_stage: globalStage });
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Nueva categoría de insumo
          </Text>
          <Input
            label="Nombre *"
            value={name}
            onChangeText={setName}
            placeholder="Ej: montaje, acabado..."
          />
          <Text className="mb-2 mt-4 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
            Etapa de producción
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRODUCTION_STAGES.filter((s) => s.key !== 'all').map((stage) => (
              <Button
                key={stage.key}
                variant={globalStage === stage.key ? 'primary' : 'outline'}
                onPress={() => setGlobalStage(stage.key)}
              >
                {stage.label}
              </Button>
            ))}
          </View>
          <View className="mt-6 flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onPress={handleSubmit} loading={loading} disabled={!name.trim()} className="flex-1">
              Crear
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal vincular a producto ──────────────────────────────

interface LinkProductModalProps {
  visible: boolean;
  supply: Supply | null;
  onClose: () => void;
  onLinked: () => void;
}

function LinkProductModal({ visible, supply, onClose, onLinked }: LinkProductModalProps) {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyText, setQtyText] = useState('');
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['admin-products', 'link'],
    queryFn: () => catalogService.listProducts({ page_size: 100 }),
    enabled: visible,
  });

  const linkMutation = useMutation({
    mutationFn: ({
      productId,
      supplyId,
      qty,
    }: {
      productId: string;
      supplyId: string;
      qty: number;
    }) => linkSupplyToProduct(productId, supplyId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setSelectedProductId('');
      setQtyText('');
      Alert.alert('Listo', 'Insumo vinculado al producto');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ productId, supplyId }: { productId: string; supplyId: string }) =>
      unlinkSupplyFromProduct(productId, supplyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      Alert.alert('Listo', 'Vínculo eliminado');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const products = (productsQuery.data?.products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleLink = () => {
    if (!selectedProductId || !supply) return;
    const qty = parseFloat(qtyText) || 0;
    linkMutation.mutate({ productId: selectedProductId, supplyId: supply.id, qty });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 rounded-t-3xl bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Vincular a producto
            </Text>
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </View>

          <ScrollView contentContainerClassName="px-6 pb-10">
            {supply ? (
              <Text className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Insumo:{' '}
                <Text className="font-bold text-blue-600 dark:text-blue-400">{supply.name}</Text>
              </Text>
            ) : null}

            {supply && supply.linked_products.length > 0 ? (
              <>
                <Text className="mb-2 mt-2 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
                  Productos vinculados
                </Text>
                {supply.linked_products.map((lp) => (
                  <View
                    key={lp.product_id}
                    className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                        {lp.product_name}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {lp.quantity_required} {supply.unit ?? 'unidad(es)'} requerida(s)
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        unlinkMutation.mutate({ productId: lp.product_id, supplyId: supply.id })
                      }
                      className="p-2"
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : null}

            <Text className="mb-2 mt-4 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
              Vincular nuevo producto
            </Text>
            <View className="mb-3 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                className="flex-1 text-sm text-gray-900 dark:text-white"
                placeholder="Buscar producto..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {productsQuery.isLoading ? (
              <ActivityIndicator size="small" color="#1e40af" className="py-6" />
            ) : products.length === 0 ? (
              <Text className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Sin resultados
              </Text>
            ) : (
              products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedProductId(p.id)}
                  className={cn(
                    'mb-1.5 rounded-xl border px-4 py-2.5',
                    selectedProductId === p.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-bold',
                      selectedProductId === p.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300',
                    )}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <Input
              label="Cantidad requerida"
              value={qtyText}
              onChangeText={setQtyText}
              placeholder="Ej: 1.5"
              keyboardType="numeric"
              className="mt-4"
            />

            <Button
              onPress={handleLink}
              loading={linkMutation.isPending}
              disabled={!selectedProductId}
              className="mt-4"
            >
              Vincular insumo
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ─────────────────────────────────────

export default function InsumosScreen() {
  const [activeStage, setActiveStage] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState<{ open: boolean; edit?: Supply | null }>({
    open: false,
  });
  const [categoryModal, setCategoryModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Supply | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery<SupplyCategory[]>({
    queryKey: ['supply-categories'],
    queryFn: () => listSupplyCategories(),
  });

  const suppliesQuery = useInfiniteQuery<SupplyListResponse>({
    queryKey: ['supplies'],
    queryFn: ({ pageParam = 1 }) => listSupplies(pageParam as number, 10),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const getStageOfCategory = useCallback(
    (categoryName: string): string => {
      const cat = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );
      return normalize(cat?.global_stage ?? 'otros');
    },
    [categories],
  );

  const allSupplies = useMemo(
    () => suppliesQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [suppliesQuery.data],
  );

  const stageCategories = useMemo(
    () =>
      categories.filter(
        (c) => normalize(c.global_stage ?? 'otros') === normalize(activeStage),
      ),
    [categories, activeStage],
  );

  const filtered = useMemo(
    () =>
      allSupplies.filter((s) => {
        if (activeStage !== 'all' && getStageOfCategory(s.category) !== activeStage) {
          return false;
        }
        if (
          activeCategory !== 'all' &&
          s.category.toLowerCase() !== activeCategory.toLowerCase()
        ) {
          return false;
        }
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      }),
    [allSupplies, activeStage, activeCategory, search, getStageOfCategory],
  );

  const handleLoadMore = useCallback(() => {
    if (suppliesQuery.hasNextPage && !suppliesQuery.isFetchingNextPage) {
      suppliesQuery.fetchNextPage();
    }
  }, [suppliesQuery]);

  const invalidateSupplies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['supplies'] });
    queryClient.invalidateQueries({ queryKey: ['supply-categories'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: SupplyCreateRequest) => createSupply(body),
    onSuccess: () => {
      invalidateSupplies();
      setFormModal({ open: false });
      Alert.alert('Listo', 'Insumo creado correctamente');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SupplyCreateRequest }) =>
      updateSupply(id, body),
    onSuccess: () => {
      invalidateSupplies();
      setFormModal({ open: false });
      Alert.alert('Listo', 'Insumo actualizado correctamente');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSupply(id),
    onSuccess: () => {
      invalidateSupplies();
      setDeleteTarget(null);
      Alert.alert('Listo', 'Insumo eliminado');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const categoryMutation = useMutation({
    mutationFn: (body: SupplyCategoryCreateRequest) => createSupplyCategory(body),
    onSuccess: () => {
      invalidateSupplies();
      setCategoryModal(false);
      Alert.alert('Listo', 'Categoría creada');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const handleSubmitForm = async (body: SupplyCreateRequest) => {
    if (formModal.edit) {
      await updateMutation.mutateAsync({ id: formModal.edit.id, body });
    } else {
      await createMutation.mutateAsync(body);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Insumos" back />

      {/* Chips por etapa de producción */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row items-center gap-2 px-4 py-3">
          {PRODUCTION_STAGES.map((stage) => (
            <FilterChip
              key={stage.key}
              label={stage.label}
              active={activeStage === stage.key}
              onPress={() => {
                setActiveStage(stage.key);
                setActiveCategory('all');
              }}
            />
          ))}
          <TouchableOpacity
            onPress={() => setCategoryModal(true)}
            className="flex-row items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-4 py-2 dark:border-slate-600 dark:bg-slate-900"
          >
            <Ionicons name="add" size={16} color="#64748b" />
            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400">Categoría</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sub-filtro por categoría */}
      {activeStage !== 'all' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
          <View className="flex-row items-center gap-2 px-4 pb-2">
            <FilterChip
              label="Todos los tipos"
              active={activeCategory === 'all'}
              onPress={() => setActiveCategory('all')}
            />
            {stageCategories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                active={activeCategory === cat.name}
                onPress={() => setActiveCategory(cat.name)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Búsqueda */}
      <View className="px-4 pb-3 pt-1">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar insumo..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {suppliesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
          <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando insumos...</Text>
        </View>
      ) : suppliesQuery.isError ? (
        <ErrorState
          message={getErrorMessage(suppliesQuery.error)}
          onRetry={() => suppliesQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="Sin insumos"
          message={
            search || activeStage !== 'all'
              ? 'No se encontraron insumos con los filtros actuales'
              : 'Aún no hay insumos registrados'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SupplyCard
              supply={item}
              stage={getStageOfCategory(item.category)}
              onEdit={() => setFormModal({ open: true, edit: item })}
              onLink={() => setLinkTarget(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 90 }}
          refreshControl={
            <RefreshControl
              refreshing={suppliesQuery.isRefetching}
              onRefresh={() => suppliesQuery.refetch()}
              tintColor="#1e40af"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            suppliesQuery.isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#1e40af" />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB crear insumo */}
      <TouchableOpacity
        onPress={() => setFormModal({ open: true })}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 dark:bg-primary-light"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <SupplyFormModal
        visible={formModal.open}
        onClose={() => setFormModal({ open: false })}
        categories={categories}
        editSupply={formModal.edit ?? null}
        onSubmit={handleSubmitForm}
      />

      <CategoryFormModal
        visible={categoryModal}
        onClose={() => setCategoryModal(false)}
        onSubmit={async (body) => {
          await categoryMutation.mutateAsync(body);
        }}
      />

      <LinkProductModal
        visible={!!linkTarget}
        supply={linkTarget}
        onClose={() => setLinkTarget(null)}
        onLinked={invalidateSupplies}
      />

      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title="Eliminar insumo"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}