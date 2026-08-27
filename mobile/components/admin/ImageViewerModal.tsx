import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
  imageUrl: string | null;
  productName: string;
  onClose: () => void;
}

export function ImageViewerModal({ visible, imageUrl, productName, onClose }: Props) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!visible) setZoom(1);
  }, [visible]);

  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/90">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-2">
          <Text className="flex-1 text-sm font-bold text-white" numberOfLines={1}>
            {productName}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setZoom((z) => Math.min(z + 0.3, 3))}
              className="rounded-lg bg-white/10 p-2"
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setZoom((z) => Math.max(z - 0.3, 0.5))}
              className="rounded-lg bg-white/10 p-2"
            >
              <Ionicons name="remove-circle-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={onClose} className="rounded-lg bg-white/10 p-2">
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Image */}
        <View className="flex-1 items-center justify-center">
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 300, height: 300, transform: [{ scale: zoom }] }}
              resizeMode="contain"
            />
          </ScrollView>
        </View>

        {/* Footer */}
        <View className="items-center border-t border-white/10 py-3">
          <Text className="text-xs text-white/50">Pellizca para hacer zoom</Text>
        </View>
      </View>
    </Modal>
  );
}
