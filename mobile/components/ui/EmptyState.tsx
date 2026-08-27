import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  className,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  className?: string;
}) {
  return (
    <View className={cn('items-center justify-center gap-2 p-8', className)}>
      <Ionicons name={icon} size={48} color="#94a3b8" />
      <Text className="text-center font-bold text-gray-700 dark:text-gray-200">
        {title}
      </Text>
      {message ? (
        <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
          {message}
        </Text>
      ) : null}
    </View>
  );
}