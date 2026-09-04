import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useBadgeCounts } from '@/store/BadgeCountsContext';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ClipboardList,
  Package,
  PackageOpen,
  Search,
  RefreshCw,
  Filter,
  Wrench,
  ExternalLink,
  ClipboardCheck,
  AlertCircle,
  Share2,
  Users,
  FileText,
  Eye,
} from 'lucide-react';
import StatCard from '@/features/admin/components/atoms/StatCard';
import LossFormModal from '@/features/admin/components/molecules/LossFormModal';
import {
  getIncidents,
  getScrapStock,
  approveIncident,
  rejectIncident,
  repairIncident,
  solveIncident,
  shareIncident,
  type IncidentRecord,
  type ScrapStockItem,
} from '@/services/lossService';
import {
  getPendingIncidences,
  approvePendingIncidence,
  rejectPendingIncidence,
  type PendingProductIncidence,
} from '@/services/lossApi';
import { useToast } from '@/store/ToastContext';
import { useAuth } from '@/hooks/useAuth';

type TabType = 'losses' | 'scrap' | 'repaired' | 'pending';

// ── Display helpers for incident types ──
const INCIDENT_TYPE_DISPLAY: Record<string, string> = {
  perdida: 'Pérdida',
  en_reparacion: 'En Reparación',
  reparado: 'Reparado',
  devuelto: 'Devuelto',
  falla: 'Falla',
  faltante: 'Faltante',
  solucionado: 'Solucionado',
};

const INCIDENT_TYPE_BADGE: Record<string, string> = {
  perdida: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  en_reparacion: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  reparado: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  devuelto: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  falla: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  faltante: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  solucionado: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
};

// ── Display helpers for incidence categories ──
const CATEGORY_DISPLAY: Record<string, string> = {
  producto: 'Producto',
  maquinaria: 'Maquinaria',
  insumo: 'Insumo',
};

const TruncatedCell = ({ text, maxLength = 50 }: { text: string | null | undefined; maxLength?: number }) => {
  if (!text) return <span className="text-gray-400 text-xs">—</span>;
  const display = text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  return (
    <span className="text-xs text-gray-700 dark:text-gray-300 block max-w-[200px] truncate" title={text}>
      {display}
    </span>
  );
};

