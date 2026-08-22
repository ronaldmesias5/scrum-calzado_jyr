import { useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (name: string, description?: string) => Promise<void>;
}

export function CategoryFormModal({ visible, onClose, initialName, initialDescription, onSubmit }: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            {initialName ? 'Editar categoría' : 'Nueva categoría'}
          </Text>
          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Nombre de la categoría" />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción breve"
          />
          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onPress={handleSubmit} loading={loading} disabled={!name.trim()} className="flex-1">
              {initialName ? 'Guardar' : 'Crear'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
