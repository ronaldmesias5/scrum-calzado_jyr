import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionTile } from '@/components/ui/SectionTile';
import { ADMIN_SECTIONS } from '@/constants/adminSections';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

function fullName(user: { name: string; last_name: string } | null): string {
  if (!user) return '';
  return `${user.name} ${user.last_name}`.trim();
}

export function HubMenu() {
  const menuOpen = useUiStore((state) => state.menuOpen);
  const closeMenu = useUiStore((state) => state.closeMenu);
  const user = useAuthStore((state) => state.user);
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#e2e8f0' : '#334155';

  return (
    <Modal
      visible={menuOpen}
      animationType="slide"
      onRequestClose={closeMenu}
      statusBarTranslucent
    >
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary dark:bg-primary-light">
                <Text className="text-base font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  ¡Hola, {fullName(user)}!
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={closeMenu}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              className="active:opacity-60"
            >
              <Ionicons name="close" size={28} color={iconColor} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-10">
            <Text className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              Secciones
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {ADMIN_SECTIONS.map((section) => (
                <SectionTile key={section.key} section={section} onPress={closeMenu} />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}