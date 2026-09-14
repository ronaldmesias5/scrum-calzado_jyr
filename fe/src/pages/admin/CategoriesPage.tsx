import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, Package } from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';

interface Category {
  id: string;
  name: string;
  description: string | null;
  product_count: number;
  created_at: string | null;
}

const API = import.meta.env.VITE_API_URL || '';

function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
  title
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  initial?: Category | null;
  title: string;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (e: any) {
      showToast(e?.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Nombre de la Categoría *
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ej: Hombre, Mujer, Niño..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Descripción de la categoría..."
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Guardando...' : initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/api/v1/admin/catalog/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (data: { name: string; description: string }) => {
    const token = localStorage.getItem('access_token');
    const url = editTarget
      ? `${API}/api/v1/admin/catalog/categories/${editTarget.id}`
      : `${API}/api/v1/admin/catalog/categories`;
    const method = editTarget ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.detail || 'Error al guardar');
    }

    showToast(editTarget ? 'Categoría actualizada' : 'Categoría creada', 'success');
    await fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem('access_token');
    const res = await fetch(
      `${API}/api/v1/admin/catalog/categories/${deleteTarget.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      showToast(json.detail || 'Error al eliminar', 'error');
      setDeleteTarget(null);
      return;
    }

    showToast('Categoría eliminada', 'success');
    setDeleteTarget(null);
    await fetchCategories();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
            Categorías
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Clasificación de productos del catálogo
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Tag size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              No hay categorías registradas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Descripción
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Productos
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {cat.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cat.description || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full">
                        <Package size={12} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {cat.product_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditTarget(cat);
                            setShowForm(true);
                          }}
                          title="Editar"
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          title="Eliminar"
                          className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <CategoryFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
        title={editTarget ? 'Editar Categoría' : 'Nueva Categoría'}
      />

      {/* Modal Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Categoría"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Estás seguro de eliminar la categoría{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {deleteTarget?.name}
            </span>
            ?
          </p>
          {deleteTarget && deleteTarget.product_count > 0 && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-bold">
              Tiene {deleteTarget.product_count} producto(s) asociado(s) y no se
              podrá eliminar.
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
            disabled={deleteTarget?.product_count ? deleteTarget.product_count > 0 : false}
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
