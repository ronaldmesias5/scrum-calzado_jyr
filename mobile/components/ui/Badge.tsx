import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export type BadgeTone =
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'yellow';

const toneClasses: Record<BadgeTone, string> = {
  blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/40',
  green: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-400/40',
  red: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-400/40',
  orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-400/40',
  purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-400/40',
  yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-400/40',
};

export function Badge({
  tone,
  label,
  className,
}: {
  tone: BadgeTone;
  label: string;
  className?: string;
}) {
  return (
    <View className={cn('self-start rounded-full px-3 py-1', toneClasses[tone], className)}>
      <Text className="text-xs font-bold">{label}</Text>
    </View>
  );
}