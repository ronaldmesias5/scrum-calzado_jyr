import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, RefreshCw,
  Wrench, Plus, Box, Package, AlertCircle,
} from 'lucide-react';
import {
  getGeneralIncidences,
  createGeneralIncidence,
  getProductIncidences,
  createProductIncidence,
  getEmployeeTasks,
  getTaskVale,
} from '../services/employeeApi';
import type {
  GeneralIncidence,
  GeneralIncidenceCreateRequest,
  ProductIncidence,
  EmployeeTask,
  ValeResponse,
} from '../types/employee';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';

export default function EmployeeIncidencesPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'maquinaria' | 'insumo' | 'producto'>('maquinaria');
  const [generalIncidences, setGeneralIncidences] = useState<GeneralIncidence[]>([]);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<'maquinaria' | 'insumo'>('maquinaria');
  const [newMachineryName, setNewMachineryName] = useState('');
  const [newSupplyId, setNewSupplyId] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [supplyInputMode, setSupplyInputMode] = useState<'select' | 'type'>('select');
  const [newCustomSupplyName, setNewCustomSupplyName] = useState('');
  const [supplies, setSupplies] = useState<{ id: string; name_supplies: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [productIncidences, setProductIncidences] = useState<ProductIncidence[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productTasks, setProductTasks] = useState<EmployeeTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [valeAmountMap, setValeAmountMap] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');
  const [productQuantity, setProductQuantity] = useState<number | ''>(1);
  const [productObservations, setProductObservations] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  const loadGeneralIncidences = useCallback(async () => {
    setGeneralLoading(true);
    try { const data = await getGeneralIncidences(); setGeneralIncidences(data.incidences); }
    catch (e) { console.error('Error al cargar incidencias generales:', e); }
    finally { setGeneralLoading(false); }
  }, []);

  const loadProductIncidences = useCallback(async () => {
    setProductLoading(true);
    try { const data = await getProductIncidences(); setProductIncidences(data.incidences); }
    catch (e) { console.error('Error al cargar incidencias de producto:', e); }
    finally { setProductLoading(false); }
  }, []);

  useEffect(() => { loadGeneralIncidences(); }, [loadGeneralIncidences]);
  useEffect(() => { if (activeTab === 'producto') loadProductIncidences(); }, [activeTab, loadProductIncidences]);

  const loadProductTasks = useCallback(async () => {
    try {
      const data = await getEmployeeTasks();
      setProductTasks(data.tasks.filter((t) => t.status !== 'cancelado' && t.product_id && t.product_name));
    } catch (e) { console.error('Error al cargar tareas:', e); setProductTasks([]); }
  }, []);

  const loadTaskSizes = useCallback(async (taskId: string) => {
    try {
      const vale: ValeResponse = await getTaskVale(taskId);
      setValeAmountMap(Object.fromEntries(vale.details.map((d) => [d.size, d.amount])));
    } catch (e) { console.error('Error al cargar tallas:', e); setValeAmountMap({}); }
  }, []);

  const handleOpenProductModal = async () => {
    setShowProductModal(true);
    setSelectedTaskId(''); setSelectedSize(''); setValeAmountMap({});
    setDescription(''); setProductQuantity(1); setProductObservations('');
    await loadProductTasks();
  };

  const handleTaskSelect = async (taskId: string) => {
    setSelectedTaskId(taskId); setSelectedSize('');
    if (taskId) await loadTaskSizes(taskId); else setValeAmountMap({});
  };

  const handleCreateProductIncidence = async () => {
    if (!selectedTaskId || !selectedSize || !description.trim() || !productQuantity || productQuantity <= 0) return;
    setCreatingProduct(true);
    try {
      await createProductIncidence({ task_id: selectedTaskId, size: selectedSize, description: description.trim(), quantity: productQuantity || 1, observations: productObservations || undefined });
      setShowProductModal(false);
      showToast('Incidencia de producto registrada correctamente', 'success');
      await loadProductIncidences();
    } catch (e) { console.error('Error al crear incidencia de producto:', e); showToast('Error al crear incidencia de producto', 'error'); }
    finally { setCreatingProduct(false); }
  };

  const handleOpenCreateModal = async (category: 'maquinaria' | 'insumo') => {
    setModalCategory(category);
    setShowCreateModal(true);
    setNewMachineryName('');
    setNewSupplyId('');
    setNewObservations('');
    setSupplyInputMode('select');
    setNewCustomSupplyName('');
    if (category === 'insumo') {
      try { const res = await api.get('/api/v1/supplies'); setSupplies(Array.isArray(res.data?.items) ? res.data.items : []); }
      catch (e) { console.error('Error al cargar insumos:', e); setSupplies([]); }
    }
  };

  const handleCreateGeneralIncidence = async () => {
    if (modalCategory === 'maquinaria' && !newMachineryName.trim()) return;
    if (modalCategory === 'insumo' && supplyInputMode === 'select' && !newSupplyId) return;
    if (modalCategory === 'insumo' && supplyInputMode === 'type' && !newCustomSupplyName.trim()) return;
    setCreating(true);
    try {
      const payload: GeneralIncidenceCreateRequest = { incidence_category: modalCategory, observations: newObservations || undefined };
      if (modalCategory === 'maquinaria') payload.machinery_name = newMachineryName.trim();
      else { if (supplyInputMode === 'select') payload.supply_id = newSupplyId; else payload.custom_supply_name = newCustomSupplyName.trim(); }
      await createGeneralIncidence(payload);
      setShowCreateModal(false);
      showToast('Incidencia registrada correctamente', 'success');
      await loadGeneralIncidences();
    } catch (e) { console.error('Error al crear incidencia general:', e); showToast('Error al crear incidencia', 'error'); }
    finally { setCreating(false); }
  };

  const handleRefresh = () => {
    if (activeTab === 'producto') loadProductIncidences();
    else loadGeneralIncidences();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const maquinariaItems = generalIncidences.filter((inc) => inc.incidence_category === 'maquinaria');
  const insumoItems = generalIncidences.filter((inc) => inc.incidence_category === 'insumo');

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 stagger-reveal">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" /> Incidencias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">Reportes e incidencias de producción</p>
        </div>
        <button onClick={handleRefresh} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit stagger-reveal">
        <button key="maquinaria" onClick={() => setActiveTab('maquinaria')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'maquinaria' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'}`}>
          Maquinaria
        </button>
        <button key="insumo" onClick={() => setActiveTab('insumo')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'insumo' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'}`}>
          Insumos
        </button>
        <button key="producto" onClick={() => setActiveTab('producto')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'producto' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'}`}>
          Producto
        </button>
      </div>

      {/* ── TAB: MAQUINARIA ── */}
      {activeTab === 'maquinaria' && (
        <>
          <div className="flex items-center justify-between stagger-reveal">
            <p className="text-sm text-gray-500 dark:text-gray-400">{!generalLoading && `${maquinariaItems.length} incidencia(s) de maquinaria`}</p>
            <button onClick={() => handleOpenCreateModal('maquinaria')} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 dark:bg-orange-500 text-white rounded-xl hover:bg-orange-700 dark:hover:bg-orange-600 transition-all text-sm font-bold shadow-sm active:scale-95"><Plus size={18} /> Registrar Maquinaria</button>
          </div>
          <div className="stagger-reveal">
            {generalLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p></div>
            ) : maquinariaItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300"><div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4"><div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"><Wrench size={28} className="text-gray-300 dark:text-gray-600" /></div><div><p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias de maquinaria</p><p className="text-gray-500 dark:text-gray-400 mt-1">No hay incidencias de maquinaria registradas.</p></div></div></div>
            ) : (
              <IncidenceCardGrid items={maquinariaItems} formatDate={formatDate} />
            )}
          </div>
        </>
      )}

      {/* ── TAB: INSUMOS ── */}
      {activeTab === 'insumo' && (
        <>
          <div className="flex items-center justify-between stagger-reveal">
            <p className="text-sm text-gray-500 dark:text-gray-400">{!generalLoading && `${insumoItems.length} incidencia(s) de insumo`}</p>
            <button onClick={() => handleOpenCreateModal('insumo')} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all text-sm font-bold shadow-sm active:scale-95"><Plus size={18} /> Registrar Insumo</button>
          </div>
          <div className="stagger-reveal">
            {generalLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p></div>
            ) : insumoItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300"><div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4"><div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"><Box size={28} className="text-gray-300 dark:text-gray-600" /></div><div><p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias de insumo</p><p className="text-gray-500 dark:text-gray-400 mt-1">No hay incidencias de insumos registradas.</p></div></div></div>
            ) : (
              <IncidenceCardGrid items={insumoItems} formatDate={formatDate} />
            )}
          </div>
        </>
      )}

      {/* ── TAB: PRODUCTO ── */}
      {activeTab === 'producto' && (
        <>
          <div className="flex items-center justify-between stagger-reveal">
            <p className="text-sm text-gray-500 dark:text-gray-400">{!productLoading && `${productIncidences.length} incidencia(s) de producto`}</p>
            <button onClick={handleOpenProductModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all text-sm font-bold shadow-sm active:scale-95"><Plus size={18} /> Registrar Incidencia</button>
          </div>
          <div className="stagger-reveal">
            {productLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p></div>
            ) : productIncidences.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300"><div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4"><div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"><Package size={28} className="text-gray-300 dark:text-gray-600" /></div><div><p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias de producto</p><p className="text-gray-500 dark:text-gray-400 mt-1">No hay incidencias de producto registradas.</p></div></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productIncidences.map((inc) => {
                  const statusBadge = inc.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50' : inc.status === 'approved' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
                  const statusLabel = inc.status === 'pending' ? 'Pendiente' : inc.status === 'approved' ? 'Aprobada' : 'Rechazada';
                  return (
                    <div key={inc.id} className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2"><Package className="w-5 h-5 text-purple-600 dark:text-purple-400" /><span className="font-bold text-gray-900 dark:text-white">{inc.product_name || 'Producto'}</span></div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusBadge}`}>{statusLabel}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                        <p>Tarea: {inc.task_type} — Talla: {inc.size}</p>
                        {inc.description && <p>Defecto: {inc.description}</p>}
                        {!inc.description && inc.defect_code && <p>Defecto: {inc.defect_code} — {inc.defect_name}</p>}
                        <p>Cantidad: {inc.quantity}</p>
                      </div>
                      {inc.observations && (<p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{inc.observations}</p>)}
                      {inc.status === 'approved' && inc.approved_type && (<p className="text-xs text-green-600 dark:text-green-400 mb-2">Tipo: {inc.approved_type}</p>)}
                      {inc.reviewed_by_name && (<p className="text-xs text-gray-500 dark:text-gray-400">{inc.status === 'approved' ? 'Aprobado' : 'Rechazado'} por {inc.reviewed_by_name}{inc.reviewed_at && ` — ${formatDate(inc.reviewed_at)}`}</p>)}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2"><span className="flex items-center gap-1"><AlertCircle size={12} />{formatDate(inc.created_at)}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL: GENERAL INCIDENCE (Maquinaria / Insumo) ── */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {modalCategory === 'maquinaria' ? 'Registrar Incidencia de Maquinaria' : 'Registrar Incidencia de Insumo'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><span className="text-xl">&times;</span></button>
            </div>

            {modalCategory === 'maquinaria' ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la Máquina <span className="text-red-500">*</span></label>
                  <input type="text" value={newMachineryName} onChange={(e) => setNewMachineryName(e.target.value)} placeholder="Ej: Cortadora, Selladora..." className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                  <textarea value={newObservations} onChange={(e) => setNewObservations(e.target.value)} placeholder="Describe la falla de la máquina..." rows={3} maxLength={500} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none" />
                  <span className="text-[10px] text-gray-400 text-right block mt-0.5">{newObservations.length}/500</span>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Insumo <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => { setSupplyInputMode('select'); setNewCustomSupplyName(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${supplyInputMode === 'select' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Seleccionar</button>
                    <button type="button" onClick={() => { setSupplyInputMode('type'); setNewSupplyId(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${supplyInputMode === 'type' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Escribir</button>
                  </div>
                  {supplyInputMode === 'select' ? (
                    <select value={newSupplyId} onChange={(e) => setNewSupplyId(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"><option value="">Seleccionar insumo...</option>{supplies.map((s) => (<option key={s.id} value={s.id}>{s.name_supplies}</option>))}</select>
                  ) : (
                    <input type="text" value={newCustomSupplyName} onChange={(e) => setNewCustomSupplyName(e.target.value)} placeholder="Nombre del insumo" className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                  <textarea value={newObservations} onChange={(e) => setNewObservations(e.target.value)} placeholder="Describe la falla del insumo..." rows={3} maxLength={500} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none" />
                  <span className="text-[10px] text-gray-400 text-right block mt-0.5">{newObservations.length}/500</span>
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleCreateGeneralIncidence} disabled={creating || (modalCategory === 'maquinaria' && !newMachineryName.trim()) || (modalCategory === 'insumo' && supplyInputMode === 'select' && !newSupplyId) || (modalCategory === 'insumo' && supplyInputMode === 'type' && !newCustomSupplyName.trim())} className={`px-4 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2 ${modalCategory === 'maquinaria' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {creating ? (<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />) : (<Plus size={16} />)} Registrar
              </button>
            </div>
          </div>
        </div>,
      document.body
    )}

      {/* ── MODAL: PRODUCT INCIDENCE ── */}
      {showProductModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setShowProductModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Registrar Incidencia de Producto</h3><button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><span className="text-xl">&times;</span></button></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarea <span className="text-red-500">*</span></label><select value={selectedTaskId} onChange={(e) => handleTaskSelect(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"><option value="">Seleccionar tarea...</option>{productTasks.map((t) => (<option key={t.id} value={t.id}>Vale #{t.vale_number ?? '?'} — {t.product_name} — {t.type} (x{t.amount})</option>))}</select></div>
            {selectedTaskId && (<div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Talla <span className="text-red-500">*</span></label><select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"><option value="">Seleccionar talla...</option>{Object.keys(valeAmountMap).map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>)}
            {selectedSize && (<div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad <span className="text-red-500">*</span></label><input type="number" min="0" max={valeAmountMap[selectedSize] ?? 1} value={productQuantity} onChange={(e) => { const cleaned = e.target.value.replace(/[^0-9]/g, ''); const parsed = parseInt(cleaned, 10); const max = valeAmountMap[selectedSize] ?? 1; if (cleaned === '') { setProductQuantity(''); return; } setProductQuantity(Math.min(Math.max(parsed || 0, 0), max)); }} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />{valeAmountMap[selectedSize] != null && <p className="text-[10px] text-gray-400 mt-1">Máx. {valeAmountMap[selectedSize]} pares</p>}</div>)}
            {productQuantity && productQuantity > 0 && (<div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del defecto <span className="text-red-500">*</span></label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el defecto encontrado (ej: 'despegue de suela', 'costura rota')" rows={3} maxLength={500} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" /><span className="text-[10px] text-gray-400 text-right block mt-0.5">{description.length}/500</span></div>)}
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label><textarea value={productObservations} onChange={(e) => setProductObservations(e.target.value)} placeholder="Describe el problema..." rows={3} maxLength={500} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" /><span className="text-[10px] text-gray-400 text-right block mt-0.5">{productObservations.length}/500</span></div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleCreateProductIncidence} disabled={creatingProduct || !selectedTaskId || !selectedSize || !description.trim() || !productQuantity || productQuantity <= 0} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">{creatingProduct ? (<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />) : (<Plus size={16} />)} Registrar</button>
            </div>
          </div>
        </div>,
      document.body
    )}
    </div>
  );
}

/** Reusable card grid for machinery/supply incidences */
function IncidenceCardGrid({
  items,
  formatDate,
}: {
  items: GeneralIncidence[];
  formatDate: (d: string | null | undefined) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((inc) => {
        const isMaquinaria = inc.incidence_category === 'maquinaria';
        const badgeClass = isMaquinaria
          ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50'
          : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50';
        return (
          <div key={inc.id} className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {isMaquinaria ? (
                  <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                ) : (
                  <Box className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
                <span className="font-bold text-gray-900 dark:text-white capitalize">
                  {isMaquinaria ? inc.machinery_name || 'Maquinaria' : inc.custom_supply_name || inc.supply_name || 'Insumo'}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${badgeClass}`}>
                {isMaquinaria ? 'Maquinaria' : 'Insumo'}
              </span>
            </div>
            {inc.observations && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{inc.observations}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><AlertCircle size={12} />{formatDate(inc.created_at)}</span>
              {inc.registered_by_name && <span>por {inc.registered_by_name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
