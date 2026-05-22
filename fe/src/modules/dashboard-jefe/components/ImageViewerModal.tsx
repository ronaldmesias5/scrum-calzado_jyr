import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  productName: string;
  onClose: () => void;
}

export default function ImageViewerModal({
  isOpen,
  imageUrl,
  productName,
  onClose,
}: ImageViewerModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productName}
      size="full"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col h-full">

        {/* Imagen */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-10 bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
          <img
            src={imageUrl}
            alt={productName}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-6 flex justify-end bg-white dark:bg-slate-900 transition-colors">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all font-bold text-sm active:scale-[0.98] border border-gray-200 dark:border-slate-700"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </Modal>
  );
}
