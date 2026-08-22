import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { StatCard } from '@/components/ui/StatCard';
import { listAllUsers, listClients } from '@/services/adminService';
import {
  getCustomerReport,
  getDashboardReport,
  getEmployeeReport,
  getAllCustomersReport,
  getGlobalProduction,
  getGlobalSales,
  getRoleReport,
} from '@/services/reportsService';
import type {
  CustomerReport,
  DashboardReport,
  EmployeeReport,
  ProductionReport,
  SalesReport,
} from '@/types/reports';
import { cn } from '@/utils/cn';

type TabKey = 'dashboard' | 'generador';
type ReportType = 'empleado' | 'cliente' | 'produccion' | 'ventas';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'generador', label: 'Generador' },
];

const DAY_OPTIONS = [7, 30, 90];

const REPORT_TYPES: { key: ReportType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'empleado', label: 'Empleado', icon: 'person-outline' },
  { key: 'cliente', label: 'Cliente', icon: 'people-outline' },
  { key: 'produccion', label: 'Producción', icon: 'construct-outline' },
  { key: 'ventas', label: 'Ventas', icon: 'trending-up-outline' },
];

const OCCUPATIONS = ['cortador', 'guarnecedor', 'solador', 'emplantillador', 'jefe'];

const PROD_STATES = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function fullName(user: { name: string; last_name: string } | null): string {
  if (!user) return '—';
  return `${user.name} ${user.last_name}`.trim();
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-6 text-lg font-bold text-gray-900 dark:text-white">{children}</Text>
  );
}

