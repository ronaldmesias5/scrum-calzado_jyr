import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Brand } from '@/types/catalog';

interface Props {
  visible: boolean;
  onClose: () => void;
  brands: Brand[];
  initialName?: string;
  initialDescription?: string;
  initialBrandId?: string;
  onSubmit: (name: string, brandId: string, description?: string) => Promise<void>;
}

export function StyleFormModal({
  visible,
  onClose,
  brands,
  initialName,
  initialDescription,
  initialBrandId,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [brandId, setBrandId] = useState(initialBrandId ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setDescription(initialDescription ?? '');
      setBrandId(initialBrandId ?? (brands.length === 1 ? brands[0].id : ''));
    }
  }, [visible, initialName, initialDescription, initialBrandId, brands]);

  const handleSubmit = async () => {
    if (!name.trim() || !brandId) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), brandId, description.trim() || undefined);
      setName('');
      setDescription('');
      setBrandId('');
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
            {initialName ? 'Editar estilo' : 'Nuevo estilo'}
          </Text>
          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Nombre del estilo" />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción breve"
          />
          <Text className="mb-1 mt-2 text-sm font-bold text-gray-700 dark:text-gray-300">Marca *</Text>
          <View className="flex-row flex-wrap gap-2">
            {brands.map((b) => (
              <Button
                key={b.id}
                variant={brandId === b.id ? 'primary' : 'outline'}
                onPress={() => setBrandId(b.id)}
              >
                {b.name}
              </Button>
            ))}
          </View>
          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" onPress={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onPress={handleSubmit} loading={loading} disabled={!name.trim() || !brandId} className="flex-1">
              {initialName ? 'Guardar' : 'Crear'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
