import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import {
  approveReactivationTicket,
  deleteUser,
  forcePasswordChange,
  listAllUsers,
  listPendingValidation,
  listReactivationTickets,
  rejectReactivationTicket,
  rejectUser,
  renewInvitation,
  validateUser,
} from '@/services/adminService';
import type { AdminUser, ReactivationTicket } from '@/types/users';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/httpError';

type TabKey = 'pending' | 'all' | 'reactivations';

const TABS: { value: TabKey; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'all', label: 'Todos' },
  { value: 'reactivations', label: 'Reactivaciones' },
];

const ROLE_INFO: Record<string, { label: string; tone: BadgeTone }> = {
  admin: { label: 'Admin', tone: 'purple' },
  employee: { label: 'Empleado', tone: 'blue' },
  client: { label: 'Cliente', tone: 'green' },
};

const OCCUPATION_LABELS: Record<string, string> = {
  jefe: 'Jefe',
  cortador: 'Cortador',
  guarnecedor: 'Guarnecedor',
  solador: 'Solador',
  emplantillador: 'Emplantillador',
};

const TICKET_STATUS: Record<
  ReactivationTicket['status'],
  { label: string; tone: BadgeTone }
> = {
  pending: { label: 'Pendiente', tone: 'yellow' },
  approved: { label: 'Aprobado', tone: 'green' },
  rejected: { label: 'Rechazado', tone: 'red' },
};

