import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';

export default function AdminProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Perfil" />
      <ScrollView contentContainerClassName="p-5 pb-10">

      <Card className="mt-4 gap-3">
        <View className="flex-row items-center gap-3">
          <Text className="w-32 text-sm text-gray-500 dark:text-gray-400">Nombre</Text>
          <Text className="flex-1 text-sm font-bold text-gray-900 dark:text-white">
            {user?.name} {user?.last_name}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="w-32 text-sm text-gray-500 dark:text-gray-400">Correo</Text>
          <Text className="flex-1 text-sm text-gray-900 dark:text-white">
            {user?.email}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="w-32 text-sm text-gray-500 dark:text-gray-400">Rol</Text>
          <Badge tone="blue" label={user?.role_name ?? '—'} />
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="w-32 text-sm text-gray-500 dark:text-gray-400">Ocupación</Text>
          <Text className="flex-1 text-sm text-gray-900 dark:text-white">
            {user?.occupation ?? '—'}
          </Text>
        </View>
      </Card>

      <Button
        title="Cerrar sesión"
        variant="danger"
        onPress={handleLogout}
        className="mt-6"
      />
      </ScrollView>
    </View>
  );
}