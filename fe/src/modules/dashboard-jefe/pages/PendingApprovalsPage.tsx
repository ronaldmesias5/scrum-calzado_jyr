import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Package, AlertCircle } from 'lucide-react';
import {
  getPendingIncidences,
  approvePendingIncidence,
  rejectPendingIncidence,
  type PendingProductIncidence,
} from '../services/lossApi';
import { useToast } from '@/context/ToastContext';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const INCIDENT_TYPES = [
  { value: 'perdida', label: 'Pérdida' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'devuelto', label: 'Devuelto' },
];

export default function PendingApprovalsPage() {
  const { showToast } = useToast();
  const [incidences, setIncidences] = useState<PendingProductIncidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});

  const loadIncidences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingIncidences(statusFilter || undefined);
      setIncidences(data.incidences);
    } catch (e) {
      console.error('Error al cargar incidencias pendientes:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadIncidences();
  }, [loadIncidences]);

  const handleApprove = async (id: string) => {
    const incidentType = selectedType[id] || 'perdida';
    setApprovingId(id);
    try {
      await approvePendingIncidence(id, incidentType);
      showToast('Incidencia aprobada correctamente', 'success');
      await loadIncidences();
    } catch (e) {
      console.error('Error al aprobar:', e);
      showToast('Error al aprobar incidencia', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setRejectingId(id);
    try {
      await rejectPendingIncidence(id);
      showToast('Incidencia rechazada', 'success');
      await loadIncidences();
    } catch (e) {
      console.error('Error al rechazar:', e);
      showToast('Error al rechazar incidencia', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 stagger-reveal">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            Aprobaciones de Incidencias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Revisa y aprueba/rechaza incidencias de producto reportadas por empleados
          </p>
        </div>
        <button
          onClick={loadIncidences}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* FILTRO DE ESTADO */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit stagger-reveal">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              statusFilter === status
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="stagger-reveal">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
          </div>
        ) : incidences.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <CheckCircle size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  No hay incidencias {statusFilter === 'pending' ? 'pendientes' : `con estado "${STATUS_LABELS[statusFilter]}"`}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidences.map((inc) => {
              const statusBadge = inc.status === 'pending'
                ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
                : inc.status === 'approved'
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
              const isPending = inc.status === 'pending';
              const isApproving = approvingId === inc.id;
              const isRejecting = rejectingId === inc.id;

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
                      {STATUS_LABELS[inc.status] || inc.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <p>Empleado: {inc.employee_name || '—'}</p>
                    <p>Tarea: {inc.task_type} — Talla: {inc.size}</p>
                    {inc.description && <p>Defecto: {inc.description}</p>}
                    {!inc.description && inc.defect_code && <p>Defecto: {inc.defect_code} — {inc.defect_name}</p>}
                    <p>Cantidad: {inc.quantity}</p>
                  </div>

                  {inc.observations && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                      "{inc.observations}"
                    </p>
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
                          {INCIDENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(inc.id)}
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
                          onClick={() => handleReject(inc.id)}
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
                          Tipo: {INCIDENT_TYPES.find(t => t.value === inc.approved_type)?.label || inc.approved_type}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} />
                      {formatDate(inc.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
