import { ActivityIndicator, Text, View } from 'react-native';

export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-gray-50 dark:bg-slate-950">
      <ActivityIndicator size="large" color="#1e40af" />
      {label ? (
        <Text className="text-sm text-gray-500 dark:text-gray-400">{label}</Text>
      ) : null}
    </View>
  );
}