import { Redirect, Stack } from 'expo-router';

import { HubMenu } from '@/components/admin/HubMenu';
import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/auth';
import { isJefe } from '@/utils/roles';

export default function AdminLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!user) {
    return <Loading label="Cargando sesión..." />;
  }

  if (!isJefe(user)) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order-detail" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="catalog-manage" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="insumos" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="employees" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="users" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="settings" />
      </Stack>
      <HubMenu />
    </>
  );
}
