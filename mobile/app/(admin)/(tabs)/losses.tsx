import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { catalogService } from '@/services/catalogService';
import { listSupplies } from '@/services/suppliesService';
import {
  approveIncident,
  approvePendingIncidence,
  createIncident,
  getDefectCodes,
  getIncidents,
  getPendingIncidences,
  getScrapStock,
  rejectIncident,
  rejectPendingIncidence,
  repairIncident,
  solveIncident,
} from '@/services/incidencesService';
import type {
  CreateIncidentRequest,
  IncidenceCategory,
  IncidentType,
  LossRecord,
  PendingIncidence,
  ScrapStock,
} from '@/types/incidences';
import type { Product } from '@/types/catalog';
import type { Supply } from '@/types/supplies';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

type TabKey = 'registro' | 'scrap' | 'reparados' | 'pendientes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'registro', label: 'Registro' },
  { key: 'scrap', label: 'Scrap' },
  { key: 'reparados', label: 'Reparados' },
  { key: 'pendientes', label: 'Pendientes' },
];

const INCIDENT_TYPE_BADGE: Record<IncidentType, { tone: BadgeTone; label: string }> = {
  perdida: { tone: 'red', label: 'Pérdida' },
  en_reparacion: { tone: 'blue', label: 'En reparación' },
  reparado: { tone: 'green', label: 'Reparado' },
  devuelto: { tone: 'purple', label: 'Devuelto' },
  falla: { tone: 'orange', label: 'Falla' },
  faltante: { tone: 'yellow', label: 'Faltante' },
  solucionado: { tone: 'green', label: 'Solucionado' },
  rechazado: { tone: 'red', label: 'Rechazado' },
};

const CATEGORY_ICON: Record<IncidenceCategory, keyof typeof Ionicons.glyphMap> = {
  producto: 'bag',
  maquinaria: 'construct-outline',
  insumo: 'cube',
};

const TYPE_FILTERS: { value: IncidentType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'perdida', label: 'Pérdida' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'reparado', label: 'Reparado' },
  { value: 'devuelto', label: 'Devuelto' },
  { value: 'falla', label: 'Falla' },
  { value: 'faltante', label: 'Faltante' },
  { value: 'solucionado', label: 'Solucionado' },
  { value: 'rechazado', label: 'Rechazado' },
];

const CREATE_INCIDENT_TYPES: IncidentType[] = [
  'perdida',
  'en_reparacion',
  'devuelto',
  'falla',
  'faltante',
];

const APPROVE_TYPES: IncidentType[] = ['perdida', 'en_reparacion', 'devuelto'];

const REPAIR_DESTINATIONS: { value: 'stock' | 'reserva' | 'customer_return'; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'customer_return', label: 'Devolución cliente' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function fullName(user: { name_user: string; last_name: string } | null): string {
  if (!user) return '—';
  return `${user.name_user} ${user.last_name}`.trim();
}

function IncidentCard({
  incident,
  onPress,
}: {
  incident: LossRecord;
  onPress: () => void;
}) {
  const badge = INCIDENT_TYPE_BADGE[incident.incident_type];
  const title =
    incident.incidence_category === 'maquinaria'
      ? incident.machinery_name ?? 'Maquinaria'
      : incident.product?.name_product ??
        incident.supply?.name_supplies ??
        incident.custom_supply_name ??
        'Producto';

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900/50',
        'active:scale-[0.98]',
      )}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Ionicons
              name={CATEGORY_ICON[incident.incidence_category]}
              size={18}
              color="#1e40af"
            />
          </View>
          <Text
            className="max-w-[60%] text-base font-bold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Badge tone={badge.tone} label={badge.label} />
      </View>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        {incident.size ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Talla {incident.size}
          </Text>
        ) : null}
        {incident.colour ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {incident.colour}
          </Text>
        ) : null}
        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {incident.quantity} uds
        </Text>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(incident.created_at)} · {fullName(incident.registered_by)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

function ScrapCard({ item }: { item: ScrapStock }) {
  return (
    <Card className="mx-4 mb-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          #{item.product_id.slice(0, 8)}
        </Text>
        <Badge tone="orange" label="Scrap" />
      </View>
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <Text className="text-xs text-gray-500 dark:text-gray-400">Talla {item.size}</Text>
        {item.colour ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">{item.colour}</Text>
        ) : null}
        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {item.quantity} uds
        </Text>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        {item.defect_code ? (
          <Badge tone="red" label={`${item.defect_code.code} · ${item.defect_code.name}`} />
        ) : (
          <Text className="text-xs text-gray-400">Sin código de defecto</Text>
        )}
        <Text className="text-xs text-gray-400">{formatDate(item.created_at)}</Text>
      </View>
    </Card>
  );
}

