import { View } from 'react-native';
import type { ViewProps } from 'react-native';

import { cn } from '@/utils/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}