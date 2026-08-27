import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { AdminSection } from '@/constants/adminSections';

export function SectionTile({
  section,
  onPress,
}: {
  section: AdminSection;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        onPress?.();
        router.navigate(section.href as Href);
      }}
      className="w-[48%] rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:scale-95 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${section.color}1f` }}
      >
        <Ionicons name={section.icon} size={20} color={section.color} />
      </View>
      <Text className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
        {section.label}
      </Text>
    </Pressable>
  );
}