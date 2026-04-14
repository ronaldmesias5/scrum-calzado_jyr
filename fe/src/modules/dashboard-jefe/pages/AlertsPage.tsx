import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, AlertTriangle, Info, CheckCircle2, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getAlerts } from '../services/dashboardService';
import { Alert } from '../types/dashboard';

export default function AlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'info':    return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':   return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20';
      case 'info':    return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
      case 'success': return 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20';
      case 'error':   return 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
      default:        return 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Bell className="w-8 h-8 text-orange-600" />
            Centro de Alertas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Monitorea eventos críticos del sistema en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <Button 
            onClick={loadAlerts}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all"
           >
            Actualizar
          </Button>
          <Button className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all">
            <Trash2 className="w-4 h-4" />
            Limpiar Todo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium tracking-tight">Cargando alertas del sistema...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sin alertas pendientes</h3>
              <p className="text-gray-500 dark:text-gray-400">Todo parece estar funcionando correctamente en el sistema.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-5 rounded-2xl border transition-all hover:shadow-md ${getBgColor(alert.type)} flex gap-4 items-start group relative`}
              >
                <div className="mt-1 shrink-0 bg-white dark:bg-slate-900 p-2 rounded-xl border border-inherit shadow-sm">
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-tight text-sm">
                      {alert.title}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                    {alert.description}
                  </p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all absolute top-4 right-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
