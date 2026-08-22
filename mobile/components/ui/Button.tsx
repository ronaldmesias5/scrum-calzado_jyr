import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends PressableProps {
  title?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

const containerClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary dark:bg-primary-light rounded-xl shadow-lg active:scale-95 active:opacity-90',
  outline:
    'border border-gray-300 dark:border-slate-600 bg-transparent rounded-xl active:scale-95 active:opacity-90',
  ghost: 'active:opacity-70',
  danger:
    'bg-red-600 dark:bg-red-500 rounded-xl shadow-lg active:scale-95 active:opacity-90',
};

const labelClasses: Record<ButtonVariant, string> = {
  primary: 'text-white font-bold',
  outline: 'text-primary dark:text-primary-light font-bold',
  ghost: 'text-primary dark:text-primary-light font-bold',
  danger: 'text-white font-bold',
};

export function Button({
  title,
  children,
  variant = 'primary',
  loading,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const content = children ?? title;
  const isStringContent = typeof content === 'string';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center px-4 py-3.5',
        containerClasses[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#1e40af' : '#ffffff'}
        />
      ) : isStringContent ? (
        <Text className={cn('text-base', labelClasses[variant], textClassName)}>
          {content}
        </Text>
      ) : (
        content
      )}
    </Pressable>
  );
}
