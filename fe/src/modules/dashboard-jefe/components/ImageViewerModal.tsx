import React from 'react';
import { X } from 'lucide-react';

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
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-8 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800 transition-all pointer-events-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{productName}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

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
    </div>
  );
}
