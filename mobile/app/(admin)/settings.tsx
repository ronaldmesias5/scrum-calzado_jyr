import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/cn';

function fullName(user: { name: string; last_name: string } | null): string {
  if (!user) return '';
  return `${user.name} ${user.last_name}`.trim();
}

function roleBadgeTone(roleName: string | null): BadgeTone {
  switch (roleName) {
    case 'admin':
      return 'purple';
    case 'employee':
      return 'blue';
    case 'client':
      return 'green';
    default:
      return 'blue';
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 mt-6 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
      {children}
    </Text>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-gray-100 py-3.5 dark:border-slate-800">
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color="#94a3b8" />
      <View className="flex-1">
        <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
        <Text className="text-sm font-medium text-gray-900 dark:text-white">{value}</Text>
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-gray-100 py-3.5 dark:border-slate-800">
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color="#94a3b8" />
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">{label}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#cbd5e1', true: '#1e40af' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 border-b border-gray-100 py-3.5 dark:border-slate-800',
      )}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={18}
        color={danger ? '#ef4444' : '#94a3b8'}
      />
      <Text
        onPress={onPress}
        className={cn(
          'flex-1 text-sm font-medium',
          danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white',
        )}
      >
        {label}
      </Text>
      {!danger && (
        <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
      )}
    </View>
  );
}

interface NotifPrefs {
  stockAlerts: boolean;
  newOrders: boolean;
  appUpdates: boolean;
}

interface AppearancePrefs {
  darkMode: 'system' | 'light' | 'dark';
  compactView: boolean;
}

async function loadPrefs<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function savePrefs(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const [notif, setNotif] = useState<NotifPrefs>({
    stockAlerts: true,
    newOrders: true,
    appUpdates: false,
  });
  const [appearance, setAppearance] = useState<AppearancePrefs>({
    darkMode: 'system',
    compactView: false,
  });
  useEffect(() => {
    (async () => {
      const [n, a] = await Promise.all([
        loadPrefs<NotifPrefs>('cfg_notif', { stockAlerts: true, newOrders: true, appUpdates: false }),
        loadPrefs<AppearancePrefs>('cfg_appearance', { darkMode: 'system', compactView: false }),
      ]);
      setNotif(n);
      setAppearance(a);
    })();
  }, []);

  const updateNotif = useCallback(
    async (patch: Partial<NotifPrefs>) => {
      const next = { ...notif, ...patch };
      setNotif(next);
      await savePrefs('cfg_notif', next);
    },
    [notif],
  );

  const updateAppearance = useCallback(
    async (patch: Partial<AppearancePrefs>) => {
      const next = { ...appearance, ...patch };
      setAppearance(next);
      await savePrefs('cfg_appearance', next);
    },
    [appearance],
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Configuración" back />
      <ScrollView contentContainerClassName="p-5 pb-10">
        {/* ─── Perfil ─── */}
        <Card className="mb-4 gap-3">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary dark:bg-primary-light">
              {user?.avatar_url ? (
                <Text className="text-xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              ) : (
                <Text className="text-xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              )}
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {fullName(user)}
              </Text>
              <View className="flex-row items-center gap-2">
                <Badge tone={roleBadgeTone(user?.role_name ?? null)} label={user?.role_name ?? '—'} />
                {user?.occupation ? (
                  <Badge tone="yellow" label={user.occupation} />
                ) : null}
              </View>
            </View>
          </View>
        </Card>

        {/* ─── Información de la cuenta ─── */}
        <SectionTitle>Información de la cuenta</SectionTitle>
        <Card className="gap-0">
          <InfoRow icon="mail-outline" label="Correo electrónico" value={user?.email ?? '—'} />
          <InfoRow icon="person-outline" label="Ocupación" value={user?.occupation ?? '—'} />
          <InfoRow
            icon="business-outline"
            label="Documento de identidad"
            value={user?.identity_document ?? '—'}
          />
          <InfoRow icon="call-outline" label="Teléfono" value={user?.phone ?? '—'} />
          {user?.business_name ? (
            <InfoRow icon="storefront-outline" label="Empresa" value={user.business_name} />
          ) : null}
        </Card>

        {/* ─── Notificaciones ─── */}
        <SectionTitle>Notificaciones</SectionTitle>
        <Card className="gap-0">
          <ToggleRow
            icon="alert-circle-outline"
            label="Alertas de stock bajo"
            description="Recibe avisos cuando el stock esté por debajo del mínimo"
            value={notif.stockAlerts}
            onValueChange={(v) => updateNotif({ stockAlerts: v })}
          />
          <ToggleRow
            icon="receipt-outline"
            label="Nuevos pedidos"
            description="Notificación cuando se cree un nuevo pedido"
            value={notif.newOrders}
            onValueChange={(v) => updateNotif({ newOrders: v })}
          />
          <ToggleRow
            icon="information-circle-outline"
            label="Actualizaciones de la app"
            description="Avisos sobre nuevas funciones y mejoras"
            value={notif.appUpdates}
            onValueChange={(v) => updateNotif({ appUpdates: v })}
          />
        </Card>

        {/* ─── Apariencia ─── */}
        <SectionTitle>Apariencia</SectionTitle>
        <Card className="gap-0">
          <View className="flex-row items-center gap-3 border-b border-gray-100 py-3.5 dark:border-slate-800">
            <Ionicons name="color-palette-outline" size={18} color="#94a3b8" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                Modo oscuro
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Sigue la configuración del sistema
              </Text>
            </View>
            <Badge
              tone="blue"
              label={appearance.darkMode === 'system' ? 'Sistema' : appearance.darkMode === 'dark' ? 'Oscuro' : 'Claro'}
            />
          </View>
          <ToggleRow
            icon="resize-outline"
            label="Vista compacta"
            description="Reduce el espaciado entre elementos"
            value={appearance.compactView}
            onValueChange={(v) => updateAppearance({ compactView: v })}
          />
        </Card>

        {/* ─── Seguridad ─── */}
        <SectionTitle>Seguridad</SectionTitle>
        <Card className="gap-0">
          <ActionRow
            icon="key-outline"
            label="Cambiar contraseña"
            onPress={() => router.push('/forgot-password')}
          />
          <InfoRow icon="shield-checkmark-outline" label="Sesión activa" value="JWT (Expo SecureStore)" />
          <InfoRow
            icon="time-outline"
            label="Último acceso"
            value={new Date().toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          />
        </Card>

        {/* ─── Acciones ─── */}
        <SectionTitle>Acciones</SectionTitle>
        <Card className="gap-0">
          <ActionRow
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={handleLogout}
            danger
          />
        </Card>

        {/* ─── Acerca de ─── */}
        <SectionTitle>Acerca de</SectionTitle>
        <Card className="gap-0">
          <InfoRow icon="phone-portrait-outline" label="Aplicación" value="CALZADO J&R Mobile" />
          <InfoRow icon="code-outline" label="Versión" value="1.0.0" />
          <InfoRow icon="build-outline" label="SDK" value="Expo SDK 54" />
          <InfoRow icon="logo-react" label="Framework" value="React Native 0.81" />
        </Card>
      </ScrollView>
    </View>
  );
}
