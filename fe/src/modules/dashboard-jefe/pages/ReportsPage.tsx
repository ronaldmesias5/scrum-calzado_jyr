import { useTranslation } from 'react-i18next';
import { BarChart, TrendingUp, DollarSign, Package, ShoppingBag, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <BarChart className="w-8 h-8 text-orange-600" />
            Reportes y Estadísticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Análisis detallado del rendimiento de tu negocio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm transition-colors">
            <Calendar className="w-4 h-4 text-blue-500" />
            Últimos 30 días
          </div>
          <Button className="flex-1 sm:flex-none bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 px-6 py-2.5 font-bold text-sm tracking-tight transition-all active:scale-95">
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem label="Ingresos" value="$12.450.000" trend="+12.5%" positive={true} icon={DollarSign} color="text-green-600" bgColor="bg-green-50 dark:bg-green-500/10" />
        <KPIItem label="Pedidos" value="145" trend="+8.2%" positive={true} icon={ShoppingBag} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
        <KPIItem label="Pares Vendidos" value="1.240" trend="-2.4%" positive={false} icon={Package} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-500/10" />
        <KPIItem label="Tasa de Conversión" value="3.5%" trend="+0.8%" positive={true} icon={TrendingUp} color="text-orange-600" bgColor="bg-orange-50 dark:bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ventas por Categoría */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            Ventas por Categoría
          </h3>
          <div className="space-y-6">
            <CategoryProgress label="Caballero" value="45%" percentage={45} color="bg-blue-500" />
            <CategoryProgress label="Dama" value="32%" percentage={32} color="bg-pink-500" />
            <CategoryProgress label="Infantil" value="23%" percentage={23} color="bg-orange-500" />
          </div>
        </div>

        {/* Productos Top */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Productos Más Vendidos</h3>
          <div className="space-y-4">
            <TopProductItem name="Campus Negro X Blanco" sales="340 pares" trend="+15%" image="https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/791c5720175b49c2afe1afc800567819_9366/Tenis_adidas_Campus_00s_Negro_HQ8708_01_standard.jpg" />
            <TopProductItem name="Superstar Blanco" sales="210 pares" trend="+5%" image="https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/af18cf7896d841289c09af4b0113f415_9366/Tenis_Superstar_Blanco_FY7712_01_standard.jpg" />
            <TopProductItem name="Campus Gris" sales="185 pares" trend="+12%" image="https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/25732c3f87304f568a98af950005a8f4_9366/Tenis_adidas_Campus_00s_Gris_HQ8707_01_standard.jpg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIItem({ label, value, trend, positive, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center ${color} shadow-sm border border-inherit`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${positive ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'} px-2 py-1 rounded-lg border border-inherit`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function CategoryProgress({ label, value, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-extrabold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TopProductItem({ name, sales, trend, image }: any) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-slate-700 shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-gray-500 font-medium">{sales}</p>
      </div>
      <div className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg border border-green-100 dark:border-green-500/20">
        {trend}
      </div>
    </div>
  );
}
