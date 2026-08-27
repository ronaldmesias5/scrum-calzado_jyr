import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { cn } from '@/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        className={cn(
          'border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900',
          error && 'border-red-500 dark:border-red-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <Text className="text-xs text-red-600 dark:text-red-400">{error}</Text>
      ) : null}
    </View>
  );
});