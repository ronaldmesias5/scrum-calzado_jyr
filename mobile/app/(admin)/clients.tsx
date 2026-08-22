import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import {
  createClient,
  deleteUser,
  listAllUsers,
  updateUser,
} from '@/services/adminService';
import type {
  AdminUser,
  CreateClientRequest,
  UpdateUserRequest,
} from '@/types/users';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

const STATUS_FILTERS: { value: '' | 'active' | 'inactive'; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

function getInitials(name: string, last_name: string): string {
  const initials = `${name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  return initials || '?';
}

function ClientCard({
  user,
  onEdit,
  onToggle,
  onDelete,
}: {
  user: AdminUser;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const showActions = () => {
    Alert.alert(`${user.name} ${user.last_name}`, user.email, [
      { text: 'Editar', onPress: onEdit },
      { text: user.is_active ? 'Desactivar' : 'Activar', onPress: onToggle },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-center gap-3">
        <View className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <Text className="text-sm font-bold text-green-700 dark:text-green-300">
            {getInitials(user.name, user.last_name)}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {user.name} {user.last_name}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {user.email}
          </Text>
          {user.business_name ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {user.business_name}
            </Text>
          ) : null}
          {user.phone ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {user.phone}
            </Text>
          ) : null}
          <View className="mt-1.5">
            <Badge
              tone={user.is_active ? 'green' : 'red'}
              label={user.is_active ? 'Activo' : 'Inactivo'}
            />
          </View>
        </View>

        <TouchableOpacity onPress={showActions} className="self-start p-1" hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CreateClientModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: CreateClientRequest) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }
    if (password && password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        business_name: businessName.trim() || undefined,
        password: password.trim() || undefined,
      });
    } catch {
      // El error ya se muestra en el onError de la mutación
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Nuevo cliente
          </Text>
          <ScrollView contentContainerClassName="pb-4" keyboardShouldPersistTaps="handled">
            <Input
              label="Nombre *"
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
              autoCapitalize="words"
            />
            <Input
              label="Apellido *"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
              autoCapitalize="words"
            />
            <Input
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Opcional"
              keyboardType="phone-pad"
            />
            <Input
              label="Empresa / Razón social"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Opcional"
              autoCapitalize="words"
            />
            <Input
              label="Contraseña (opcional)"
              value={password}
              onChangeText={setPassword}
              placeholder="Vacía = se genera una temporal"
              secureTextEntry
              autoCapitalize="none"
            />

            <View className="mt-6 flex-row gap-3">
              <Button variant="outline" onPress={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button onPress={handleSubmit} loading={loading} className="flex-1">
                Crear
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function EditClientModal({
  visible,
  user,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (body: UpdateUserRequest) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    if (visible && user) {
      setName(user.name);
      setLastName(user.last_name);
      setEmail(user.email);
      setPhone(user.phone ?? '');
      setBusinessName(user.business_name ?? '');
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    if (!name.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Nombre y apellido son obligatorios');
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
        business_name: businessName.trim() || undefined,
      });
    } catch {
      // El error ya se muestra en el onError de la mutación
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Editar cliente
          </Text>
          <ScrollView contentContainerClassName="pb-4" keyboardShouldPersistTaps="handled">
            <Input
              label="Nombre *"
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
              autoCapitalize="words"
            />
            <Input
              label="Apellido *"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
              autoCapitalize="words"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              editable={false}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Opcional"
              keyboardType="phone-pad"
            />
            <Input
              label="Empresa / Razón social"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Opcional"
              autoCapitalize="words"
            />

            <View className="mt-6 flex-row gap-3">
              <Button variant="outline" onPress={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button onPress={handleSubmit} loading={loading} className="flex-1">
                Guardar
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const {
    data: clients,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', 'client'],
    queryFn: () => listAllUsers('client'),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (clients ?? []).filter((u) => {
      const matchesSearch =
        !q ||
        `${u.name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.business_name ?? '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === '' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: CreateClientRequest) => createClient(body),
    onSuccess: () => {
      invalidateUsers();
      setCreateOpen(false);
      Alert.alert('Listo', 'Cliente creado. Se envió un correo con las credenciales.');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; body: UpdateUserRequest }) =>
      updateUser(vars.id, vars.body),
    onSuccess: () => {
      invalidateUsers();
      setEditUser(null);
      Alert.alert('Listo', 'Cliente actualizado');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      invalidateUsers();
      setDeleteTarget(null);
      Alert.alert('Listo', 'Cliente eliminado');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const handleToggle = useCallback(
    (user: AdminUser) => {
      updateMutation.mutate({ id: user.id, body: { is_active: !user.is_active } });
    },
    [updateMutation],
  );

  const handleEditSubmit = useCallback(
    async (body: UpdateUserRequest) => {
      if (!editUser) return;
      await updateMutation.mutateAsync({ id: editUser.id, body });
    },
    [editUser, updateMutation],
  );

  const handleCreateSubmit = useCallback(
    async (body: CreateClientRequest) => {
      await createMutation.mutateAsync(body);
    },
    [createMutation],
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Clientes" back />

      <View className="px-4 pb-2 pt-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm text-gray-900 dark:text-white"
            placeholder="Buscar por nombre, empresa o email..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <View className="gap-1.5 px-4 pb-2">
        <Text className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500">
          Estado
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => setStatusFilter(s.value)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5',
                  active
                    ? 'border-primary bg-primary dark:border-primary-light dark:bg-primary-light'
                    : 'border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    active ? 'text-white' : 'text-gray-700 dark:text-gray-300',
                  )}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading label="Cargando clientes..." />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="person-outline"
          title="Sin clientes"
          message={
            search || statusFilter
              ? 'No se encontraron clientes con esos filtros'
              : 'Aún no hay clientes registrados'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientCard
              user={item}
              onEdit={() => setEditUser(item)}
              onToggle={() => handleToggle(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#1e40af"
            />
          }
        />
      )}

      <TouchableOpacity
        onPress={() => setCreateOpen(true)}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
        accessibilityRole="button"
        accessibilityLabel="Crear cliente"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <CreateClientModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
      />

      <EditClientModal
        visible={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleEditSubmit}
        loading={updateMutation.isPending}
      />

      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title="Eliminar cliente"
        message={`¿Estás seguro de eliminar a "${deleteTarget?.name} ${deleteTarget?.last_name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </View>
  );
}