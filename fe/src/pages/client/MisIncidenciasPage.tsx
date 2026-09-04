import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MessageSquareWarning, Plus } from 'lucide-react';
import { ReportIncidenceModal } from '@/features/client/components/molecules/ReportIncidenceModal';
import { getMyIncidences, type ClientIncidence } from '@/services/clientApi';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Pendiente',
    color:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
  },
  approved: {
    label: 'Aprobada',
    color:
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  },
  rejected: {
    label: 'Rechazada',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }
};

const DEFAULT_STATUS = {
  label: 'Pendiente',
  color:
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
};

export default function MisIncidenciasPage() {
  const [incidences, setIncidences] = useState<ClientIncidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const loadIncidences = useCallback(async () => {
    try {
      const data = await getMyIncidences();
      setIncidences(data.incidences);
    } catch {
      setIncidences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidences();
  }, [loadIncidences]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            Mis Incidencias
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Reporta productos defectuosos o con problemas de tus pedidos
            entregados
          </p>
        </div>
        <button
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus size={16} /> Reportar incidencia
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incidences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <MessageSquareWarning
                size={28}
                className="text-gray-300 dark:text-gray-600"
              />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              No has reportado incidencias
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
              Si algún producto de un pedido entregado llegó defectuoso,
              repórtalo aquí y el jefe lo revisará.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Producto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pedido
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Talla
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Defecto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Cant.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {incidences.map((inc) => {
                  const status = STATUS_MAP[inc.status] || DEFAULT_STATUS;
                  return (
                    <tr
                      key={inc.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {inc.product_name || 'Producto'}
                        </p>
                        {inc.observations && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-0.5">
                            "{inc.observations}"
                          </p>
                        )}
                        {inc.evidence_image_url && (
                          <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${inc.evidence_image_url}`} alt="Evidencia" className="mt-1 h-12 w-12 rounded-md object-cover border border-gray-200 dark:border-slate-700" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{inc.order_number || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {inc.size}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {inc.defect_name ||
                          inc.defect_code ||
                          inc.description ||
                          '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {inc.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${status.color}`}
                        >
                          {status.label}
                        </span>
                        {inc.reviewed_by_name && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            por {inc.reviewed_by_name}
                          </p>
                        )}
                        {inc.rejection_reason && (
                          <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">
                            Motivo: {inc.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(inc.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal reportar incidencia */}
      <ReportIncidenceModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onCreated={loadIncidences}
      />
    </div>
  );
}
