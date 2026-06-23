/**
 * Modal: BrandFormModal.tsx
 * Crear/editar marcas
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createBrand, updateBrand, Brand } from '../../services/catalogService';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

interface BrandFormModalProps {
  isOpen: boolean;
  brand?: Brand | null;
  onClose: () => void;
  onSave: () => void;
}

export default function BrandFormModal({
  isOpen,
  brand,
  onClose,
  onSave,
}: BrandFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [brand, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (brand) {
        await updateBrand(brand.id, formData.name, formData.description);
      } else {
        await createBrand(formData.name, formData.description);
      }
      onSave();
      onClose();
      showToast(brand ? 'Marca actualizada correctamente' : 'Marca creada correctamente', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la marca';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brand ? 'Editar Marca' : 'Nueva Marca'}
      size="md"
    >
      <div className="flex flex-col">
        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Nombre
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
                placeholder="Ej: Nike"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-gray-100 transition-all"
                placeholder="Ej: Marca estadounidense de calzado y ropa deportiva"
              />
              <span className="text-[10px] text-gray-400 text-right block mt-0.5">{formData.description.length}/500</span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {brand ? 'Actualizar' : 'Crear Marca'}
              </button>
            </div>
          </form>
          </div>
    </Modal>
  );
}
