import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICON_MAP: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
};

const BG_MAP: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-amber-500',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => onDismiss(toast.id));
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{ opacity, pointerEvents: 'auto' }}
      className="mb-2"
    >
      <Pressable
        onPress={() => onDismiss(toast.id)}
        className={`${BG_MAP[toast.type]} flex-row items-center gap-3 rounded-2xl px-5 py-3 shadow-2xl`}
      >
        <Ionicons name={ICON_MAP[toast.type]} size={20} color="white" />
        <Text className="flex-1 text-sm font-semibold text-white">{toast.message}</Text>
        <Ionicons name="close" size={16} color="white" />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = String(++counterRef.current);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — rendered via transparent Modal so it appears ABOVE other Modals */}
      <Modal transparent animationType="none" statusBarTranslucent>
        <View
          style={{ pointerEvents: 'none', paddingTop: (insets.top || (Platform.OS === 'ios' ? 54 : 48)) + 8 }}
          className="absolute left-0 right-0 z-[9999] items-center px-4"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
