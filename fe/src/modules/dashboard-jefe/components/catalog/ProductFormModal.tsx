/**
 * Modal: ProductFormModal.tsx
 * Crear/editar productos con cascada: marca → estilo → categoría
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import {
  createProduct,
  updateProduct,
  Product,
  Brand,
  Style,
  Category,
} from '../../services/catalogService';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null;
  brands: Brand[];
  styles: Style[];
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export default function ProductFormModal({
  isOpen,
  product,
  brands,
  styles,
  categories,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand_id: '',
    style_id: '',
    category_id: '',
  });
  const [filteredStyles, setFilteredStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        brand_id: product.brand_id,
        style_id: product.style_id,
        category_id: product.category_id,
      });
      // Filtrar estilos por marca del producto
      const filtered = styles.filter(s => s.brand_id === product.brand_id);
      setFilteredStyles(filtered);
    } else {
      setFormData({
        name: '',
        description: '',
        brand_id: '',
        style_id: '',
        category_id: '',
      });
      setFilteredStyles([]);
    }
    setError(null);
  }, [product, isOpen, styles]);

  const handleBrandChange = (brandId: string) => {
    setFormData({
      ...formData,
      brand_id: brandId,
      style_id: '', // Reset style when brand changes
    });
    // Filtrar estilos por marca seleccionada
    const filtered = styles.filter(s => s.brand_id === brandId);
    setFilteredStyles(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.brand_id || !formData.style_id || !formData.category_id) {
        throw new Error('Debes seleccionar marca, estilo y categoría');
      }

      if (product) {
        await updateProduct(product.id, {
          brand_id: formData.brand_id,
          style_id: formData.style_id,
          category_id: formData.category_id,
          name: formData.name,
          description: formData.description
        });
      } else {
        await createProduct(
          formData.brand_id,
          formData.style_id,
          formData.category_id,
          formData.name,
          formData.description
        );
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el producto';
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800 transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
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
                Marca * (Paso 1)
              </label>
              <select
                required
                value={formData.brand_id}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
              >
                <option value="" className="dark:bg-slate-800">Selecciona una marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="dark:bg-slate-800">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Estilo * (Paso 2)
              </label>
              <select
                required
                disabled={!formData.brand_id}
                value={formData.style_id}
                onChange={(e) => setFormData({ ...formData, style_id: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-900"
              >
                <option value="" className="dark:bg-slate-800">
                  {formData.brand_id ? 'Selecciona un estilo' : 'Primero selecciona una marca'}
                </option>
                {filteredStyles.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-800">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Categoría * (Paso 3)
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
              >
                <option value="" className="dark:bg-slate-800">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Nombre (opcional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
                placeholder="Si no ingresas, se genera automáticamente"
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-gray-100 font-medium transition-all"
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
                {product ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
