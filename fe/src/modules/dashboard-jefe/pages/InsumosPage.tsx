import { useState, useEffect, useCallback } from 'react';
import { Package2, Plus, Search, Link, Trash2, Edit2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  listSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  deleteCategory,
  linkSupplyToProduct,
  unlinkSupplyFromProduct,
  Supply,
  SupplyCreatePayload,
} from '../services/suppliesService';
import { getProducts } from '../services/ordersApi';

// ─── Helpers ────────────────────────────────────────────────
const DEFAULT_CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'all',        label: 'Todos',      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { key: 'corte',      label: 'Corte',      color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' },
  { key: 'guarnicion', label: 'Guarnición', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
  { key: 'soladura',   label: 'Soladura',   color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' },
  { key: 'terminado',  label: 'Terminado',  color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
  { key: 'otros',      label: 'Otros',      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
];

// Mapa de colores: nombre del color -> clases Tailwind
const COLOR_MAP: Record<string, string> = {
  amber:    'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
  blue:     'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
  purple:   'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
  green:    'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700',
  gray:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  red:      'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700',
  orange:   'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700',
  yellow:   'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700',
  lime:     'bg-lime-100 dark:bg-lime-900/40 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-700',
  cyan:     'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700',
  indigo:   'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700',
  pink:     'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-700',
  rose:     'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700',
};

const getCategoryColor = (key: string, categoryColor?: string) => {
  // Si tenemos un color del backend, usarlo
  if (categoryColor && COLOR_MAP[categoryColor]) {
    return COLOR_MAP[categoryColor];
  }
  // Sino, usar el color predefinido
  const found = DEFAULT_CATEGORIES.find(c => c.key === key.toLowerCase());
  return found ? found.color : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
};

const CATEGORY_BADGE: Record<string, string> = {
  corte:      'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
  guarnicion: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
  soladura:   'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
  terminado:  'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700',
  otros:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
};

const CATEGORY_LABEL: Record<string, string> = {
  corte: 'Corte', guarnicion: 'Guarnición', soladura: 'Soladura', terminado: 'Terminado', otros: 'Otros',
};

// ─── Subcomponente: Modal Crear/Editar ──────────────────────
interface SupplyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SupplyCreatePayload) => Promise<void>;
  initial?: Partial<Supply>;
  title: string;
  dynamicCategories: string[];
  startInNewCategory?: boolean;
}

function SupplyFormModal({ isOpen, onClose, onSave, initial, title, dynamicCategories, startInNewCategory = false }: SupplyFormModalProps) {
  const [form, setForm] = useState<SupplyCreatePayload>({
    name: '', category: 'otros', color: '', stock_quantity: 0, sizes: {}, unit: 'unidades', description: '',
  });
  const [categoryMode, setCategoryMode] = useState<'select'|'new'>('select');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initial?.name ?? '',
        category: initial?.category ?? (dynamicCategories[0] || 'otros'),
        color: initial?.color ?? '',
        stock_quantity: initial?.stock_quantity ?? 0,
        sizes: initial?.sizes ?? {},
        unit: initial?.unit ?? 'unidades',
        description: initial?.description ?? '',
      });
      setCategoryMode(startInNewCategory ? 'new' : 'select');
      setSaveError(null);
    }
  }, [isOpen, initial, startInNewCategory]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.name.trim()) { setSaveError('El nombre es obligatorio'); return; }
    if (!form.category.trim()) { setSaveError('La categoría es obligatoria'); return; }
    setLoading(true);
    setSaveError(null);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.message || 'Error al guardar el insumo';
      setSaveError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Rellena los datos del insumo</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 transition-colors">
          
          {/* Row 1: Categoría y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Categoría *</label>
              {categoryMode === 'select' ? (
                <div className="flex gap-2">
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    {dynamicCategories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { setCategoryMode('new'); setForm(p => ({...p, category: ''})); }}
                    className="px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex-shrink-0">
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} autoFocus
                    className="flex-1 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-400 dark:border-blue-600 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Escribe la nueva categoría..." />
                  <button type="button" onClick={() => { setCategoryMode('select'); setForm(p => ({...p, category: dynamicCategories[0] || 'otros'})); }}
                    className="px-3 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex-shrink-0 text-sm font-bold">
                    ↩
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Nombre *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Cuero bovino negro" />
            </div>
          </div>

          {/* Row 2: Color y Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Color</label>
              <input value={form.color ?? ''} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Negro, Blanco..." />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Unidad</label>
              <select value={form.unit || 'unidades'} 
                onChange={e => {
                  const val = e.target.value;
                  setForm(p => ({ ...p, unit: val, sizes: val === 'tallas' ? {} : undefined, stock_quantity: 0 }));
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="unidades">Unidades</option>
                <option value="pares">Pares</option>
                <option value="metros">Metros</option>
                <option value="tallas">Tallas</option>
              </select>
            </div>
          </div>

          {/* Row 3: Configuración de Stock */}
          {form.unit === 'tallas' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Stock Inicial (Por Talla)</label>
                 <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">Total: {form.stock_quantity} pares</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 max-h-56 overflow-y-auto">
                 {Array.from({ length: 23 }, (_, i) => String(i + 21)).map(talla => {
                    const qty = form.sizes?.[talla] || 0;
                    return (
                      <div key={talla} className={`p-2 rounded-xl border text-center transition-all ${qty > 0 ? 'bg-blue-500 border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
                        <label className={`block text-[10px] font-bold mb-1 ${qty > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>#{talla}</label>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setForm(p => {
                               const dict = { ...(p.sizes || {}) };
                               if (val > 0) dict[talla] = val;
                               else delete dict[talla];
                               return { ...p, sizes: dict, stock_quantity: Object.values(dict).reduce((acc, v) => acc + v, 0) };
                            });
                          }}
                          className={`w-full bg-transparent text-center font-bold text-sm outline-none ${qty > 0 ? 'text-white placeholder-blue-300' : 'text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600'}`}
                          placeholder="0"
                        />
                      </div>
                    );
                 })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Stock Inicial ({form.unit})</label>
              <input 
                type="number" 
                min={0} 
                step="any" 
                value={form.stock_quantity === 0 ? '' : form.stock_quantity} 
                onChange={e => {
                  const val = e.target.value === '' ? 0 : (form.unit === 'metros' ? parseFloat(e.target.value) : parseInt(e.target.value));
                  setForm(p => ({ ...p, stock_quantity: isNaN(val) ? 0 : val }));
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Descripción</label>
            <textarea rows={2} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="Descripción opcional del insumo..." />
          </div>
          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {saveError}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 gap-3">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || !form.name.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98] btn-pulse">
            {loading ? 'Guardando...' : 'Guardar Insumo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponente: Modal Crear Categoría ────────────────────
interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}

function CreateCategoryModal({ isOpen, onClose, onCreated }: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) { setName(''); setError(null); } }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre de la categoría es obligatorio'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/supplies/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.detail || 'Error al crear la categoría');
      }
      const cat = await res.json();
      onCreated(cat.name);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Categoría</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Crea un nuevo tipo de insumo</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Nombre de la Categoría *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ej: montaje, acabado..." />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98]">
            {loading ? 'Creando...' : 'Crear Categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponente: Modal Vincular Productos ────────────────
interface LinkProductModalProps {
  isOpen: boolean;
  supply: Supply | null;
  onClose: () => void;
  onRefresh: () => void;
}

function LinkProductModal({ isOpen, supply, onClose, onRefresh }: LinkProductModalProps) {
  const [products, setProducts] = useState<{ id: string; name: string; image_url?: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    getProducts().then((p: Array<{ id: string; name: string; image_url?: string }>) => setProducts(p)).catch(console.error);
  }, [isOpen]);

  if (!isOpen || !supply) return null;

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleLink = async () => {
    if (!selectedProductId) return;
    setLoading(true);
    try {
      let finalQty: number;
      if (supply?.category?.toLowerCase() === 'suelas') {
        finalQty = 1;
      } else {
        const raw = qty === '' ? 0 : parseFloat(qty);
        finalQty = raw / 12;
      }
      await linkSupplyToProduct(selectedProductId, supply!.id, finalQty);
      onRefresh();
      setSelectedProductId('');
      setQty('');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUnlink = async (productId: string) => {
    try {
      await unlinkSupplyFromProduct(productId, supply.id);
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vincular Productos</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Insumo: <span className="font-bold text-blue-600 dark:text-blue-400">{supply.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Vinculados actualmente */}
          {supply.linked_products.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Productos vinculados</p>
              <div className="space-y-2">
                {supply.linked_products.map(lp => (
                  <div key={lp.product_id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{lp.product_name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{lp.quantity_required} {supply.unit ?? 'unidad(es)'} requerida(s)</p>
                    </div>
                    <button onClick={() => handleUnlink(lp.product_id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vincular nuevo producto */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Vincular nuevo producto</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Buscar producto..." />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-4">
              {filtered.map(p => (
                <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedProductId === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}>
                  {p.name}
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  {supply?.category?.toLowerCase() === 'suelas'
                    ? 'Suela — asignación automática'
                    : 'Cantidad requerida por docena (12 pares)'}
                </label>
                {supply?.category?.toLowerCase() !== 'suelas' && (
                  <input type="number" min={0} step={0.01} placeholder="Ej: 1.50" value={qty}
                    onChange={e => setQty(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                )}
              </div>
              <button onClick={handleLink} disabled={!selectedProductId || loading}
                className="mt-5 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                <Link size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl font-bold text-sm transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────
export default function InsumosPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editTarget, setEditTarget] = useState<Supply | null>(null);
  const [linkTarget, setLinkTarget] = useState<Supply | null>(null);
  const [startNewCategory, setStartNewCategory] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/supplies/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data: { id: string; name: string; color: string }[] = await res.json();
        setCategories(data);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchSupplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSupplies(activeCategory === 'all' ? undefined : activeCategory);
      setSupplies(res.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchSupplies(); }, [fetchSupplies]);

  const filtered = supplies.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (data: SupplyCreatePayload) => {
    await createSupply(data);
    await fetchSupplies();
  };

  const handleUpdate = async (data: SupplyCreatePayload) => {
    if (!editTarget) return;
    await updateSupply(editTarget.id, data);
    await fetchSupplies();
  };

  const handleDelete = async (id: string) => {
    await deleteSupply(id);
    setDeleteId(null);
    await fetchSupplies();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setDeleteCatId(null);
    setActiveCategory('all');
    await fetchCategories();
    await fetchSupplies();
  };

  const handleLinkRefresh = async () => {
    await fetchSupplies();
    // Actualizar el supply del modal de vinculación
    if (linkTarget) {
      const res = await listSupplies();
      const updated = res.items.find(s => s.id === linkTarget.id);
      if (updated) setLinkTarget(updated);
    }
  };

  const allCategories = Array.from(new Set([
    ...categories.map(c => c.name),
    ...supplies.map(s => s.category),
  ])).sort();
  const sortedCategoryObjects = allCategories.map(name => {
    const found = categories.find(c => c.name === name);
    return { id: found?.id ?? name, name, color: found?.color ?? 'gray' };
  });
  const sortedCategories = sortedCategoryObjects.map(c => c.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Package2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Gestión de Insumos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">Materiales de fabricación por proceso</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setStartNewCategory(false); setShowForm(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 btn-pulse"
        >
          <Plus size={18} />
          Nuevo Insumo
        </button>
      </div>

      {/* Tabs de categoría */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeCategory === 'all'
              ? 'ring-2 ring-blue-500 ' + getCategoryColor('all')
              : getCategoryColor('all') + ' opacity-60 hover:opacity-100'
          }`}
        >
          Todos
        </button>
        {sortedCategoryObjects.map(cat => (
          <div key={cat.id} className="relative group/cat flex items-center">
            <button
              onClick={() => setActiveCategory(cat.name)}
              className={`pl-4 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeCategory === cat.name
                  ? 'ring-2 ring-blue-500 ' + getCategoryColor(cat.name, cat.color)
                  : getCategoryColor(cat.name, cat.color) + ' opacity-60 hover:opacity-100'
              }`}
            >
              {CATEGORY_LABEL[cat.name] || cat.name}
            </button>
            <button
              onClick={() => setDeleteCatId(cat.id)}
              title="Eliminar categoría"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-red-400 hover:text-red-600 rounded-full opacity-0 group-hover/cat:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowCreateCategory(true)}
          className="ml-2 px-4 py-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 active:scale-95"
        >
          <Plus size={14} /> Categoria
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative w-full sm:max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          placeholder="Buscar insumo..."
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Package2 size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">No hay insumos registrados</p>
            <button onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95">
              Crear primer insumo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Insumo</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Productos vinculados</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filtered.map(supply => (
                  <tr key={supply.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{supply.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {supply.color && (
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {supply.color}
                          </p>
                        )}
                        {supply.description && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{supply.description}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${CATEGORY_BADGE[supply.category] ?? CATEGORY_BADGE.otros}`}>
                        {CATEGORY_LABEL[supply.category] ?? supply.category}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {supply.stock_quantity > 0 ? (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {supply.stock_quantity % 1 === 0 ? supply.stock_quantity : supply.stock_quantity.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{supply.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {supply.linked_products && supply.linked_products.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {supply.linked_products.slice(0, 3).map((prod: any) => (
                              <span key={prod.product_id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold border border-blue-100 dark:border-blue-800/50">
                                {prod.product_name}
                              </span>
                            ))}
                            {supply.linked_products.length > 3 && (
                              <span className="text-[10px] text-gray-400 font-bold">+{supply.linked_products.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic font-medium">Sin vincular</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setLinkTarget(supply); }}
                          title="Vincular a productos"
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                        >
                          <Link size={14} />
                        </button>
                        <button
                          onClick={() => { setEditTarget(supply); setShowForm(true); }}
                          title="Editar insumo"
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(supply.id)}
                          title="Eliminar insumo"
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

      {/* Modal Crear Categoría */}
      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onCreated={(name) => {
          fetchCategories();
          setCategories(prev => [...prev, { id: name, name, color: 'blue' }]);
        }}
      />

      {/* Modal Formulario Insumo */}
      <SupplyFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={editTarget ? handleUpdate : handleCreate}
        initial={editTarget ?? undefined}
        title={editTarget ? 'Editar Insumo' : 'Nuevo Insumo'}
        dynamicCategories={sortedCategories}
        startInNewCategory={startNewCategory && !editTarget}
      />

      {/* Modal Vincular */}
      <LinkProductModal
        isOpen={!!linkTarget}
        supply={linkTarget}
        onClose={() => setLinkTarget(null)}
        onRefresh={handleLinkRefresh}
      />

      {/* Modal Eliminar */}
      {/* Modal Eliminar Categoría */}
      {deleteCatId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Los insumos de esta categoría no serán eliminados, solo la categoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatId(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDeleteCategory(deleteCatId)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Eliminar Insumo */}
      {deleteId && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trash2 size={28} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">¿Eliminar insumo?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8">Esta acción no se puede deshacer y el insumo se eliminará permanentemente.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)}
            className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all active:scale-95">
            Cancelar
          </button>
          <button onClick={() => handleDelete(deleteId!)}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
            Eliminar
          </button>
        </div>
      </div>
    </div>
      )}
    </div>
  );
}
