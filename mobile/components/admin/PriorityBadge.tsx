import { View, Text } from 'react-native';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  alta: {
    bg: 'bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-400/40',
    text: 'text-red-700 dark:text-red-300',
    label: 'ALTA',
  },
  baja: {
    bg: 'bg-gray-100 dark:bg-gray-500/20 border-gray-200 dark:border-gray-400/40',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'BAJA',
  },
};

export function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.baja;
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 border ${style.bg}`}>
      <Text className={`text-[10px] font-bold ${style.text}`}>{style.label}</Text>
    </View>
  );
}
