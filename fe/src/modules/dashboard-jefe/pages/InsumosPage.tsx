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

const getCategoryColor = (key: string) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Categoría *</label>
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
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Nombre *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Cuero bovino negro" />
            </div>
          </div>

          {/* Row 2: Color y Unidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Color</label>
              <input value={form.color ?? ''} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Negro, Blanco..." />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Unidad</label>
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
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Stock Inicial (Por Talla)</label>
                 <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">Total: {form.stock_quantity} pares</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 max-h-56 overflow-y-auto">
                 {Array.from({ length: 23 }, (_, i) => String(i + 21)).map(talla => {
                    const qty = form.sizes?.[talla] || 0;
                    return (
                      <div key={talla} className={`p-2 rounded-xl border text-center transition-all ${qty > 0 ? 'bg-blue-500 border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
                        <label className={`block text-[10px] font-black mb-1 ${qty > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>#{talla}</label>
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
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Stock Inicial ({form.unit})</label>
              <input type="number" min={0} step={form.unit === 'metros' ? '0.01' : '1'} 
                value={form.stock_quantity} 
                onChange={e => setForm(p => ({ ...p, stock_quantity: form.unit === 'metros' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Descripción</label>
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

        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || !form.name.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98] btn-pulse">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-slate-800">
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Nombre de la Categoría *</label>
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
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98]">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
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
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Productos vinculados</p>
              <div className="space-y-2">
                {supply.linked_products.map(lp => (
                  <div key={lp.product_id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-slate-700">
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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Vincular nuevo producto</p>
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                  {supply?.category?.toLowerCase() === 'suelas'
                    ? 'Suela — asignación automática'
                    : 'Cantidad requerida por docena'}
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
          <button onClick={onClose} className="w-full py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-2xl font-bold text-sm transition-all">
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
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
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
        const data: { id: string; name: string }[] = await res.json();
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
    ...supplies.map(s => s.category.toLowerCase()),
  ])).sort();
  const sortedCategoryObjects = allCategories.map(name => {
    const found = categories.find(c => c.name === name);
    return { id: found?.id ?? name, name };
  });
  const sortedCategories = sortedCategoryObjects.map(c => c.name);

  return (
    <div className="p-6 space-y-6 min-h-full bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Package2 size={22} className="text-white" />
            </div>
            Gestión de Insumos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-14">Materiales de fabricación por proceso</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setStartNewCategory(false); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 btn-pulse"
        >
          <Plus size={16} />
          Nuevo Insumo
        </button>
      </div>

      {/* Tabs de categoría */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
              className={`pl-4 pr-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === cat.name
                  ? 'ring-2 ring-blue-500 ' + getCategoryColor(cat.name)
                  : getCategoryColor(cat.name) + ' opacity-60 hover:opacity-100'
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
          className="ml-2 px-4 py-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 active:scale-95"
        >
          <Plus size={14} /> Categoria
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          placeholder="Buscar insumo..."
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
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
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Insumo</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Categoría</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Stock</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Productos vinculados</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filtered.map(supply => (
                  <tr key={supply.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{supply.name}</p>
                      {supply.color && (
                        <p className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white" style={{ backgroundColor: supply.color.toLowerCase() }} />
                          {supply.color}
                        </p>
                      )}
                      {supply.description && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{supply.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${CATEGORY_BADGE[supply.category] ?? CATEGORY_BADGE.otros}`}>
                        {CATEGORY_LABEL[supply.category] ?? supply.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {supply.stock_quantity > 0 ? (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                        <span className={`font-black text-lg ${supply.stock_quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {supply.stock_quantity}
                        </span>
                        <span className="text-[10px] text-gray-400">{supply.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {supply.linked_products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {supply.linked_products.slice(0, 2).map(lp => (
                            <span key={lp.product_id} className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-2 py-0.5 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                              {lp.product_name.split(' ').slice(0, 2).join(' ')}
                            </span>
                          ))}
                          {supply.linked_products.length > 2 && (
                            <span className="text-[10px] text-gray-400 font-bold self-center">+{supply.linked_products.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Sin vincular</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setLinkTarget(supply); }}
                          title="Vincular a productos"
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Link size={15} />
                        </button>
                        <button
                          onClick={() => { setEditTarget(supply); setShowForm(true); }}
                          title="Editar insumo"
                          className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(supply.id)}
                          title="Eliminar insumo"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={15} />
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
          setCategories(prev => [...prev, { id: name, name }]);
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Los insumos de esta categoría no serán eliminados, solo la categoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatId(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDeleteCategory(deleteCatId)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Eliminar Insumo */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Eliminar insumo?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId!)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
