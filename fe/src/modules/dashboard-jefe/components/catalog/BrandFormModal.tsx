/**
 * Modal: BrandFormModal.tsx
 * Crear/editar marcas
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { createBrand, updateBrand, Brand } from '../../services/catalogService';

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
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
    setError(null);
  }, [brand, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (brand) {
        await updateBrand(brand.id, formData.name, formData.description);
      } else {
        await createBrand(formData.name, formData.description);
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la marca';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {brand ? 'Editar Marca' : 'Nueva Marca'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}

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
      </div>
    </>
  );
}
