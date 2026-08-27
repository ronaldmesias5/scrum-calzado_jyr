import { Modal, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  loading?: boolean;
}

export function DeleteConfirmModal({ visible, onClose, onConfirm, title, message, loading }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
          <View className="mb-4 items-center">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
          </View>
          <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">{message}</Text>
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onPress={onConfirm} loading={loading} className="flex-1">
              Eliminar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
