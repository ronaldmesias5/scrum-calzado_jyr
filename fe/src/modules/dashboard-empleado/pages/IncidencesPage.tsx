import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, AlertCircle, Search, X, RefreshCw, Filter,
} from 'lucide-react';
import { getEmployeeIncidences } from '../services/employeeApi';
import type { EmployeeIncidence } from '../types/employee';

const STATE_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  resuelto: 'Resuelto',
  cancelado: 'Cancelado',
};

export default function EmployeeIncidencesPage() {
  const [incidences, setIncidences] = useState<EmployeeIncidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIncidences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployeeIncidences();
      setIncidences(data.incidences);
    } catch (e) {
      console.error('Error al cargar incidencias:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidences();
  }, [loadIncidences]);

  const filtered = incidences.filter((inc) => {
    const matchesState = !stateFilter || inc.state === stateFilter;
    const matchesSearch = !searchQuery
      || inc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      || inc.type_incidence.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 stagger-reveal">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            Incidencias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Reportes e incidencias de tus tareas de producción
          </p>
        </div>
        <button
          onClick={loadIncidences}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300 stagger-reveal">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              <Filter size={14} className="inline mr-1" /> Estado
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            >
              <option value="">Todos</option>
              {Object.entries(STATE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="relative lg:col-span-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                placeholder="Buscar incidencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSearchQuery(''); setStateFilter(''); }}
              className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700 dark:hover:bg-red-800 transition-all flex items-center justify-center gap-2"
            >
              <X size={14} /> Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE INCIDENCIAS */}
      <div className="stagger-reveal">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">Sin incidencias</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">No hay incidencias registradas.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((inc) => {
              const st = inc.state;
              const iconClass = st === 'en_progreso' ? 'text-blue-600 dark:text-blue-400'
                : st === 'resuelto' ? 'text-green-600 dark:text-green-400'
                : st === 'cancelado' ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400';
              const badgeClass = st === 'en_progreso' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                : st === 'resuelto' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                : st === 'cancelado' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
              const stateLabel = STATE_LABELS[inc.state] || inc.state;
              return (
                <div
                  key={inc.id}
                  className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-5 h-5 ${iconClass}`} />
                      <span className="font-bold text-gray-900 dark:text-white capitalize">
                        {inc.type_incidence.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${badgeClass}`}>
                      {stateLabel}
                    </span>
                  </div>
                  {inc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {inc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {inc.report_date && (
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} />
                        Reportado: {new Date(inc.report_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {inc.created_at && (
                      <span>
                        Creado: {new Date(inc.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
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
