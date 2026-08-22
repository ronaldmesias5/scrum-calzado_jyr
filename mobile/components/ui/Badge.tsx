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
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
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