import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { cn } from '@/utils/cn';

type StatColor = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';

const colorMap: Record<StatColor, { bg: string; iconBg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950/30', iconBg: 'bg-green-100 dark:bg-green-900/50', icon: 'text-green-600 dark:text-green-400' },
  red: { bg: 'bg-red-50 dark:bg-red-950/30', iconBg: 'bg-red-100 dark:bg-red-900/50', icon: 'text-red-600 dark:text-red-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', iconBg: 'bg-orange-100 dark:bg-orange-900/50', icon: 'text-orange-600 dark:text-orange-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', iconBg: 'bg-purple-100 dark:bg-purple-900/50', icon: 'text-purple-600 dark:text-purple-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', iconBg: 'bg-yellow-100 dark:bg-yellow-900/50', icon: 'text-yellow-600 dark:text-yellow-400' },
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Pedidos Pendientes': 'receipt-outline',
  'En Producción': 'construct-outline',
  'Pares en Stock': 'cube-outline',
  'Incidencias Abiertas': 'warning-outline',
};

const colorByLabel: Record<string, StatColor> = {
  'Pedidos Pendientes': 'orange',
  'En Producción': 'blue',
  'Pares en Stock': 'green',
  'Incidencias Abiertas': 'red',
};

export function StatCard({
  label,
  value,
  color = 'blue',
  className,
}: {
  label: string;
  value: number;
  color?: StatColor;
  className?: string;
}) {
  const palette = colorMap[color];
  const iconName = iconMap[label] ?? 'analytics-outline';

  return (
    <View className={cn('w-[48%] rounded-xl p-4', palette.bg, className)}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className={`h-10 w-10 items-center justify-center rounded-lg ${palette.iconBg}`}>
          <Ionicons name={iconName} size={20} className={palette.icon} />
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
      <Text className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

export function resolveStatColor(label: string): StatColor {
  return colorByLabel[label] ?? 'blue';
}