const CATEGORY_BADGE: Record<string, string> = {
  producto: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  maquinaria: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  insumo: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function ValeInline({ orderId, productId }: { orderId: string; productId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { getOrderTasks } = await import('@/services/ordersApi');
        const all = await getOrderTasks(orderId);
        const filtered = all.filter((t: any) => !productId || t.product_id === productId);
        if (alive) setTasks(filtered);
      } catch {
        if (alive) setTasks([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, productId]);
  if (loading) return <p className="text-xs text-gray-400 animate-pulse">Cargando producción...</p>;
  if (tasks.length === 0) return <p className="text-xs text-gray-400 italic">Sin producción registrada para este pedido/producto.</p>;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
        <ClipboardList size={12} /> Producción — quién hizo cada proceso
        {tasks[0]?.vale_number && <span className="ml-auto font-mono text-[10px] text-blue-600 dark:text-blue-400">Vale #{tasks[0].vale_number}</span>}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {tasks.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-2">
            <span className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300">{t.type}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[110px] text-right">
              {t.assigned_user_name || 'Sin asignar'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function LossesPage() {
  const navigate = useNavigate();
  const { counts } = useBadgeCounts();
  const { user } = useAuth();
  const canAccess = user?.role_name === 'admin' || user?.occupation === 'jefe';
  const [activeTab, setActiveTab] = useState<TabType>('losses');

  // ── Incidents state ────────────────────
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);

  // ── Scrap stock state ─────────────────
  const [scrapStock, setScrapStock] = useState<ScrapStockItem[]>([]);
  const [scrapLoading, setScrapLoading] = useState(false);

  // ── Filters ───────────────────────────
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // ── Modal ─────────────────────────────
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // ── Repair Modal ──────────────────────
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairIncidentData, setRepairIncidentData] = useState<IncidentRecord | null>(null);
  const [repairDestination, setRepairDestination] = useState('stock');
  const [repairLoading, setRepairLoading] = useState(false);

  // ── Compartir incidencia al cliente ──
  const [shareTarget, setShareTarget] = useState<IncidentRecord | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  const openShareModal = (inc: IncidentRecord) => {
    setShareTarget(inc);
    setShareEmail('');
    setShareMessage('');
  };

  const handleShareSubmit = async () => {
    if (!shareTarget) return;
    if (!shareTarget.order_id && !shareEmail.trim()) {
      showToast('Esta incidencia no tiene pedido vinculado: escribe un correo destino.', 'error');
      return;
    }
    setShareLoading(true);
    try {
      const resp = await shareIncident(shareTarget.id, {
        to_email: shareEmail.trim() || undefined,
        message: shareMessage.trim() || undefined,
      });
      const parts: string[] = [];
      if (resp.shared_internally) parts.push('visible en el dashboard del cliente');
      if (resp.email_sent) parts.push('correo enviado');
      showToast(`Incidencia compartida: ${parts.join(' · ') || resp.detail}`, 'success');
      setShareTarget(null);
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      showToast(
        'Error al compartir: ' + (err.response?.data?.detail || err.message || 'Desconocido'),
        'error',
      );
    } finally {
      setShareLoading(false);
    }
  };

  // ── Repaired Incidents ────────────────
  const [repairedIncidents, setRepairedIncidents] = useState<IncidentRecord[]>([]);
  const [repairedLoading, setRepairedLoading] = useState(false);

  // ── Pending Approvals state ────────────
  const [pendingIncidences, setPendingIncidences] = useState<PendingProductIncidence[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] = useState('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});
  const [rejectModalInc, setRejectModalInc] = useState<PendingProductIncidence | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ── Vale de producción (para ver quién hizo cada proceso) ──
  const [valeModalInc, setValeModalInc] = useState<PendingProductIncidence | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [valeTasks, setValeTasks] = useState<any[]>([]);
  const [valeLoading, setValeLoading] = useState(false);

  const openValeModal = async (inc: PendingProductIncidence) => {
    setValeModalInc(inc);
    setValeTasks([]);
    if (!inc.order_id) return;
    setValeLoading(true);
    try {
      const { getOrderTasks } = await import('@/services/ordersApi');
      const tasks = await getOrderTasks(inc.order_id);
      const filtered = inc.product_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? tasks.filter((t: any) => t.product_id === inc.product_id)
        : tasks;
      setValeTasks(filtered);
    } catch {
      setValeTasks([]);
    } finally {
      setValeLoading(false);
    }
  };

  // ── Toast ─────────────────────────────
  const { showToast } = useToast();

  // ── Load incidents ─────────────────────
  const loadIncidents = async () => {
    setIncidentsLoading(true);
    try {
      const params: {
        incident_type?: string;
        incidence_category?: string;
        product_id?: string;
      } = {};
      if (incidentTypeFilter) params.incident_type = incidentTypeFilter;
      if (categoryFilter) params.incidence_category = categoryFilter;
      if (productFilter) params.product_id = productFilter;
      const result = await getIncidents(params);
      setIncidents(result.items);
    } catch (err) {
      console.error('Error loading incidents:', err);
      showToast('Error al cargar registros de incidencias', 'error');
    } finally {
      setIncidentsLoading(false);
    }
  };

  // ── Load scrap stock ──────────────────
  const loadScrapStock = async () => {
    setScrapLoading(true);
    try {
      const data = await getScrapStock();
      setScrapStock(data);
    } catch (err) {
      console.error('Error loading scrap stock:', err);
      showToast('Error al cargar stock de recuperables', 'error');
    } finally {
      setScrapLoading(false);
    }
  };

  // ── Load repaired incidents ───────────
  const loadRepaired = async () => {
    setRepairedLoading(true);
    try {
      const data = await getIncidents({ incident_type: 'reparado', limit: 100 });
      setRepairedIncidents(data.items);
    } catch (err) {
      console.error('Error loading repaired incidents:', err);
    } finally {
      setRepairedLoading(false);
    }
  };

  // ── Load pending incidences ───────────
  const loadPendingIncidences = useCallback(async () => {
    setPendingLoading(true);
    try {
      const data = await getPendingIncidences(pendingStatusFilter || undefined);
      setPendingIncidences(data.incidences);
    } catch (e) {
      console.error('Error al cargar incidencias pendientes:', e);
    } finally {
      setPendingLoading(false);
    }
  }, [pendingStatusFilter]);

  const handleApprovePending = async (id: string) => {
    const incidentType = selectedType[id] || 'perdida';
    setApprovingId(id);
    try {
      await approvePendingIncidence(id, incidentType);
      await loadPendingIncidences();
      showToast('Incidencia aprobada exitosamente');
    } catch (e) {
      console.error('Error al aprobar:', e);
      showToast('Error al aprobar la incidencia', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectPending = async (id: string, reason?: string) => {
    setRejectingId(id);
    try {
      await rejectPendingIncidence(id, reason);
      await loadPendingIncidences();
      showToast('Incidencia rechazada exitosamente');
    } catch (e) {
      console.error('Error al rechazar:', e);
      showToast('Error al rechazar la incidencia', 'error');
    } finally {
      setRejectingId(null);
      setRejectModalInc(null);
      setRejectionReason('');
    }
  };

  // Load data when tab or filters change
  useEffect(() => {
    if (!canAccess) return;
    if (activeTab === 'losses') {
      loadIncidents();
    } else if (activeTab === 'repaired') {
      loadRepaired();
    } else if (activeTab === 'pending') {
      loadPendingIncidences();
    } else {
      loadScrapStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, activeTab, incidentTypeFilter, categoryFilter, pendingStatusFilter]);

  // ── Stats ─────────────────────────────
  const totalQuantity = Math.round(incidents.reduce((sum, inc) => sum + (Number(inc.quantity) || 0), 0));
  const totalPerdida = Math.round(incidents
    .filter(inc => inc.incident_type === 'perdida')
    .reduce((sum, inc) => sum + (Number(inc.quantity) || 0), 0));
  const totalReparado = Math.round(incidents
    .filter(inc => inc.incident_type === 'reparado')
    .reduce((sum, inc) => sum + (Number(inc.quantity) || 0), 0));
  const totalDevuelto = Math.round(incidents
    .filter(inc => inc.incident_type === 'devuelto')
    .reduce((sum, inc) => sum + (Number(inc.quantity) || 0), 0));

  // ── Actions ───────────────────────────
  const handleApprove = async (id: string) => {
    try {
      await approveIncident(id);
      showToast('Incidencia aprobada exitosamente');
      loadIncidents();
    } catch (err) {
      console.error('Error approving incident:', err);
      showToast('Error al aprobar la incidencia', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectIncident(id);
      showToast('Incidencia rechazada exitosamente');
      loadIncidents();
    } catch (err) {
      console.error('Error rejecting incident:', err);
      showToast('Error al rechazar la incidencia', 'error');
    }
  };

  const handleSolve = async (id: string) => {
    try {
      await solveIncident(id);
      showToast('Incidencia solucionada exitosamente');
      loadIncidents();
    } catch (err) {
      console.error('Error solving incident:', err);
      showToast('Error al solucionar la incidencia', 'error');
    }
  };

  const handleRepairClick = (incident: IncidentRecord) => {
    setRepairIncidentData(incident);
    setRepairDestination('stock');
    setIsRepairModalOpen(true);
  };

  const handleRepairConfirm = async () => {
    if (!repairIncidentData) return;
    setRepairLoading(true);
    try {
      await repairIncident(repairIncidentData.id, repairDestination);
      showToast('Incidencia reparada exitosamente');
      setIsRepairModalOpen(false);
      setRepairIncidentData(null);
      loadIncidents();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      showToast(e.response?.data?.detail || 'Error al reparar incidencia', 'error');
    } finally {
      setRepairLoading(false);
    }
  };

  // ── Format date ───────────────────────
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Solo los administradores y jefes pueden acceder a la sección de incidencias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──────── Header ──────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            Incidencias de Calzado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control y registro de incidencias en producción
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all font-bold shadow-lg hover:shadow-red-500/20 active:scale-95"
          >
            <AlertTriangle size={18} />
            Registrar Incidencia
          </button>
          <button
            onClick={activeTab === 'losses' ? loadIncidents : loadScrapStock}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ──────── Tabs ──────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('losses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'losses'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList size={16} />
          Registro de Incidencias
        </button>
        <button
          onClick={() => setActiveTab('scrap')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'scrap'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <PackageOpen size={16} />
          Stock de Recuperables
        </button>
        <button
          onClick={() => setActiveTab('repaired')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'repaired'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Wrench size={16} />
          Historial de Reparados
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ClipboardCheck size={16} />
          Pendientes de Aprobación
          {counts.incidencias > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center shadow-sm shadow-red-500/50">
              {counts.incidencias}
            </span>
          )}
        </button>
      </div>

      {/* ──────── Stats (solo tab incidencias) ──────── */}
      {activeTab === 'losses' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Pares"
            value={totalQuantity}
            icon={<AlertTriangle size={24} />}
            color="blue"
          />
          <StatCard
            label="Perdidos(as)"
            value={totalPerdida}
            icon={<Filter size={24} />}
            color="red"
          />
          <StatCard
            label="Reparados"
            value={totalReparado}
            icon={<CheckCircle size={24} />}
            color="green"
          />
          <StatCard
            label="Devueltos"
            value={totalDevuelto}
            icon={<XCircle size={24} />}
            color="orange"
          />
        </div>
      )}

      {/* ──────── Tab: Registro de Incidencias ──────── */}
      {activeTab === 'losses' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Tipo
                </label>
                <select
                  value={incidentTypeFilter}
                  onChange={e => setIncidentTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="">Todos</option>
                  <option value="perdida">Pérdida</option>
                  <option value="en_reparacion">En Reparación</option>
                  <option value="reparado">Reparado</option>
                  <option value="devuelto">Devuelto</option>
                  <option value="solucionado">Solucionado</option>
                  <option value="falla">Falla</option>
                  <option value="faltante">Faltante</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="">Todas</option>
                  <option value="producto">Producto</option>
                  <option value="maquinaria">Maquinaria</option>
                  <option value="insumo">Insumo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Producto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={productFilter}
                    onChange={e => setProductFilter(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-56"
                  />
                </div>
              </div>
              {(incidentTypeFilter || categoryFilter || productFilter) && (
                <button
                  onClick={() => {
                    setIncidentTypeFilter('');
                    setCategoryFilter('');
                    setProductFilter('');
                  }}
                  className="px-4 py-2 text-xs border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-gray-700 dark:text-gray-300"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {incidentsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando incidencias...</p>
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <ClipboardList size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">
                    No hay registros de incidencias
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {incidentTypeFilter || categoryFilter || productFilter
                      ? 'Prueba ajustando los filtros de búsqueda'
                      : 'Registra la primera incidencia usando el botón "Registrar Incidencia"'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Referencia
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Talla
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Observación
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Registró
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {incidents.map(inc => (
                      <tr
                        key={inc.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(inc.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              CATEGORY_BADGE[inc.incidence_category] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {CATEGORY_DISPLAY[inc.incidence_category] ?? inc.incidence_category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {inc.incidence_category === 'producto'
                            ? inc.product?.name_product ?? '—'
                            : inc.incidence_category === 'maquinaria'
                            ? inc.machinery_name ?? '—'
                            : inc.incidence_category === 'insumo'
                            ? inc.custom_supply_name || inc.supply?.name_supplies || '—'
                            : inc.product?.name_product ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-bold">
                          {inc.size ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-red-600 dark:text-red-400">
                          {Math.round(Number(inc.quantity) || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              INCIDENT_TYPE_BADGE[inc.incident_type] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {INCIDENT_TYPE_DISPLAY[inc.incident_type] ?? inc.incident_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <TruncatedCell text={inc.description} />
                        </td>
                        <td className="px-4 py-3">
                          <TruncatedCell text={inc.observations} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {inc.registered_by
                              ? `${inc.registered_by.name_user} ${inc.registered_by.last_name}`
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {inc.order_id ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/admin/orders?order=${inc.order_id}`)}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold"
                            >
                              <ExternalLink size={12} />
                              Ver pedido
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openShareModal(inc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs font-bold mr-1"
                            title="Compartir al cliente y/o correo"
                          >
                            <Share2 size={14} />
                          </button>
                          {(inc.incident_type === 'en_reparacion' || inc.incident_type === 'devuelto') && (
                            <button
                              onClick={() => handleRepairClick(inc)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all text-xs font-bold"
                              title="Reparar incidencia"
                            >
                              <Wrench size={14} />
                              Reparar
                            </button>
                          )}
                          {inc.incident_type === 'perdida' && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleApprove(inc.id)}
                                className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                                title="Aprobar"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(inc.id)}
                                className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                                title="Rechazar"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                          {(inc.incident_type === 'falla' || inc.incident_type === 'faltante') && (
                            <button
                              onClick={() => handleSolve(inc.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-all text-xs font-bold"
                              title="Solucionar incidencia"
                            >
                              <CheckCircle size={14} />
                              Solucionar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ──────── Tab: Historial de Reparados ──────── */}
      {activeTab === 'repaired' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {repairedLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando historial de reparados...</p>
            </div>
          ) : repairedIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <Wrench size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">No hay reparaciones registradas</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Las incidencias reparadas aparecerán aquí automáticamente
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Talla</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo Original</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registró</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Reparación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {repairedIncidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(inc.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {inc.product?.name_product ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                        {inc.size}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-600 dark:text-green-400">
                        {Math.round(inc.quantity)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inc.incident_type === 'en_reparacion'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {INCIDENT_TYPE_DISPLAY[inc.incident_type] ?? inc.incident_type}
                        </span>
                      </td>
                    <td className="px-4 py-3">
                      <TruncatedCell text={inc.description} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {inc.registered_by
                          ? `${inc.registered_by.name_user} ${inc.registered_by.last_name}`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                        {inc.order_id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/admin/orders?order=${inc.order_id}`)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold"
                          >
                            <ExternalLink size={12} />
                            Ver pedido
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {inc.repaired_at ? formatDate(inc.repaired_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────── Tab: Stock de Recuperables ──────── */}
      {activeTab === 'scrap' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {scrapLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando stock de recuperables...</p>
            </div>
          ) : scrapStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <PackageOpen size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">No hay stock de recuperables</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Las incidencias registradas aparecerán aquí como stock de material recuperable
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Talla
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {scrapStock.map((item, index) => (
                    <tr
                      key={item.id ?? `${item.product_id}-${item.size}-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {item.product_id}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                        {item.size}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-red-600 dark:text-red-400">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <TruncatedCell text={item.description ?? item.defect_code?.code} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────── Tab: Pendientes de Aprobación ──────── */}
      {activeTab === 'pending' && (
        <>
          {/* Status filter */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
            {(['pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setPendingStatusFilter(status)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  pendingStatusFilter === status
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                {status === 'pending' ? 'Pendiente' : status === 'approved' ? 'Aprobada' : 'Rechazada'}
              </button>
            ))}
          </div>

          {/* List */}
          <div>
            {pendingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando incidencias pendientes...</p>
              </div>
            ) : pendingIncidences.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <CheckCircle size={28} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {pendingStatusFilter === 'pending'
                        ? 'No hay incidencias pendientes de aprobación'
                        : pendingStatusFilter === 'approved'
                        ? 'No hay incidencias aprobadas'
                        : 'No hay incidencias rechazadas'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingIncidences.map((inc) => {
                  const statusBadge = inc.status === 'pending'
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
                    : inc.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
                  const isPending = inc.status === 'pending';
                  const isApproving = approvingId === inc.id;
                  const isRejecting = rejectingId === inc.id;
                  const statusLabel = inc.status === 'pending' ? 'Pendiente' : inc.status === 'approved' ? 'Aprobada' : 'Rechazada';

                  return (
                    <div
                      key={inc.id}
                      className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {inc.product_name || 'Producto'}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                        <p className="flex items-center gap-1.5">
                          {inc.customer_name ? <Users size={14} className="text-blue-500"/> : <Package size={14} className="text-purple-500"/>}
                          Reportado por:{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {inc.customer_name
                              ? `Cliente: ${inc.customer_name}`
                              : inc.employee_name
                              ? `Empleado: ${inc.employee_name}`
                              : '—'}
                          </span>
                        </p>
                        {inc.order_id && (
                          <p className="flex items-center gap-2">
                            <FileText size={12} /> Pedido:{" "}
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{inc.order_id.slice(0, 8)}</span>
                            <button
                              type="button"
                              onClick={() => openValeModal(inc)}
                              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <Eye size={10} /> Ver vale de producción
                            </button>
                          </p>
                        )}
                        <p>Tarea: {inc.task_type || '—'} — Talla: {inc.size} {inc.colour ? `· Color: ${inc.colour}` : ''}</p>
                        {inc.description && <p>Defecto: {inc.description}</p>}
                        {!inc.description && inc.defect_code && <p>Defecto: {inc.defect_code} — {inc.defect_name}</p>}
                        <p>Cantidad: {inc.quantity}</p>
                      </div>

                      {/* Producción — quién hizo cada proceso (vale) — bien ubicado en la card */}
                      {inc.order_id && <ValeInline orderId={inc.order_id} productId={inc.product_id} />}

                      {inc.observations && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                          "{inc.observations}"
                        </p>
                      )}

                      {inc.evidence_image_url && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Evidencia:</p>
                          <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${inc.evidence_image_url}`} alt="Evidencia" className="h-40 rounded-xl object-cover border border-gray-200 dark:border-slate-700" />
                        </div>
                      )}

                      {/* Actions for pending */}
                      {isPending && (
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tipo al aprobar:
                            </label>
                            <select
                              value={selectedType[inc.id] || 'perdida'}
                              onChange={(e) => setSelectedType({ ...selectedType, [inc.id]: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="perdida">Pérdida</option>
                              <option value="en_reparacion">En Reparación</option>
                              <option value="devuelto">Devuelto</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprovePending(inc.id)}
                              disabled={isApproving}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all text-sm font-bold"
                            >
                              {isApproving ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                              Aprobar
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalInc(inc);
                                setRejectionReason('');
                              }}
                              disabled={isRejecting}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-bold"
                            >
                              {isRejecting ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <XCircle size={16} />
                              )}
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reviewed info */}
                      {inc.reviewed_by_name && (
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {inc.status === 'approved' ? 'Aprobado' : 'Rechazado'} por {inc.reviewed_by_name}
                            {inc.reviewed_at && ` — ${formatDate(inc.reviewed_at)}`}
                          </p>
                          {inc.approved_type && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Tipo: {inc.approved_type === 'perdida' ? 'Pérdida' : inc.approved_type === 'en_reparacion' ? 'En Reparación' : 'Devuelto'}
                            </p>
                          )}
                          {inc.rejection_reason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Motivo: {inc.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3">
                        <span className="flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formatDate(inc.created_at || '')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ──────── Loss Form Modal ──────── */}
      <LossFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadIncidents();
        }}
      />

      {/* ──────── Repair Modal ──────── */}
      {isRepairModalOpen && repairIncidentData && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setIsRepairModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar Reparación</h3>
              <button onClick={() => setIsRepairModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Producto</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{repairIncidentData.product?.name_product || repairIncidentData.product_id}</p>
              <div className="flex gap-4 mt-2">
                <div><span className="text-xs text-gray-500">Talla:</span> <span className="font-medium">{repairIncidentData.size}</span></div>
                <div><span className="text-xs text-gray-500">Cantidad:</span> <span className="font-medium">{repairIncidentData.quantity}</span></div>
                <div><span className="text-xs text-gray-500">Tipo:</span> <span className="font-medium">{INCIDENT_TYPE_DISPLAY[repairIncidentData.incident_type]}</span></div>
              </div>
            </div>

            {repairIncidentData.incident_type === 'en_reparacion' && repairIncidentData.order_id ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destino de la reparación:</label>
                <select
                  value={repairDestination}
                  onChange={e => setRepairDestination(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="stock">Mandar a inventario stock</option>
                  <option value="reserva">Restaurar al pedido + Reserva (completado)</option>
                </select>
              </div>
            ) : repairIncidentData.incident_type === 'devuelto' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Mandar al inventario?</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRepairDestination('stock')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      repairDestination === 'stock'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Sí, a inventario stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairDestination('customer_return')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      repairDestination === 'customer_return'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    No, devolver al cliente
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destino de la reparación:</label>
                <select
                  value={repairDestination}
                  onChange={e => setRepairDestination(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="stock">Mandar a inventario stock</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setIsRepairModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRepairConfirm}
                disabled={repairLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {repairLoading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Wrench size={16} />
                )}
                Confirmar Reparación
              </button>
            </div>
          </div>
        </div>,
      document.body
    )}

    {/* ──────── Modal: Compartir incidencia al cliente ──────── */}
    {shareTarget &&
      createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Share2 size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compartir incidencia</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">El cliente la verá en su dashboard y/o correo</p>
                </div>
              </div>
              <button onClick={() => setShareTarget(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Cerrar">✕</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{shareTarget.product?.name_product || 'Incidencia'}</p>
              <div className="flex gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {shareTarget.size && <span>Talla: <strong className="text-gray-800 dark:text-gray-200">{shareTarget.size}</strong></span>}
                <span>Cantidad: <strong className="text-gray-800 dark:text-gray-200">{Number(shareTarget.quantity)}</strong></span>
                <span>Tipo: <strong className="text-gray-800 dark:text-gray-200">{INCIDENT_TYPE_DISPLAY[shareTarget.incident_type]}</strong></span>
                {shareTarget.order_id && (
                  <span>Pedido: <strong className="text-blue-600 dark:text-blue-400 font-mono">#{shareTarget.order_id.slice(0, 8)}</strong></span>
                )}
              </div>
            </div>

            {shareTarget.order_id && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20 px-3 py-2.5">
                <CheckCircle size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Se compartirá automáticamente con el cliente de este pedido en su dashboard.
                </p>
              </div>
            )}

            <label className="block mb-4">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Correo destino (opcional)</span>
              <input
                type="email"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder="cliente@correo.com"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              {!shareTarget.order_id && (
                <span className="block mt-1 text-[11px] text-red-500">Obligatorio: esta incidencia no tiene pedido vinculado.</span>
              )}
            </label>

            <label className="block mb-5">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensaje para el cliente (opcional)</span>
              <textarea
                value={shareMessage}
                onChange={e => setShareMessage(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Ej.: Detectamos un defecto en tu pedido, ya estamos gestionando el reemplazo..."
                className="w-full resize-none px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <span className="block mt-1 text-right text-[10px] text-gray-400">{shareMessage.length}/1000</span>
            </label>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShareTarget(null)}
                disabled={shareLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleShareSubmit}
                disabled={shareLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {shareLoading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Share2 size={16} />
                )}
                Compartir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    {/* ──────── Modal: Vale de producción ──────── */}
    {valeModalInc &&
      createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setValeModalInc(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vale de producción</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pedido #{valeModalInc.order_id?.slice(0, 8)} · Producto {valeModalInc.product_name || valeModalInc.product_id.slice(0, 8)}
                </p>
              </div>
              <button onClick={() => setValeModalInc(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full" aria-label="Cerrar">
                ✕
              </button>
            </div>
            {valeLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : valeTasks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Sin tareas de producción para este producto. El pedido puede aún no haber iniciado producción o el vale es del cliente (sin tareas).
              </p>
            ) : (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {valeTasks.map((t: any) => (
                  <div key={t.id} className="flex items-start justify-between rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {t.type}
                        {t.vale_number && <span className="ml-2 font-mono text-xs text-blue-600">Vale #{t.vale_number}</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Estado: {t.status} · Cant: {t.amount}
                      </p>
                      {t.description_task && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{t.description_task}</p>}
                      {t.observation && <p className="text-xs italic text-amber-600 dark:text-amber-400">Obs: {t.observation}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {t.assigned_user_name || (t.assigned_to ? t.assigned_to.slice(0, 8) : 'Sin asignar')}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.assigned_user_occupation || t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => setValeModalInc(null)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reject incidence reason modal */}
      {rejectModalInc && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Rechazar incidencia
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Producto: {rejectModalInc.product_name} — Talla {rejectModalInc.size}
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo del rechazo (opcional):
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Escribe por qué se rechaza esta incidencia..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModalInc(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRejectPending(rejectModalInc.id, rejectionReason || undefined)}
                disabled={rejectingId === rejectModalInc.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-bold"
              >
                {rejectingId === rejectModalInc.id ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <XCircle size={16} />
                )}
                Rechazar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
