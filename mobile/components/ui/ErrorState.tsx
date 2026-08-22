import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-slate-950">
      <Ionicons name="cloud-offline-outline" size={48} color="#94a3b8" />
      <Text className="text-center text-gray-600 dark:text-gray-300">
        {message}
      </Text>
      {onRetry ? (
        <Button title="Reintentar" onPress={onRetry} className="mt-2" />
      ) : null}
    </View>
  );
}