function PendingCard({
  item,
  onApprove,
  onReject,
}: {
  item: PendingIncidence;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="mx-4 mb-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {item.employee_name ?? 'Empleado'}
        </Text>
        <Badge tone="yellow" label="Pendiente" />
      </View>
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {item.product_name ?? 'Producto'}
      </Text>
      <View className="mt-1 flex-row flex-wrap items-center gap-x-4 gap-y-1">
        {item.size ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">Talla {item.size}</Text>
        ) : null}
        {item.colour ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">{item.colour}</Text>
        ) : null}
        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {item.quantity} uds
        </Text>
      </View>
      {item.description ? (
        <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text className="mt-2 text-xs text-gray-400">{formatDate(item.created_at)}</Text>

      <View className="mt-3 flex-row gap-2">
        <Button
          title="Aprobar"
          variant="primary"
          className="flex-1 py-2.5"
          onPress={onApprove}
        />
        <Button
          title="Rechazar"
          variant="danger"
          className="flex-1 py-2.5"
          onPress={onReject}
        />
      </View>
    </Card>
  );
}

function IncidentDetailSheet({
  incident,
  visible,
  onClose,
}: {
  incident: LossRecord | null;
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [repairDest, setRepairDest] = useState<'stock' | 'reserva' | 'customer_return'>('stock');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['scrap-stock'] });
    queryClient.invalidateQueries({ queryKey: ['pending-incidences'] });
  };

  const approveMut = useMutation({
    mutationFn: () => approveIncident(incident!.id),
    onSuccess: () => {
      invalidate();
      onClose();
      Alert.alert('Aprobada', 'La incidencia fue aprobada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectIncident(incident!.id),
    onSuccess: () => {
      invalidate();
      onClose();
      Alert.alert('Rechazada', 'La incidencia fue rechazada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const repairMut = useMutation({
    mutationFn: () => repairIncident(incident!.id, { repair_destination: repairDest }),
    onSuccess: () => {
      invalidate();
      onClose();
      Alert.alert('Reparada', 'La incidencia fue marcada como reparada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const solveMut = useMutation({
    mutationFn: () => solveIncident(incident!.id),
    onSuccess: () => {
      invalidate();
      onClose();
      Alert.alert('Resuelta', 'La incidencia fue resuelta.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  if (!incident) return null;

  const badge = INCIDENT_TYPE_BADGE[incident.incident_type];
  const title =
    incident.incidence_category === 'maquinaria'
      ? incident.machinery_name ?? 'Maquinaria'
      : incident.product?.name_product ??
        incident.supply?.name_supplies ??
        incident.custom_supply_name ??
        'Producto';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <SafeAreaView className="max-h-[85%] rounded-t-3xl bg-white dark:bg-slate-900">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Detalle</Text>
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 pb-8">
          <View className="mb-3 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <Ionicons
                name={CATEGORY_ICON[incident.incidence_category]}
                size={24}
                color="#1e40af"
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={2}>
                {title}
              </Text>
              <Badge tone={badge.tone} label={badge.label} />
            </View>
          </View>

          <Card className="gap-2">
            <Row label="Categoría" value={incident.incidence_category} />
            {incident.size ? <Row label="Talla" value={incident.size} /> : null}
            {incident.colour ? <Row label="Color" value={incident.colour} /> : null}
            <Row label="Cantidad" value={`${incident.quantity} uds`} />
            {incident.defect_code ? (
              <Row label="Código defecto" value={`${incident.defect_code.code} · ${incident.defect_code.name}`} />
            ) : null}
            {incident.description ? <Row label="Descripción" value={incident.description} /> : null}
            {incident.observations ? <Row label="Observaciones" value={incident.observations} /> : null}
            {incident.reason ? <Row label="Motivo" value={incident.reason} /> : null}
            <Row label="Registrado por" value={fullName(incident.registered_by)} />
            <Row label="Fecha" value={formatDate(incident.created_at)} />
            {incident.repaired_at ? <Row label="Reparado" value={formatDate(incident.repaired_at)} /> : null}
          </Card>

          <Text className="mb-2 mt-4 text-sm font-bold text-gray-700 dark:text-gray-300">
            Destino de reparación
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {REPAIR_DESTINATIONS.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => setRepairDest(d.value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5',
                  repairDest === d.value
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    repairDest === d.value ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                  )}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Button
              title="Aprobar"
              variant="primary"
              className="flex-1 py-2.5"
              loading={approveMut.isPending}
              onPress={() => approveMut.mutate()}
            />
            <Button
              title="Rechazar"
              variant="danger"
              className="flex-1 py-2.5"
              loading={rejectMut.isPending}
              onPress={() => rejectMut.mutate()}
            />
            <Button
              title="Reparar"
              variant="outline"
              className="flex-1 py-2.5"
              loading={repairMut.isPending}
              onPress={() => repairMut.mutate()}
            />
            <Button
              title="Resolver"
              variant="outline"
              className="flex-1 py-2.5"
              loading={solveMut.isPending}
              onPress={() => solveMut.mutate()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</Text>
      <Text className="flex-1 text-right text-sm text-gray-900 dark:text-white">{value}</Text>
    </View>
  );
}

function CreateIncidentModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<IncidenceCategory>('producto');
  const [product, setProduct] = useState<Product | null>(null);
  const [supply, setSupply] = useState<Supply | null>(null);
  const [size, setSize] = useState('');
  const [colour, setColour] = useState('');
  const [quantity, setQuantity] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('perdida');
  const [defectCodeId, setDefectCodeId] = useState<string>('');
  const [machineryName, setMachineryName] = useState('');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);
  const [showDefectPicker, setShowDefectPicker] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['admin-products-for-incident'],
    queryFn: () => catalogService.listProducts({ page: 1, page_size: 100 }),
    enabled: showProductPicker,
    staleTime: 120_000,
  });

  const suppliesQuery = useQuery({
    queryKey: ['supplies-for-incident'],
    queryFn: () => listSupplies(1, 100),
    enabled: showSupplyPicker,
    staleTime: 120_000,
  });

  const defectCodesQuery = useQuery({
    queryKey: ['defect-codes'],
    queryFn: getDefectCodes,
    enabled: showDefectPicker,
    staleTime: 120_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: CreateIncidentRequest = {
        incidence_category: category,
        incident_type: incidentType,
        description: description.trim(),
      };
      if (category === 'producto') {
        if (!product) throw new Error('Selecciona un producto');
        body.product_id = product.id;
        body.size = size.trim() || undefined;
        body.colour = colour.trim() || undefined;
        body.quantity = parseInt(quantity, 10) || undefined;
        body.defect_code_id = defectCodeId || undefined;
      } else if (category === 'maquinaria') {
        if (!machineryName.trim()) throw new Error('Indica el nombre de la maquinaria');
        body.machinery_name = machineryName.trim();
        body.observations = observations.trim() || undefined;
      } else {
        if (!supply) throw new Error('Selecciona un insumo');
        body.supply_id = supply.id;
        body.observations = observations.trim() || undefined;
      }
      await createIncident(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      resetForm();
      onClose();
      Alert.alert('Registrada', 'La incidencia fue registrada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const resetForm = () => {
    setCategory('producto');
    setProduct(null);
    setSupply(null);
    setSize('');
    setColour('');
    setQuantity('');
    setIncidentType('perdida');
    setDefectCodeId('');
    setMachineryName('');
    setDescription('');
    setObservations('');
  };

  const products = productsQuery.data?.products ?? [];
  const supplies = suppliesQuery.data?.items ?? [];
  const defectCodes = defectCodesQuery.data ?? [];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Nueva Incidencia
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
          <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            Categoría *
          </Text>
          <View className="mb-4 flex-row gap-2">
            {(['producto', 'maquinaria', 'insumo'] as IncidenceCategory[]).map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={cn(
                  'flex-1 items-center rounded-xl border px-3 py-3',
                  category === c
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                    : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Ionicons
                  name={CATEGORY_ICON[c]}
                  size={20}
                  color={category === c ? '#1e40af' : '#94a3b8'}
                />
                <Text
                  className={cn(
                    'mt-1 text-xs font-bold capitalize',
                    category === c
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400',
                  )}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          {category === 'producto' ? (
            <>
              <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Producto *
              </Text>
              <Pressable
                onPress={() => setShowProductPicker(true)}
                className={cn(
                  'mb-4 flex-row items-center justify-between rounded-xl border bg-white px-4 py-3',
                  'border-gray-200 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    product ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {product ? product.name : 'Seleccionar producto...'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>

              <View className="mb-4 flex-row gap-2">
                <View className="flex-1">
                  <Input label="Talla" placeholder="39" value={size} onChangeText={setSize} />
                </View>
                <View className="flex-1">
                  <Input label="Color" placeholder="Negro" value={colour} onChangeText={setColour} />
                </View>
              </View>

              <Input
                label="Cantidad *"
                placeholder="1"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                className="mb-4"
              />

              <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Tipo de incidencia *
              </Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {CREATE_INCIDENT_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setIncidentType(t)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5',
                      incidentType === t
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-bold',
                        incidentType === t ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      {INCIDENT_TYPE_BADGE[t].label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Código de defecto
              </Text>
              <Pressable
                onPress={() => setShowDefectPicker(true)}
                className={cn(
                  'mb-4 flex-row items-center justify-between rounded-xl border bg-white px-4 py-3',
                  'border-gray-200 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    defectCodeId
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {defectCodeId
                    ? defectCodes.find((d) => d.id === defectCodeId)?.name ?? 'Seleccionar...'
                    : 'Seleccionar...'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>
            </>
          ) : category === 'maquinaria' ? (
            <>
              <Input
                label="Nombre de maquinaria *"
                placeholder="Máquina de coser #2"
                value={machineryName}
                onChangeText={setMachineryName}
                className="mb-4"
              />
              <Input
                label="Observaciones"
                placeholder="Detalles de la falla..."
                value={observations}
                onChangeText={setObservations}
                multiline
                className="mb-4 min-h-[80px]"
              />
            </>
          ) : (
            <>
              <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Insumo *
              </Text>
              <Pressable
                onPress={() => setShowSupplyPicker(true)}
                className={cn(
                  'mb-4 flex-row items-center justify-between rounded-xl border bg-white px-4 py-3',
                  'border-gray-200 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    supply ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {supply ? supply.name : 'Seleccionar insumo...'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>
              <Input
                label="Observaciones"
                placeholder="Detalles..."
                value={observations}
                onChangeText={setObservations}
                multiline
                className="mb-4 min-h-[80px]"
              />
            </>
          )}

          <Input
            label="Descripción"
            placeholder="Descripción de la incidencia"
            value={description}
            onChangeText={setDescription}
            multiline
            className="mb-4 min-h-[80px]"
          />

          <Button
            title={createMut.isPending ? 'Registrando...' : 'Registrar incidencia'}
            onPress={() => createMut.mutate()}
            loading={createMut.isPending}
          />
        </ScrollView>

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
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setProduct(item);
                    setShowProductPicker(false);
                  }}
                  className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
                >
                  <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="mt-1 flex-row gap-2">
                    <Badge tone="blue" label={item.brand_name} />
                    {item.color ? <Badge tone="yellow" label={item.color} /> : null}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState icon="cube-outline" title="Sin productos" message="No hay productos en el catálogo" />
              }
            />
          </SafeAreaView>
        </Modal>

        {/* Supply Picker */}
        <Modal visible={showSupplyPicker} animationType="slide" statusBarTranslucent>
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
              <Pressable onPress={() => setShowSupplyPicker(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Seleccionar insumo
              </Text>
              <View className="w-8" />
            </View>
            <FlatList
              data={supplies}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSupply(item);
                    setShowSupplyPicker(false);
                  }}
                  className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
                >
                  <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{item.category}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState icon="cube-outline" title="Sin insumos" message="No hay insumos registrados" />
              }
            />
          </SafeAreaView>
        </Modal>

        {/* Defect Code Picker */}
        <Modal visible={showDefectPicker} animationType="slide" statusBarTranslucent>
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
              <Pressable onPress={() => setShowDefectPicker(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Código de defecto
              </Text>
              <View className="w-8" />
            </View>
            <FlatList
              data={defectCodes}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setDefectCodeId(item.id);
                    setShowDefectPicker(false);
                  }}
                  className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
                >
                  <Text className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.code} · {item.name}
                  </Text>
                  {item.description ? (
                    <Text className="text-xs text-gray-500">{item.description}</Text>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState icon="warning-outline" title="Sin códigos" message="No hay códigos de defecto" />
              }
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

export default function AdminLossesScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('registro');
  const [typeFilter, setTypeFilter] = useState<IncidentType | ''>('');
  const [selectedIncident, setSelectedIncident] = useState<LossRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingToApprove, setPendingToApprove] = useState<PendingIncidence | null>(null);
  const [approveType, setApproveType] = useState<IncidentType>('perdida');

  const incidents = useQuery({
    queryKey: ['incidents', typeFilter],
    queryFn: () => getIncidents({ incident_type: typeFilter || undefined }),
    staleTime: 30_000,
  });

  const scrap = useQuery({
    queryKey: ['scrap-stock'],
    queryFn: getScrapStock,
    staleTime: 30_000,
  });

  const repaired = useQuery({
    queryKey: ['incidents-repaired'],
    queryFn: () => getIncidents({ incident_type: 'reparado' }),
    staleTime: 30_000,
  });

  const pending = useQuery({
    queryKey: ['pending-incidences'],
    queryFn: () => getPendingIncidences(),
    staleTime: 30_000,
  });

  const approvePendingMut = useMutation({
    mutationFn: () => approvePendingIncidence(pendingToApprove!.id, { incident_type: approveType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-incidences'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setPendingToApprove(null);
      Alert.alert('Aprobada', 'La incidencia pendiente fue aprobada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const rejectPendingMut = useMutation({
    mutationFn: () => rejectPendingIncidence(pendingToApprove!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-incidences'] });
      setPendingToApprove(null);
      Alert.alert('Rechazada', 'La incidencia pendiente fue rechazada.');
    },
    onError: (err: Error) => Alert.alert('Error', getErrorMessage(err)),
  });

  const refetch = async () => {
    await Promise.all([
      incidents.refetch(),
      scrap.refetch(),
      repaired.refetch(),
      pending.refetch(),
    ]);
  };

  const isLoading =
    (activeTab === 'registro' && incidents.isLoading) ||
    (activeTab === 'scrap' && scrap.isLoading) ||
    (activeTab === 'reparados' && repaired.isLoading) ||
    (activeTab === 'pendientes' && pending.isLoading);

  const isError =
    (activeTab === 'registro' && incidents.isError) ||
    (activeTab === 'scrap' && scrap.isError) ||
    (activeTab === 'reparados' && repaired.isError) ||
    (activeTab === 'pendientes' && pending.isError);

  const isRefreshing = incidents.isRefetching || scrap.isRefetching || repaired.isRefetching || pending.isRefetching;

  const renderList = () => {
    if (isLoading) return <Loading label="Cargando incidencias..." />;
    if (isError) {
      return (
        <ErrorState
          message="No se pudieron cargar las incidencias"
          onRetry={() => refetch()}
        />
      );
    }

    if (activeTab === 'registro') {
      const items = incidents.data?.items ?? [];
      if (items.length === 0) {
        return (
          <EmptyState
            icon="warning-outline"
            title="Sin incidencias"
            message="No hay incidencias registradas con esos filtros"
          />
        );
      }
      return (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => {
                setSelectedIncident(item);
                setShowDetail(true);
              }}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#1e40af" />
          }
        />
      );
    }

    if (activeTab === 'scrap') {
      const items = scrap.data ?? [];
      if (items.length === 0) {
        return (
          <EmptyState
            icon="cube-outline"
            title="Sin stock recuperable"
            message="No hay stock de scrap registrado"
          />
        );
      }
      return (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <ScrapCard item={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#1e40af" />
          }
        />
      );
    }

    if (activeTab === 'reparados') {
      const items = repaired.data?.items ?? [];
      if (items.length === 0) {
        return (
          <EmptyState
            icon="checkmark-done-outline"
            title="Sin reparados"
            message="No hay incidencias reparadas"
          />
        );
      }
      return (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => {
                setSelectedIncident(item);
                setShowDetail(true);
              }}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#1e40af" />
          }
        />
      );
    }

    const items = pending.data?.incidences ?? [];
    if (items.length === 0) {
      return (
        <EmptyState
          icon="hourglass-outline"
          title="Sin pendientes"
          message="No hay incidencias pendientes de aprobación"
        />
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PendingCard
            item={item}
            onApprove={() => {
              setPendingToApprove(item);
              setApproveType('perdida');
            }}
            onReject={() => {
              Alert.alert('Rechazar', '¿Rechazar esta incidencia pendiente?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Rechazar',
                  style: 'destructive',
                  onPress: () => rejectPendingMut.mutate(),
                },
              ]);
            }}
          />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#1e40af" />
        }
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Incidencias" />

      {/* Tab selector */}
      <View className="border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <View className="flex-row gap-2">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              className={cn(
                'flex-1 items-center rounded-full px-2 py-2',
                activeTab === t.key
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  activeTab === t.key ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                )}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'registro' && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={TYPE_FILTERS}
            keyExtractor={(item) => item.value}
            className="mt-3"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setTypeFilter(item.value as IncidentType | '')}
                className={cn(
                  'mr-2 rounded-full px-3.5 py-1.5',
                  typeFilter === item.value
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    typeFilter === item.value
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300',
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {renderList()}

      {/* FAB - Nueva incidencia */}
      <Pressable
        onPress={() => setShowCreate(true)}
        className={cn(
          'absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full',
          'bg-blue-600 shadow-lg dark:bg-blue-500',
          'active:scale-95',
        )}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <IncidentDetailSheet
        incident={selectedIncident}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
      />

      <CreateIncidentModal visible={showCreate} onClose={() => setShowCreate(false)} />

      {/* Approve pending modal */}
      <Modal visible={pendingToApprove !== null} animationType="fade" transparent statusBarTranslucent>
        <View className="flex-1 items-center justify-center bg-black/40 p-6">
          <View className="w-full rounded-2xl bg-white p-5 dark:bg-slate-900">
            <Text className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              Aprobar incidencia
            </Text>
            <Text className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Selecciona el tipo de incidencia
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {APPROVE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setApproveType(t)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5',
                    approveType === t
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      approveType === t ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                    )}
                  >
                    {INCIDENT_TYPE_BADGE[t].label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <Button
                title="Cancelar"
                variant="outline"
                className="flex-1 py-2.5"
                onPress={() => setPendingToApprove(null)}
              />
              <Button
                title="Aprobar"
                variant="primary"
                className="flex-1 py-2.5"
                loading={approvePendingMut.isPending}
                onPress={() => approvePendingMut.mutate()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