function getInitials(name: string, last_name: string): string {
  const initials = `${name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  return initials || '?';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInvitationInfo(user: AdminUser): { label: string; tone: BadgeTone } | null {
  if (!user.invitation_expires_at) return null;
  const expired = new Date(user.invitation_expires_at).getTime() < Date.now();
  return expired
    ? { label: 'Invitación expirada', tone: 'red' }
    : { label: 'Invitación activa', tone: 'green' };
}

function PendingUserCard({
  user,
  onApprove,
  onReject,
}: {
  user: AdminUser;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-center gap-3">
        <View className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
          <Text className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
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
          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            {user.role_name ? (
              <Badge
                tone={ROLE_INFO[user.role_name]?.tone ?? 'blue'}
                label={ROLE_INFO[user.role_name]?.label ?? user.role_name}
              />
            ) : null}
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Registrado: {formatDate(user.created_at)}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Button variant="danger" onPress={onReject} className="flex-1">
          Rechazar
        </Button>
        <Button onPress={onApprove} className="flex-1">
          Aprobar
        </Button>
      </View>
    </View>
  );
}

function AllUserCard({
  user,
  onRenew,
  onForcePassword,
  onDelete,
}: {
  user: AdminUser;
  onRenew: () => void;
  onForcePassword: () => void;
  onDelete: () => void;
}) {
  const invitation = getInvitationInfo(user);

  const showActions = () => {
    Alert.alert(`${user.name} ${user.last_name}`, user.email, [
      { text: 'Renovar invitación', onPress: onRenew },
      { text: 'Forzar cambio contraseña', onPress: onForcePassword },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-center gap-3">
        <View className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
          <Text className="text-sm font-bold text-purple-700 dark:text-purple-300">
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
          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            {user.role_name ? (
              <Badge
                tone={ROLE_INFO[user.role_name]?.tone ?? 'blue'}
                label={ROLE_INFO[user.role_name]?.label ?? user.role_name}
              />
            ) : null}
            {user.occupation ? (
              <Badge tone="blue" label={OCCUPATION_LABELS[user.occupation] ?? user.occupation} />
            ) : null}
            <Badge
              tone={user.is_active ? 'green' : 'red'}
              label={user.is_active ? 'Activo' : 'Inactivo'}
            />
            {invitation ? <Badge tone={invitation.tone} label={invitation.label} /> : null}
          </View>
        </View>

        <TouchableOpacity onPress={showActions} className="self-start p-1" hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TicketCard({
  ticket,
  onApprove,
  onReject,
}: {
  ticket: ReactivationTicket;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = TICKET_STATUS[ticket.status];

  return (
    <View className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-start gap-3">
        <View className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
          <Ionicons name="refresh-circle-outline" size={22} color="#d97706" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {ticket.email}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
            {ticket.reason}
          </Text>
          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            <Badge tone={status.tone} label={status.label} />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(ticket.created_at)}
            </Text>
          </View>
          {ticket.admin_comment ? (
            <Text className="mt-1.5 text-xs italic text-gray-500 dark:text-gray-400">
              Comentario: {ticket.admin_comment}
            </Text>
          ) : null}
        </View>
      </View>

      {ticket.status === 'pending' ? (
        <View className="mt-3 flex-row gap-2">
          <Button variant="danger" onPress={onReject} className="flex-1">
            Rechazar
          </Button>
          <Button onPress={onApprove} className="flex-1">
            Aprobar
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function PromptModal({
  visible,
  title,
  placeholder,
  confirmLabel,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>;
  loading: boolean;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  const handleConfirm = async () => {
    if (value.trim().length < 5) {
      Alert.alert('Error', 'El texto debe tener al menos 5 caracteres');
      return;
    }
    try {
      await onConfirm(value.trim());
    } catch {
      // El error ya se muestra en el onError de la mutación
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
          <Input
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            multiline
            autoCapitalize="sentences"
          />
          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onPress={handleConfirm} loading={loading} className="flex-1">
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UsersScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [prompt, setPrompt] = useState<{
    title: string;
    placeholder: string;
    confirmLabel: string;
    onConfirm: (value: string) => Promise<void>;
  } | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErrorObj,
    refetch: refetchPending,
    isRefetching: isRefetchingPending,
  } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', 'pending'],
    queryFn: () => listPendingValidation(),
  });

  const {
    data: allUsers,
    isLoading: allLoading,
    isError: allError,
    error: allErrorObj,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', 'all'],
    queryFn: () => listAllUsers(),
  });

  const {
    data: tickets,
    isLoading: ticketsLoading,
    isError: ticketsError,
    error: ticketsErrorObj,
    refetch: refetchTickets,
    isRefetching: isRefetchingTickets,
  } = useQuery<ReactivationTicket[]>({
    queryKey: ['reactivation-tickets'],
    queryFn: () => listReactivationTickets(),
  });

  const pendingUsers = (pendingData ?? []).filter((u) => !u.is_validated);

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'pending') refetchPending();
    else if (activeTab === 'all') refetchAll();
    else refetchTickets();
  }, [activeTab, refetchPending, refetchAll, refetchTickets]);

  const refreshing =
    (activeTab === 'pending' && isRefetchingPending) ||
    (activeTab === 'all' && isRefetchingAll) ||
    (activeTab === 'reactivations' && isRefetchingTickets);

  const validateMutation = useMutation({
    mutationFn: (id: string) => validateUser(id),
    onSuccess: () => {
      invalidateUsers();
      showToast('Usuario aprobado', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      rejectUser(vars.id, { reason: vars.reason }),
    onSuccess: () => {
      invalidateUsers();
      setPrompt(null);
      showToast('Usuario rechazado', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => renewInvitation(id),
    onSuccess: () => {
      invalidateUsers();
      showToast('Invitación renovada. Se envió un correo con las nuevas credenciales.', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const forcePasswordMutation = useMutation({
    mutationFn: (id: string) => forcePasswordChange(id),
    onSuccess: () => {
      invalidateUsers();
      showToast('Se forzará el cambio de contraseña en el próximo inicio de sesión', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      invalidateUsers();
      setDeleteTarget(null);
      showToast('Usuario eliminado', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const approveTicketMutation = useMutation({
    mutationFn: (vars: { id: string; comment: string }) =>
      approveReactivationTicket(vars.id, vars.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tickets'] });
      setPrompt(null);
      showToast('Solicitud de reactivación aprobada', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const rejectTicketMutation = useMutation({
    mutationFn: (vars: { id: string; comment: string }) =>
      rejectReactivationTicket(vars.id, vars.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tickets'] });
      setPrompt(null);
      showToast('Solicitud de reactivación rechazada', 'success');
    },
    onError: (e: Error) => Alert.alert('Error', getErrorMessage(e)),
  });

  const handleRejectUser = useCallback(
    (user: AdminUser) => {
      setPrompt({
        title: `Rechazar a ${user.name} ${user.last_name}`,
        placeholder: 'Motivo del rechazo (mín. 5 caracteres)',
        confirmLabel: 'Rechazar',
        onConfirm: async (reason: string) => {
          await rejectMutation.mutateAsync({ id: user.id, reason });
        },
      });
    },
    [rejectMutation],
  );

  const handleApproveTicket = useCallback(
    (ticket: ReactivationTicket) => {
      setPrompt({
        title: `Aprobar solicitud de ${ticket.email}`,
        placeholder: 'Comentario (mín. 5 caracteres)',
        confirmLabel: 'Aprobar',
        onConfirm: async (comment: string) => {
          await approveTicketMutation.mutateAsync({ id: ticket.id, comment });
        },
      });
    },
    [approveTicketMutation],
  );

  const handleRejectTicket = useCallback(
    (ticket: ReactivationTicket) => {
      setPrompt({
        title: `Rechazar solicitud de ${ticket.email}`,
        placeholder: 'Motivo del rechazo (mín. 5 caracteres)',
        confirmLabel: 'Rechazar',
        onConfirm: async (comment: string) => {
          await rejectTicketMutation.mutateAsync({ id: ticket.id, comment });
        },
      });
    },
    [rejectTicketMutation],
  );

  const renderTabContent = () => {
    if (activeTab === 'pending') {
      if (pendingLoading) return <Loading label="Cargando pendientes..." />;
      if (pendingError)
        return (
          <ErrorState message={getErrorMessage(pendingErrorObj)} onRetry={() => refetchPending()} />
        );
      if (pendingUsers.length === 0)
        return (
          <EmptyState
            icon="checkmark-done-outline"
            title="Sin solicitudes pendientes"
            message="No hay usuarios esperando validación"
          />
        );
      return (
        <FlatList
          data={pendingUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PendingUserCard
              user={item}
              onApprove={() => validateMutation.mutate(item.id)}
              onReject={() => handleRejectUser(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1e40af" />
          }
        />
      );
    }

    if (activeTab === 'all') {
      if (allLoading) return <Loading label="Cargando usuarios..." />;
      if (allError)
        return <ErrorState message={getErrorMessage(allErrorObj)} onRetry={() => refetchAll()} />;
      if ((allUsers ?? []).length === 0)
        return (
          <EmptyState
            icon="people-outline"
            title="Sin usuarios"
            message="Aún no hay usuarios registrados"
          />
        );
      return (
        <FlatList
          data={allUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AllUserCard
              user={item}
              onRenew={() => renewMutation.mutate(item.id)}
              onForcePassword={() => forcePasswordMutation.mutate(item.id)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1e40af" />
          }
        />
      );
    }

    if (ticketsLoading) return <Loading label="Cargando reactivaciones..." />;
    if (ticketsError)
      return (
        <ErrorState message={getErrorMessage(ticketsErrorObj)} onRetry={() => refetchTickets()} />
      );
    if ((tickets ?? []).length === 0)
      return (
        <EmptyState
          icon="refresh-circle-outline"
          title="Sin solicitudes de reactivación"
          message="No hay tickets de reactivación"
        />
      );
    return (
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onApprove={() => handleApproveTicket(item)}
            onReject={() => handleRejectTicket(item)}
          />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1e40af" />
        }
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Usuarios" back />

      <View className="flex-row gap-2 px-4 pb-2 pt-2">
        {TABS.map((t) => {
          const active = activeTab === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setActiveTab(t.value)}
              className={cn(
                'flex-1 items-center rounded-xl border px-2 py-2.5',
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
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {renderTabContent()}

      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar a "${deleteTarget?.name} ${deleteTarget?.last_name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />

      <PromptModal
        visible={!!prompt}
        title={prompt?.title ?? ''}
        placeholder={prompt?.placeholder ?? ''}
        confirmLabel={prompt?.confirmLabel ?? 'Aceptar'}
        onClose={() => setPrompt(null)}
        onConfirm={async (value: string) => {
          if (prompt) await prompt.onConfirm(value);
        }}
        loading={
          rejectMutation.isPending ||
          approveTicketMutation.isPending ||
          rejectTicketMutation.isPending
        }
      />
    </View>
  );
}