function DashboardTab({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const report = useQuery({
    queryKey: ['dashboard-report', days],
    queryFn: () => getDashboardReport(days),
    staleTime: 30_000,
  });

  const data: DashboardReport | undefined = report.data;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-4 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={report.isRefetching}
          onRefresh={() => report.refetch()}
          tintColor="#1e40af"
        />
      }
    >
      {/* Date range selector */}
      <View className="mb-4 flex-row gap-2">
        {DAY_OPTIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDays(d)}
            className={cn(
              'flex-1 items-center rounded-full py-2',
              days === d
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
            )}
          >
            <Text
              className={cn(
                'text-sm font-bold',
                days === d ? 'text-white' : 'text-gray-600 dark:text-gray-300',
              )}
            >
              {d} días
            </Text>
          </Pressable>
        ))}
      </View>

      {report.isLoading ? (
        <Loading label="Cargando dashboard..." />
      ) : report.isError ? (
        <ErrorState message="No se pudo cargar el dashboard" onRetry={() => report.refetch()} />
      ) : data ? (
        <>
          {/* KPIs */}
          <View className="flex-row flex-wrap gap-3">
            <StatCard label="Pedidos Totales" value={data.kpis.total_orders} color="blue" />
            <StatCard label="Pares Vendidos" value={data.kpis.total_pairs_sold} color="green" />
            <StatCard label="Tareas Completadas" value={data.kpis.total_tasks_completed} color="purple" />
            <StatCard label="Pares en Producción" value={data.kpis.pairs_in_production} color="orange" />
          </View>

          {/* Sales by category */}
          <SectionTitle>Ventas por categoría</SectionTitle>
          <Card className="gap-3">
            {data.sales_by_category.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
            ) : (
              data.sales_by_category.map((c, i) => (
                <View key={i} className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {c.category_name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {c.pairs_sold} pares · {c.percentage}%
                    </Text>
                  </View>
                  <View className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <View
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${Math.min(c.percentage, 100)}%` }}
                    />
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* Top products */}
          <SectionTitle>Productos más vendidos</SectionTitle>
          <Card className="gap-0">
            {data.top_products.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
            ) : (
              data.top_products.map((p, i) => (
                <View
                  key={p.product_id}
                  className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
                >
                  <View className="flex-1 flex-row items-center gap-3">
                    <Text className="w-6 text-sm font-bold text-gray-400">{i + 1}</Text>
                    <Text className="flex-1 text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                      {p.product_name}
                    </Text>
                  </View>
                  <Badge tone="blue" label={`${p.sales} ventas`} />
                </View>
              ))
            )}
          </Card>

          {/* Best employees */}
          <SectionTitle>Mejores empleados</SectionTitle>
          <Card className="gap-0">
            {data.top_employees.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
            ) : (
              data.top_employees.map((e) => (
                <View
                  key={e.user_id}
                  className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{e.occupation}</Text>
                  </View>
                  <Badge tone="green" label={`${e.completed_tasks} tareas`} />
                </View>
              ))
            )}
          </Card>

          {/* Top customers */}
          <SectionTitle>Mejores clientes</SectionTitle>
          <Card className="gap-0">
            {data.top_customers.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
            ) : (
              data.top_customers.map((c) => (
                <View
                  key={c.user_id}
                  className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {c.total_orders} pedidos
                    </Text>
                  </View>
                  <Badge tone="purple" label={`${c.total_pairs} pares`} />
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function PickerField({
  label,
  value,
  onPress,
  placeholder,
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">{label}</Text>
      <Pressable
        onPress={onPress}
        className={cn(
          'flex-row items-center justify-between rounded-xl border bg-white px-4 py-3',
          'border-gray-200 dark:border-slate-700 dark:bg-slate-900',
        )}
      >
        <Text
          className={cn(
            'text-sm',
            value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500',
          )}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

function EmployeeReportView({ report }: { report: EmployeeReport }) {
  return (
    <View className="gap-3">
      <Card className="gap-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{report.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{report.occupation}</Text>
      </Card>
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Tareas Completadas" value={report.total_tasks_completed} color="blue" />
        <StatCard label="Pares Producidos" value={report.total_pairs_produced} color="green" />
        <StatCard label="Ganancias" value={report.total_earnings} color="purple" />
      </View>

      <SectionTitle>Desglose por proceso</SectionTitle>
      <Card className="gap-0">
        {report.tasks_breakdown.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
        ) : (
          report.tasks_breakdown.map((b, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{b.process_name}</Text>
              <Badge tone="blue" label={`${b.count} tareas`} />
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Lista de tareas</SectionTitle>
      <Card className="gap-0">
        {report.tasks_list.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin tareas</Text>
        ) : (
          report.tasks_list.map((t) => (
            <View
              key={t.id}
              className="border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                {t.product_name}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {t.process_name} · {t.amount} pares · {formatDate(t.completed_at)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function CustomerReportView({ report }: { report: CustomerReport }) {
  return (
    <View className="gap-3">
      <Card className="gap-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{report.name}</Text>
      </Card>
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Pedidos" value={report.total_orders} color="blue" />
        <StatCard label="Pares" value={report.total_pairs} color="green" />
        <StatCard label="Total Gastado" value={report.total_spent} color="purple" />
      </View>

      <SectionTitle>Pedidos</SectionTitle>
      <Card className="gap-0">
        {report.orders.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin pedidos</Text>
        ) : (
          report.orders.map((o) => (
            <View
              key={o.id}
              className="border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-900 dark:text-white">
                  #{o.id.slice(0, 8)}
                </Text>
                <Badge tone="blue" label={`${o.total_pairs} pares`} />
              </View>
              <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {o.state} · {formatDate(o.created_at)} · ${o.total_price}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function ProductionReportView({ report }: { report: ProductionReport }) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Pares Período" value={report.total_pairs_period} color="blue" />
        <StatCard label="Tareas Período" value={report.total_tasks_period} color="green" />
        <StatCard label="Pedidos Período" value={report.total_orders_period} color="purple" />
      </View>

      <SectionTitle>Métricas semanales</SectionTitle>
      <Card className="gap-0">
        {report.weekly_metrics.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
        ) : (
          report.weekly_metrics.map((w, i) => (
            <View
              key={i}
              className="border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{w.week}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {w.pairs_manufactured} pares fabricados · {w.tasks_completed} tareas
              </Text>
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Pedidos</SectionTitle>
      <Card className="gap-0">
        {report.orders.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin pedidos</Text>
        ) : (
          report.orders.map((o) => (
            <View
              key={o.id}
              className="border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-900 dark:text-white">
                  #{o.id.slice(0, 8)}
                </Text>
                <Badge tone="blue" label={`${o.total_pairs} pares`} />
              </View>
              <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {o.state} · {formatDate(o.created_at)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function SalesReportView({ report }: { report: SalesReport }) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Pedidos Período" value={report.total_orders_period} color="blue" />
        <StatCard label="Pares Período" value={report.total_pairs_period} color="green" />
      </View>

      <SectionTitle>Métricas semanales</SectionTitle>
      <Card className="gap-0">
        {report.weekly_metrics.length === 0 ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400">Sin datos</Text>
        ) : (
          report.weekly_metrics.map((w, i) => (
            <View
              key={i}
              className="border-b border-gray-100 px-1 py-3 last:border-0 dark:border-slate-800"
            >
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{w.week}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {w.orders_created} pedidos · {w.pairs_ordered} pares
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function GeneradorTab() {
  const [reportType, setReportType] = useState<ReportType>('empleado');
  const [role, setRole] = useState<string>('cortador');
  const [employeeId, setEmployeeId] = useState<string>('all');
  const [customerId, setCustomerId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prodState, setProdState] = useState<string>('');
  const [run, setRun] = useState(0);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const employees = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => listAllUsers('employee'),
    staleTime: 120_000,
  });

  const customers = useQuery({
    queryKey: ['admin-clients'],
    queryFn: listClients,
    staleTime: 120_000,
  });

  const employeeReport = useQuery({
    queryKey: ['report-employee', employeeId, role, startDate, endDate, run],
    queryFn: () =>
      employeeId === 'all'
        ? getRoleReport(role, startDate || undefined, endDate || undefined)
        : getEmployeeReport(employeeId, startDate || undefined, endDate || undefined),
    enabled: reportType === 'empleado' && run > 0,
  });

  const customerReport = useQuery({
    queryKey: ['report-customer', customerId, startDate, endDate, run],
    queryFn: () =>
      customerId === 'all'
        ? getAllCustomersReport(startDate || undefined, endDate || undefined)
        : getCustomerReport(customerId, startDate || undefined, endDate || undefined),
    enabled: reportType === 'cliente' && run > 0,
  });

  const productionReport = useQuery({
    queryKey: ['report-production', startDate, endDate, run],
    queryFn: () => getGlobalProduction(30, startDate || undefined, endDate || undefined),
    enabled: reportType === 'produccion' && run > 0,
  });

  const salesReport = useQuery({
    queryKey: ['report-sales', startDate, endDate, run],
    queryFn: () => getGlobalSales(30, startDate || undefined, endDate || undefined),
    enabled: reportType === 'ventas' && run > 0,
  });

  const filteredEmployees = (employees.data ?? []).filter((e) => e.occupation === role);

  const changeReportType = (t: ReportType) => {
    setReportType(t);
    setRun(0);
  };

  const renderResult = () => {
    if (run === 0) {
      return (
        <EmptyState
          icon="document-text-outline"
          title="Genera un reporte"
          message="Configura los filtros y presiona Generar"
        />
      );
    }

    if (reportType === 'empleado') {
      if (employeeReport.isLoading) return <Loading label="Generando reporte..." />;
      if (employeeReport.isError)
        return <ErrorState message="No se pudo generar el reporte" onRetry={() => setRun((r) => r + 1)} />;
      if (employeeReport.data) return <EmployeeReportView report={employeeReport.data} />;
    }
    if (reportType === 'cliente') {
      if (customerReport.isLoading) return <Loading label="Generando reporte..." />;
      if (customerReport.isError)
        return <ErrorState message="No se pudo generar el reporte" onRetry={() => setRun((r) => r + 1)} />;
      if (customerReport.data) return <CustomerReportView report={customerReport.data} />;
    }
    if (reportType === 'produccion') {
      if (productionReport.isLoading) return <Loading label="Generando reporte..." />;
      if (productionReport.isError)
        return <ErrorState message="No se pudo generar el reporte" onRetry={() => setRun((r) => r + 1)} />;
      if (productionReport.data) return <ProductionReportView report={productionReport.data} />;
    }
    if (reportType === 'ventas') {
      if (salesReport.isLoading) return <Loading label="Generando reporte..." />;
      if (salesReport.isError)
        return <ErrorState message="No se pudo generar el reporte" onRetry={() => setRun((r) => r + 1)} />;
      if (salesReport.data) return <SalesReportView report={salesReport.data} />;
    }
    return null;
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
      {/* Report type picker */}
      <View className="mb-4 flex-row flex-wrap gap-2">
        {REPORT_TYPES.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => changeReportType(t.key)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-3.5 py-2',
              reportType === t.key
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
            )}
          >
            <Ionicons
              name={t.icon}
              size={14}
              color={reportType === t.key ? '#ffffff' : '#64748b'}
            />
            <Text
              className={cn(
                'text-xs font-bold',
                reportType === t.key ? 'text-white' : 'text-gray-600 dark:text-gray-300',
              )}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {reportType === 'empleado' && (
        <>
          <PickerField
            label="Rol"
            value={role}
            placeholder="Seleccionar rol..."
            onPress={() => setShowRolePicker(true)}
          />
          <PickerField
            label="Empleado"
            value={
              employeeId === 'all'
                ? 'Todos'
                : fullName(employees.data?.find((e) => e.id === employeeId) ?? null)
            }
            placeholder="Seleccionar empleado..."
            onPress={() => setShowEmployeePicker(true)}
          />
        </>
      )}

      {reportType === 'cliente' && (
        <PickerField
          label="Cliente"
          value={
            customerId === 'all'
              ? 'Todos'
              : fullName(customers.data?.find((c) => c.id === customerId) ?? null)
          }
          placeholder="Seleccionar cliente..."
          onPress={() => setShowCustomerPicker(true)}
        />
      )}

      {reportType === 'produccion' && (
        <>
          <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Estado</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {PROD_STATES.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setProdState(s.value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5',
                  prodState === s.value
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    prodState === s.value ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                  )}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View className="mb-4 flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Fecha inicio"
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Fecha fin"
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
      </View>

      <Button title="Generar" onPress={() => setRun((r) => r + 1)} />

      {run > 0 && (
        <Button
          title="Exportar PDF"
          variant="outline"
          className="mt-3"
          onPress={() => Alert.alert('PDF', 'Próximamente')}
        />
      )}

      <View className="mt-4">{renderResult()}</View>

      {/* Role Picker */}
      <ModalList
        visible={showRolePicker}
        title="Seleccionar rol"
        onClose={() => setShowRolePicker(false)}
        data={OCCUPATIONS}
        keyExtractor={(o) => o}
        renderItem={(o) => (
          <Pressable
            onPress={() => {
              setRole(o);
              setEmployeeId('all');
              setShowRolePicker(false);
            }}
            className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
          >
            <Text className="text-sm font-bold capitalize text-gray-900 dark:text-white">{o}</Text>
          </Pressable>
        )}
      />

      {/* Employee Picker */}
      <ModalList
        visible={showEmployeePicker}
        title="Seleccionar empleado"
        onClose={() => setShowEmployeePicker(false)}
        data={filteredEmployees}
        keyExtractor={(e) => e.id}
        renderItem={(e) => (
          <Pressable
            onPress={() => {
              setEmployeeId(e.id);
              setShowEmployeePicker(false);
            }}
            className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
          >
            <Text className="text-sm font-bold text-gray-900 dark:text-white">
              {fullName(e)}
            </Text>
            <Text className="text-xs text-gray-500">{e.email}</Text>
          </Pressable>
        )}
        header={
          <Pressable
            onPress={() => {
              setEmployeeId('all');
              setShowEmployeePicker(false);
            }}
            className="border-b border-gray-100 bg-blue-50 px-4 py-3 dark:border-slate-800 dark:bg-blue-900/20"
          >
            <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">Todos</Text>
          </Pressable>
        }
      />

      {/* Customer Picker */}
      <ModalList
        visible={showCustomerPicker}
        title="Seleccionar cliente"
        onClose={() => setShowCustomerPicker(false)}
        data={customers.data ?? []}
        keyExtractor={(c) => c.id}
        renderItem={(c) => (
          <Pressable
            onPress={() => {
              setCustomerId(c.id);
              setShowCustomerPicker(false);
            }}
            className="border-b border-gray-100 px-4 py-3 dark:border-slate-800"
          >
            <Text className="text-sm font-bold text-gray-900 dark:text-white">{fullName(c)}</Text>
            <Text className="text-xs text-gray-500">{c.email}</Text>
          </Pressable>
        )}
        header={
          <Pressable
            onPress={() => {
              setCustomerId('all');
              setShowCustomerPicker(false);
            }}
            className="border-b border-gray-100 bg-blue-50 px-4 py-3 dark:border-slate-800 dark:bg-blue-900/20"
          >
            <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">Todos</Text>
          </Pressable>
        }
      />
    </ScrollView>
  );
}

function ModalList<T>({
  visible,
  title,
  onClose,
  data,
  keyExtractor,
  renderItem,
  header,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  header?: ReactElement;
}) {
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
          <View className="w-8" />
        </View>
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          ListHeaderComponent={header}
          renderItem={({ item }) => renderItem(item)}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="Sin resultados" message="No hay elementos" />
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function AdminReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [days, setDays] = useState(30);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <AppHeader title="Reportes" />

      <View className="border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <View className="flex-row gap-2">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              className={cn(
                'flex-1 items-center rounded-full px-2 py-2',
                activeTab === t.key
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  activeTab === t.key ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                )}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === 'dashboard' ? (
        <DashboardTab days={days} setDays={setDays} />
      ) : (
        <GeneradorTab />
      )}
    </View>
  );
}
