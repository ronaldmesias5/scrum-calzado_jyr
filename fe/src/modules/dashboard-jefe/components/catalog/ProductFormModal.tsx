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
  listStyles,
} from '../../services/catalogService';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null;
  brands: Brand[];
  styles: Style[];
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  loadStyles: (brandId?: string) => Promise<void>;
}

export default function ProductFormModal({
  isOpen,
  product,
  brands,
  styles,
  categories,
  onClose,
  onSave,
  loadStyles,
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
        await updateProduct(
          product.id,
          formData.brand_id,
          formData.style_id,
          formData.category_id,
          formData.name,
          formData.description
        );
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
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca * (Paso 1)
              </label>
              <select
                required
                value={formData.brand_id}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estilo * (Paso 2)
              </label>
              <select
                required
                disabled={!formData.brand_id}
                value={formData.style_id}
                onChange={(e) => setFormData({ ...formData, style_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
              >
                <option value="">
                  {formData.brand_id ? 'Selecciona un estilo' : 'Primero selecciona una marca'}
                </option>
                {filteredStyles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría * (Paso 3)
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre (opcional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Si no ingresas, se genera automáticamente: '{estilo} - {categoría}'"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {product ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
