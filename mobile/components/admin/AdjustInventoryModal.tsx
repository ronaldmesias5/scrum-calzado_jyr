import { useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  visible: boolean;
  onClose: () => void;
  productName: string;
  currentSize?: string;
  currentQuantity?: number;
  onSubmit: (size: string, quantity: number) => Promise<void>;
}

export function AdjustInventoryModal({
  visible,
  onClose,
  productName,
  currentSize,
  currentQuantity,
  onSubmit,
}: Props) {
  const [size, setSize] = useState(currentSize ?? '');
  const [quantity, setQuantity] = useState(currentQuantity?.toString() ?? '0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!size.trim() || isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Ingresa una talla válida y cantidad ≥ 0');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(size.trim(), qty);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
            Ajustar inventario
          </Text>
          <Text className="mb-4 text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {productName}
          </Text>
          <Input
            label="Talla"
            value={size}
            onChangeText={setSize}
            placeholder="Ej: 39, 40, M"
            editable={!currentSize}
          />
          <Input
            label="Cantidad (pares)"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            keyboardType="numeric"
          />
          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onPress={handleSubmit} loading={loading} className="flex-1">
              Guardar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
