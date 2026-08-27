import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { useUiStore } from '@/store/ui';

interface AppHeaderProps {
  title: string;
  back?: boolean;
}

export function AppHeader({ title, back = false }: AppHeaderProps) {
  const colorScheme = useColorScheme();
  const openMenu = useUiStore((state) => state.openMenu);
  const iconColor = colorScheme === 'dark' ? '#e2e8f0' : '#334155';

  return (
    <View className="border-b border-gray-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
      <View className="flex-row items-center gap-3">
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            className="active:opacity-60"
          >
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </Pressable>
        ) : (
          <Pressable
            onPress={openMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de secciones"
            className="active:opacity-60"
          >
            <Ionicons name="menu" size={26} color={iconColor} />
          </Pressable>
        )}
        <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>
      </View>
    </View>
  );
}