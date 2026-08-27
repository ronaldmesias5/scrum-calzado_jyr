import { useState } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from '@/utils/cn';

interface Props {
  visible: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  orderId: string;
}

export function ContactClientModal({
  visible,
  onClose,
  clientName,
  clientEmail,
  clientPhone,
  orderId,
}: Props) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEmail = () => {
    if (clientEmail) {
      Linking.openURL(`mailto:${clientEmail}?subject=Pedido ${orderId.slice(0, 8)}`);
    }
  };

  const handlePhone = () => {
    if (clientPhone) {
      Linking.openURL(`tel:${clientPhone}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Contactar Cliente
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <Text className="mb-4 text-xs font-bold uppercase text-gray-400 dark:text-gray-500">
            {clientName}
          </Text>

          {/* Email */}
          <View
            className={cn(
              'mb-3 flex-row items-center gap-3 rounded-xl border p-3',
              clientEmail
                ? 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800'
                : 'border-gray-200 bg-gray-50 opacity-60 dark:border-slate-800 dark:bg-slate-900',
            )}
          >
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Ionicons name="mail-outline" size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase text-gray-400">Electrónico</Text>
              <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {clientEmail || 'No registrado'}
              </Text>
            </View>
            {clientEmail && (
              <View className="flex-row gap-1">
                <Pressable
                  onPress={() => handleCopy(clientEmail, 'email')}
                  className="rounded-lg bg-gray-200 p-2 dark:bg-slate-700"
                >
                  <Ionicons name="copy-outline" size={16} color="#64748b" />
                </Pressable>
                <Pressable
                  onPress={handleEmail}
                  className="rounded-lg bg-blue-600 p-2"
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Phone */}
          <View
            className={cn(
              'mb-3 flex-row items-center gap-3 rounded-xl border p-3',
              clientPhone
                ? 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800'
                : 'border-gray-200 bg-gray-50 opacity-60 dark:border-slate-800 dark:bg-slate-900',
            )}
          >
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Ionicons name="call-outline" size={20} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase text-gray-400">Teléfono Móvil</Text>
              <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {clientPhone || 'No registrado'}
              </Text>
            </View>
            {clientPhone && (
              <View className="flex-row gap-1">
                <Pressable
                  onPress={() => handleCopy(clientPhone, 'phone')}
                  className="rounded-lg bg-gray-200 p-2 dark:bg-slate-700"
                >
                  <Ionicons name="copy-outline" size={16} color="#64748b" />
                </Pressable>
                <Pressable
                  onPress={handlePhone}
                  className="rounded-lg bg-green-600 p-2"
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Copied feedback */}
          {copied && (
            <View className="mt-2 items-center">
              <Text className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">
                {copied === 'email' ? '✓ Email copiado' : '✓ Teléfono copiado'}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View className="mt-4 items-end border-t border-gray-100 pt-4 dark:border-slate-800">
            <Pressable
              onPress={onClose}
              className="rounded-xl border border-gray-200 px-6 py-2.5 dark:border-slate-700"
            >
              <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Cerrar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
