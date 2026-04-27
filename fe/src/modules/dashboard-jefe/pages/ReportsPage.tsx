import { useState, useEffect } from 'react';
import { 
  BarChart, TrendingUp, Package, ShoppingBag, 
  ArrowUpRight, Calendar, Users, Briefcase, FileText, Download, CheckCircle, Search,
  Award, Star, Activity, PieChart, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  getDashboardReports, getEmployeeReport, getCustomerReport, 
  getGlobalProduction, getGlobalSales, markTasksAsPaid,
  getRoleReport, getAllCustomersReport,
  DashboardReportResponse, EmployeeReportResponse, CustomerReportResponse,
  ProductionGlobalReport, SalesGlobalReport, TaskDetail
} from '../services/reportsApi';
import axios from '@/api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator'>('dashboard');
  
  return (
    <div className="space-y-6 pb-20">
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
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          Dashboard General
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'generator'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          Generador de Reportes
        </button>
      </div>

      {activeTab === 'dashboard' ? <DashboardTab /> : <ReportGeneratorTab />}
    </div>
  );
}

function DashboardTab() {
  const [data, setData] = useState<DashboardReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getDashboardReports(days);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  if (loading || !data) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div>
      <div className="grid grid-cols-2 gap-8"><div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div><div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm outline-none"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem label="Pedidos" value={data.kpis.total_orders} icon={ShoppingBag} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
        <KPIItem label="Pares Vendidos" value={data.kpis.total_pairs_sold} icon={Package} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-500/10" />
        <KPIItem label="Tareas Completadas" value={data.kpis.total_tasks_completed} icon={CheckCircle} color="text-green-600" bgColor="bg-green-50 dark:bg-green-500/10" />
        <KPIItem label="Pares en Producción" value={data.kpis.pairs_in_production} icon={TrendingUp} color="text-orange-600" bgColor="bg-orange-50 dark:bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Ventas por Categoría</h3>
          <div className="space-y-6">
            {data.sales_by_category.length > 0 ? data.sales_by_category.map((cat, i) => (
              <CategoryProgress key={i} label={cat.category_name} value={`${cat.pairs_sold} pares`} percentage={cat.percentage} color={i % 2 === 0 ? "bg-blue-500" : "bg-orange-500"} />
            )) : <p className="text-sm text-gray-500">No hay datos</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Productos Más Vendidos</h3>
          <div className="space-y-4">
            {data.top_products.length > 0 ? data.top_products.map((prod) => (
              <TopProductItem key={prod.product_id} name={prod.product_name} sales={`${prod.sales} pares`} image={prod.image_url} />
            )) : <p className="text-sm text-gray-500">No hay datos</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Mejores Empleados por Cargo</h3>
          <div className="space-y-4">
            {data.top_employees && data.top_employees.length > 0 ? data.top_employees.map((emp) => (
              <div key={emp.user_id} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{emp.name}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase">{emp.occupation}</p>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg">
                  {emp.completed_tasks} Tareas
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No hay datos</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Star className="w-5 h-5 text-orange-500" /> Top Clientes</h3>
          <div className="space-y-4">
            {data.top_customers && data.top_customers.length > 0 ? data.top_customers.map((cust) => (
              <div key={cust.user_id} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{cust.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{cust.total_orders} pedidos</p>
                </div>
                <div className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-lg">
                  {cust.total_pairs} Pares
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No hay datos</p>}
          </div>
        </div>

      </div>
    </div>
  );
}

function ReportGeneratorTab() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<'employee' | 'customer' | 'production' | 'sales' | null>(null);
  
  // Employee state
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);

  // Selected User (Employee or Customer)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Reports
  const [employeeReport, setEmployeeReport] = useState<EmployeeReportResponse | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReportResponse | null>(null);
  const [productionReport, setProductionReport] = useState<ProductionGlobalReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesGlobalReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [globalDays, setGlobalDays] = useState(7);
  const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'completado' | 'pagado'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pendiente' | 'en_progreso' | 'completado' | 'entregado' | 'cancelado'>('all');
  const [reportError, setReportError] = useState<string | null>(null);
  const [isRoleReport, setIsRoleReport] = useState(false);
  const [isAllCustomers, setIsAllCustomers] = useState(false);

  // Load basic lists when mounting or changing type
  useEffect(() => {
    async function loadLists() {
      if (reportType === 'employee') {
        const res = await axios.get('/api/v1/admin/users', { params: { role: 'employee' } });
        const users = res.data;
        const uniqueRoles = Array.from(new Set(users.map((u: any) => u.occupation).filter(Boolean))) as string[];
        setRoles(uniqueRoles.filter(r => r.toLowerCase() !== 'jefe'));
        setEmployees(users);
      } else if (reportType === 'customer') {
        const res = await axios.get('/api/v1/admin/users', { params: { role: 'client' } });
        setCustomers(res.data);
      }
    }
    if (reportType === 'employee' || reportType === 'customer') {
      loadLists();
    }
  }, [reportType]);

  // Handle report generation
  useEffect(() => {
    async function generate() {
      setLoadingReport(true);
      setReportError(null);
      setSelectedTaskIds([]);
      setPaidSuccess(null);
      try {
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (dateMode === 'custom' && customStart && customEnd) {
          startDate = new Date(customStart).toISOString();
          endDate = new Date(customEnd + 'T23:59:59').toISOString();
        } else {
          endDate = new Date().toISOString();
          startDate = new Date(Date.now() - globalDays * 24 * 60 * 60 * 1000).toISOString();
        }
        if (reportType === 'employee') {
          if (isRoleReport && selectedRole) {
            const res = await getRoleReport(selectedRole, startDate, endDate, taskStatusFilter);
            setEmployeeReport(res);
          } else if (selectedUserId) {
            const res = await getEmployeeReport(selectedUserId, startDate, endDate, taskStatusFilter);
            setEmployeeReport(res);
          }
        } else if (reportType === 'customer') {
          if (isAllCustomers) {
            const res = await getAllCustomersReport(startDate, endDate, orderStatusFilter);
            setCustomerReport(res);
          } else if (selectedUserId) {
            const res = await getCustomerReport(selectedUserId, startDate, endDate);
            setCustomerReport(res);
          }
        } else if (reportType === 'production') {
          const res = await getGlobalProduction(globalDays, customStart || undefined, customEnd || undefined, orderStatusFilter);
          setProductionReport(res);
        }
      } catch (e: any) {
        console.error(e);
        setReportError(e.response?.data?.detail || "Ocurrió un error al generar el reporte. Por favor reintenta.");
      } finally {
        setLoadingReport(false);
      }
    }
  
  if (reportType === 'production' || reportType === 'sales' || selectedUserId || isRoleReport || isAllCustomers) {
    generate();
  }
  }, [reportType, selectedUserId, globalDays, dateMode, customStart, customEnd, isRoleReport, isAllCustomers, taskStatusFilter, orderStatusFilter]);

  const resetAll = () => {
    setSelectedRole(null);
    setSelectedUserId(null);
    setIsRoleReport(false);
    setIsAllCustomers(false);
    setEmployeeReport(null);
    setCustomerReport(null);
    setProductionReport(null);
    setSalesReport(null);
    setSelectedTaskIds([]);
    setPaidSuccess(null);
    setReportError(null);
  };

  const handleTypeChange = (type: any) => {
    setReportType(type);
    resetAll();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
      
      {/* Selector Principal */}
      <div className="mb-10">
        <label className="block text-sm font-bold text-gray-500 uppercase mb-4">1. Selecciona el Tipo de Reporte</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleTypeChange('employee')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${reportType === 'employee' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-100 dark:border-slate-700 hover:border-blue-200'}`}
          >
            <Briefcase className={`w-6 h-6 mb-2 ${reportType === 'employee' ? 'text-blue-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 dark:text-white">Empleado Individual</h4>
            <p className="text-xs text-gray-500 mt-1">Productividad y tareas completadas</p>
          </button>
          
          <button 
            onClick={() => handleTypeChange('customer')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${reportType === 'customer' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 dark:border-slate-700 hover:border-orange-200'}`}
          >
            <Users className={`w-6 h-6 mb-2 ${reportType === 'customer' ? 'text-orange-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 dark:text-white">Cliente Individual</h4>
            <p className="text-xs text-gray-500 mt-1">Historial de compras y pedidos</p>
          </button>

          <button 
            onClick={() => handleTypeChange('production')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${reportType === 'production' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-100 dark:border-slate-700 hover:border-purple-200'}`}
          >
            <Activity className={`w-6 h-6 mb-2 ${reportType === 'production' ? 'text-purple-600' : 'text-gray-400'}`} />
            <h4 className="font-bold text-gray-900 dark:text-white">Producción y Ventas</h4>
            <p className="text-xs text-gray-500 mt-1">Rendimiento global, ventas y fabricación</p>
          </button>

        </div>
      </div>

      {/* Flujo Dinámico */}
      {reportType === 'employee' && !selectedUserId && (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4">
          <label className="block text-sm font-bold text-gray-500 uppercase mb-4">2. Selecciona un Cargo</label>
          <div className="flex flex-wrap gap-3 mb-6">
            {roles.map(role => (
              <button 
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedRole === role ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'}`}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>

          {selectedRole && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-tight">3. Selecciona un Empleado</label>
                <button 
                  onClick={() => {
                    setIsRoleReport(!isRoleReport);
                    setSelectedUserId(null);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border-2 ${isRoleReport ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:border-purple-200'}`}
                >
                  {isRoleReport ? '✓ MOSTRANDO TODO EL CARGO' : 'VER TODO EL PERSONAL'}
                </button>
              </div>
              {!isRoleReport && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {employees.filter(e => e.occupation === selectedRole).map(emp => (
                    <button 
                      key={emp.id}
                      onClick={() => {
                        setIsRoleReport(false);
                        setSelectedUserId(emp.id);
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedUserId === emp.id && !isRoleReport ? 'border-blue-500 bg-blue-50' : 'border-gray-100 dark:border-slate-800 hover:border-blue-200 hover:bg-gray-50'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {emp.name?.charAt(0)}{emp.last_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{emp.name} {emp.last_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {reportType === 'customer' && !selectedUserId && (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-tight">2. Selecciona un Cliente</label>
            <button 
              onClick={() => {
                setIsAllCustomers(!isAllCustomers);
                setSelectedUserId(null);
              }}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border-2 ${isAllCustomers ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white border-orange-100 text-orange-600 hover:bg-orange-50 hover:border-orange-200'}`}
            >
              {isAllCustomers ? '✓ MOSTRANDO TODOS LOS CLIENTES' : 'VER TODOS LOS CLIENTES'}
            </button>
          </div>
          {!isAllCustomers && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
              {customers.map(cust => (
                <button 
                  key={cust.id}
                  onClick={() => {
                    setIsAllCustomers(false);
                    setSelectedUserId(cust.id);
                  }}
                  className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-left transition-all flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                    {cust.name?.charAt(0)}{cust.last_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{cust.name} {cust.last_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selector de Periodo Universal para Reportes */}
      {(reportType === 'production' || reportType === 'sales' || ((reportType === 'employee' || reportType === 'customer') && (selectedUserId || isRoleReport || isAllCustomers))) && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4">
          <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Rango de Tiempo
          </label>
          {/* Toggle modo */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setDateMode('preset')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${dateMode === 'preset' ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'}`}>
              Predefinido
            </button>
            <button onClick={() => setDateMode('custom')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${dateMode === 'custom' ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'}`}>
              Rango Personalizado
            </button>
          </div>
          {dateMode === 'preset' ? (
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Última semana', days: 7 },
                { label: 'Últimos 15 días', days: 15 },
                { label: 'Último mes', days: 30 },
                { label: 'Últimos 3 meses', days: 90 },
                { label: 'Últimos 6 meses', days: 180 },
                { label: 'Último año', days: 365 },
              ].map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setGlobalDays(opt.days)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    globalDays === opt.days
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-blue-600 uppercase">Desde</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border-2 border-blue-200 dark:border-blue-500/30 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-blue-600 uppercase">Hasta</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border-2 border-blue-200 dark:border-blue-500/30 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500"
                />
              </div>
              {customStart && customEnd && (
                <p className="text-xs font-medium text-blue-600 mt-4">El reporte se actualizará automáticamente.</p>
              )}
            </div>
          )}
        </div>
      )}


      {/* Resultados de Reportes */}
      {loadingReport && <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Generando reporte...</p></div>}
      
      {reportError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-6 rounded-3xl text-center mb-8">
          <p className="text-red-700 dark:text-red-400 font-bold mb-4">{reportError}</p>
          <Button onClick={() => {
            setReportError(null);
            setLoadingReport(true);
            // Esto forzará el useEffect
            setGlobalDays(prev => prev); 
          }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6">Reintentar</Button>
        </div>
      )}

      {employeeReport && !loadingReport && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{employeeReport.name}</h2>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest text-[10px]">Reporte de Rendimiento Individual</p>
              </div>
              
              {/* Filtro de Estado movido arriba */}
              <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-700 ml-4">
                {(['all', 'completado', 'pagado'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskStatusFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      taskStatusFilter === f 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Todas' : f === 'completado' ? 'Por Pagar' : 'Pagadas'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-sm font-bold py-2" onClick={() => setSelectedUserId(null)}>Cambiar Empleado</Button>
              <Button className="text-sm font-bold py-2"><Download className="w-4 h-4 mr-2" /> Exportar PDF</Button>
            </div>
          </div>

          {/* Estadísticas dinámicas según el filtro */}
          {(() => {
            const filteredTasks = employeeReport.tasks_list.filter(t => taskStatusFilter === 'all' || t.status === taskStatusFilter);
            const totalTasks = filteredTasks.length;
            const totalPairs = filteredTasks.reduce((sum, t) => sum + t.amount, 0);

            return (
              <>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Tareas {taskStatusFilter === 'completado' ? 'Pendientes' : taskStatusFilter === 'pagado' ? 'Pagadas' : 'Totales'}</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{totalTasks}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package className="w-12 h-12" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pares {taskStatusFilter === 'completado' ? 'por Liquidar' : taskStatusFilter === 'pagado' ? 'Liquidados' : 'Totales'}</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{totalPairs}</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Desglose por Etapa</h3>
                <div className="space-y-3 mb-8">
                  {/* Desglose dinámico según filtro */}
                  {Object.entries(
                    filteredTasks.reduce((acc, t) => {
                      acc[t.process_name] = (acc[t.process_name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).length > 0 ? Object.entries(
                    filteredTasks.reduce((acc, t) => {
                      acc[t.process_name] = (acc[t.process_name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 font-medium text-sm">
                      <span className="uppercase font-bold">{type}</span>
                      <span className="font-bold text-blue-600">{count} tareas</span>
                    </div>
                  )) : <p className="text-sm text-gray-500">No hay tareas en este estado.</p>}
                </div>

                {/* Lista de tareas individuales */}
                {filteredTasks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Detalle de Tareas
                      </h3>
                      <div className="flex items-center gap-3">
                        {taskStatusFilter !== 'pagado' && (
                          <button
                            onClick={() => {
                              const pendingIds = filteredTasks.filter(t => t.status === 'completado').map(t => t.id);
                              setSelectedTaskIds(prev => prev.length === pendingIds.length ? [] : pendingIds);
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            {selectedTaskIds.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todas'}
                          </button>
                        )}
                        {selectedTaskIds.length > 0 && (
                          <button
                            disabled={markingPaid}
                            onClick={async () => {
                              setMarkingPaid(true);
                              try {
                                const res = await markTasksAsPaid(selectedTaskIds);
                                setPaidSuccess(`✅ ${res.updated_count} tarea(s) marcadas como pagadas`);
                                setSelectedTaskIds([]);
                                // Refrescar el reporte
                                const endDate = dateMode === 'custom' && customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : new Date().toISOString();
                                const startDate = dateMode === 'custom' && customStart ? new Date(customStart).toISOString() : new Date(Date.now() - globalDays * 86400000).toISOString();
                                const fresh = await getEmployeeReport(selectedUserId!, startDate, endDate);
                                setEmployeeReport(fresh);
                              } catch(e) {
                                console.error(e);
                              } finally {
                                setMarkingPaid(false);
                              }
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {markingPaid ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircle className="w-4 h-4" />}
                            Marcar {selectedTaskIds.length} como Pagadas
                          </button>
                        )}
                      </div>
                    </div>

                    {paidSuccess && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl text-sm font-bold text-green-700 dark:text-green-400">
                        {paidSuccess}
                      </div>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {filteredTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => {
                            if (task.status !== 'completado') return;
                            setSelectedTaskIds(prev =>
                              prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            task.status === 'pagado'
                              ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 cursor-default'
                              : selectedTaskIds.includes(task.id)
                              ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-400'
                              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                            task.status === 'pagado' ? 'bg-green-500 border-green-500' :
                            selectedTaskIds.includes(task.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {(selectedTaskIds.includes(task.id) || task.status === 'pagado') && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 00-1.4 0L8 12.6 4.7 9.3a1 1 0 00-1.4 1.4l4 4a1 1 0 001.4 0l8-8a1 1 0 000-1.4z"/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-900 dark:text-white uppercase">{task.process_name}</span>
                              <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${task.status === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {task.status === 'pagado' ? '✓ Pagado' : 'Completado'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 truncate">Pedido #{task.order_id.toString().substring(0, 8)} - {task.product_name}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(task.created_at).toLocaleDateString()} · {task.amount} pares</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

      )}

      {customerReport && !loadingReport && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{customerReport.name}</h2>
                <p className="text-sm font-bold text-orange-600 uppercase tracking-widest text-[10px]">Historial de Compras</p>
              </div>
              
              {/* Filtro de Estado Pedidos */}
              <div className="flex flex-wrap gap-1 ml-4">
                {(['all', 'pendiente', 'en_progreso', 'completado', 'entregado', 'cancelado'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setOrderStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      orderStatusFilter === f 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                        : 'bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-slate-700 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'en_progreso' ? 'En Producción' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-sm font-bold py-2" onClick={() => setSelectedUserId(null)}>Cambiar Cliente</Button>
              <Button className="text-sm font-bold py-2"><Download className="w-4 h-4 mr-2" /> Exportar PDF</Button>
            </div>
          </div>

          {(() => {
            const filteredOrders = customerReport.orders.filter(o => orderStatusFilter === 'all' || o.state === orderStatusFilter);
            const totalOrders = filteredOrders.length;
            const totalPairs = filteredOrders.reduce((sum, o) => sum + o.total_pairs, 0);

            return (
              <>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShoppingBag className="w-12 h-12 text-orange-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pedidos {orderStatusFilter !== 'all' ? orderStatusFilter.replace('_', ' ') : 'Totales'}</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{totalOrders}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pares {orderStatusFilter !== 'all' ? orderStatusFilter.replace('_', ' ') : 'Comprados'}</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{totalPairs}</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Listado de Pedidos</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredOrders.length > 0 ? filteredOrders.map(o => (
                    <div 
                      key={o.id} 
                      onClick={() => navigate(`/dashboard/admin/orders?order=${o.id}`)}
                      className="cursor-pointer bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all flex items-center justify-between gap-4 group/card"
                    >
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="shrink-0 w-24">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ID PEDIDO</p>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">#{o.id.toString().substring(0, 8)}</h4>
                          <p className="text-[10px] text-gray-500 font-bold">{new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                          {o.items && o.items.map(p => {
                            const productImg = p.image_url && !p.image_url.startsWith('http') ? `${API_URL}${p.image_url}` : (p.image_url || "https://via.placeholder.com/150");
                            return (
                              <div key={p.product_id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700 shrink-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
                                  <img src={productImg} alt={p.product_name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{p.product_name}</p>
                                  <p className="text-[9px] text-gray-500">{p.amount} p</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                            o.state === 'entregado' ? 'bg-green-100 text-green-700 border-green-200' :
                            o.state === 'pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            o.state === 'en_progreso' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {o.state === 'en_progreso' ? 'En Producción' : o.state.replace('_', ' ')}
                          </span>
                          <p className="text-xs font-black text-blue-600 mt-1">{o.total_pairs} pares</p>
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/admin/orders?order=${o.id}`); }}
                          className="w-10 h-10 bg-gray-900 dark:bg-slate-700 text-white rounded-xl group-hover/card:bg-blue-600 transition-colors flex items-center justify-center shadow-lg shadow-gray-900/20"
                          title="Ver Detalle"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                      <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay pedidos en este estado</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {productionReport && !loadingReport && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Producción y Ventas Globales</h2>
              <p className="text-sm font-bold text-purple-600">Rendimiento y Volumen de Pedidos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 mb-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrar por Estado de Pedido</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Todos', value: 'all' },
                  { label: 'Pendientes', value: 'pendiente' },
                  { label: 'En Producción', value: 'en_progreso' },
                  { label: 'Completados', value: 'completado' },
                  { label: 'Entregados', value: 'entregado' },
                  { label: 'Cancelados', value: 'cancelado' }
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setOrderStatusFilter(s.value as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                      orderStatusFilter === s.value 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-none scale-105' 
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-purple-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <Button className="text-sm font-bold py-2 w-full lg:w-auto"><Download className="w-4 h-4 mr-2" /> Exportar PDF</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pedidos Creados</p>
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{productionReport.total_orders_created}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pares Ordenados</p>
              <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{productionReport.total_pairs_ordered}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pares Fabricados</p>
              <p className="text-4xl font-black text-green-600 dark:text-green-400">{productionReport.total_pairs_period}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Vales Completados</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{productionReport.total_tasks_period}</p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-500" /> Pedidos en el Periodo
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {productionReport.orders && productionReport.orders.length > 0 ? productionReport.orders.map(o => (
              <div 
                key={o.id} 
                onClick={() => navigate(`/dashboard/admin/orders?order=${o.id}`)}
                className="cursor-pointer bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex items-center justify-between gap-4 group/card"
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="shrink-0 w-24">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ID PEDIDO</p>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">#{o.id.toString().substring(0, 8)}</h4>
                    <p className="text-[10px] text-gray-500 font-bold">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    {o.items && o.items.map(p => {
                      const productImg = p.image_url && !p.image_url.startsWith('http') ? `${API_URL}${p.image_url}` : (p.image_url || "https://via.placeholder.com/150");
                      return (
                        <div key={p.product_id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700 shrink-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
                            <img src={productImg} alt={p.product_name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{p.product_name}</p>
                            <p className="text-[9px] text-gray-500">{p.amount} p</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                      o.state === 'entregado' ? 'bg-green-100 text-green-700 border-green-200' :
                      o.state === 'pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      o.state === 'en_progreso' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {o.state === 'en_progreso' ? 'En Producción' : o.state.replace('_', ' ')}
                    </span>
                    <p className="text-xs font-black text-blue-600 mt-1">{o.total_pairs} pares</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay pedidos registrados en este periodo</p>
              </div>
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" /> Rendimiento Semanal
          </h3>
          <div className="space-y-3">
            {productionReport.weekly_metrics.length > 0 ? productionReport.weekly_metrics.map(w => (
              <div key={w.week} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-black text-purple-600 dark:text-purple-400">
                      {w.week.split('-W')[1]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Semana {w.week.split('-W')[1]}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{w.week.split('-W')[0]}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex items-center gap-6">
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pedidos</p>
                      <p className="text-sm font-black text-blue-600">{w.orders_created}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pares Ord.</p>
                      <p className="text-sm font-black text-indigo-600">{w.pairs_ordered}</p>
                    </div>
                    <div className="text-center sm:text-right border-l border-gray-100 dark:border-slate-800 pl-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pares Fab.</p>
                      <p className="text-sm font-black text-green-600">{w.pairs_manufactured}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tareas</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{w.tasks_completed}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay datos en este periodo</p>
              </div>
            )}
  

          </div>
        </div>
      )}

    </div>
  );
}

function KPIItem({ label, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center ${color} shadow-sm border border-inherit`}>
          <Icon className="w-6 h-6" />
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

function TopProductItem({ name, sales, image }: any) {
  const imageUrl = image && !image.startsWith('http') ? `${API_URL}${image}` : (image || "https://via.placeholder.com/150");
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-slate-700 shrink-0">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-gray-500 font-medium">{sales}</p>
      </div>
    </div>
  );
}
