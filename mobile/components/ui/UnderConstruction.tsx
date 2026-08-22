import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';

export function UnderConstruction({
  icon = 'construct-outline',
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      contentContainerClassName="p-5 pb-10"
    >
      <EmptyState icon={icon} title={title} message={message} className="mt-10" />
    </ScrollView>
  );
}