import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { catalogService } from '@/services/catalogService';
import type { Product } from '@/types/catalog';

interface Props {
  visible: boolean;
  onClose: () => void;
  editProduct?: Product;
}

export function ProductFormModal({ visible, onClose, editProduct }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brandId, setBrandId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [threshold, setThreshold] = useState('12');
  const [loading, setLoading] = useState(false);

  const brands = useQuery({ queryKey: ['admin-brands'], queryFn: () => catalogService.listAdminBrands() });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => catalogService.listCategories() });
  const styles = useQuery({
    queryKey: ['admin-styles', brandId],
    queryFn: () => catalogService.listAdminStyles(brandId || undefined),
    enabled: visible,
  });

  useEffect(() => {
    if (visible && editProduct) {
      setName(editProduct.name);
      setDescription(editProduct.description ?? '');
      setColor(editProduct.color ?? '');
      setBrandId(editProduct.brand_id);
      setStyleId(editProduct.style_id);
      setCategoryId(editProduct.category_id);
      setThreshold(String(editProduct.insufficient_threshold));
    } else if (visible) {
      setName('');
      setDescription('');
      setColor('');
      setBrandId('');
      setStyleId('');
      setCategoryId('');
      setThreshold('12');
    }
  }, [visible, editProduct]);

  const filteredStyles = brandId
    ? (styles.data ?? []).filter((s) => s.brand_id === brandId)
    : styles.data ?? [];

  const handleSubmit = async () => {
    if (!brandId || !styleId || !categoryId) {
      Alert.alert('Error', 'Selecciona marca, estilo y categoría');
      return;
    }
    setLoading(true);
    try {
      const body = {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        color: color.trim() || undefined,
        brand_id: brandId,
        style_id: styleId,
        category_id: categoryId,
        insufficient_threshold: parseInt(threshold, 10) || 12,
      };
      if (editProduct) {
        await catalogService.updateProduct(editProduct.id, body);
      } else {
        await catalogService.createProduct(body);
      }
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ children }: { children: string }) => (
    <Text className="mb-2 mt-4 text-sm font-bold uppercase text-gray-400 dark:text-gray-500">
      {children}
    </Text>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 rounded-t-3xl bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {editProduct ? 'Editar producto' : 'Nuevo producto'}
            </Text>
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </View>

          <ScrollView contentContainerClassName="px-6 pb-10">
            <Input label="Nombre" value={name} onChangeText={setName} placeholder="Nombre del producto" />
            <Input label="Descripción" value={description} onChangeText={setDescription} placeholder="Descripción" />
            <Input label="Color" value={color} onChangeText={setColor} placeholder="Color (opcional)" />
            <Input
              label="Umbral stock bajo"
              value={threshold}
              onChangeText={setThreshold}
              placeholder="12"
              keyboardType="numeric"
            />

            <SectionTitle>Marca *</SectionTitle>
            <View className="flex-row flex-wrap gap-2">
              {(brands.data ?? []).map((b) => (
                <Button
                  key={b.id}
                  variant={brandId === b.id ? 'primary' : 'outline'}
                  onPress={() => {
                    setBrandId(b.id);
                    setStyleId('');
                  }}
                >
                  {b.name}
                </Button>
              ))}
            </View>

            <SectionTitle>Estilo *</SectionTitle>
            {brandId ? (
              <View className="flex-row flex-wrap gap-2">
                {filteredStyles.map((s) => (
                  <Button
                    key={s.id}
                    variant={styleId === s.id ? 'primary' : 'outline'}
                    onPress={() => setStyleId(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
                {filteredStyles.length === 0 && (
                  <Text className="text-sm text-gray-500">No hay estilos para esta marca</Text>
                )}
              </View>
            ) : (
              <Text className="text-sm text-gray-500">Selecciona una marca primero</Text>
            )}

            <SectionTitle>Categoría *</SectionTitle>
            <View className="flex-row flex-wrap gap-2">
              {(categories.data ?? []).map((c) => (
                <Button
                  key={c.id}
                  variant={categoryId === c.id ? 'primary' : 'outline'}
                  onPress={() => setCategoryId(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </View>

            <Button onPress={handleSubmit} loading={loading} className="mt-6" disabled={!brandId || !styleId || !categoryId}>
              {editProduct ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
