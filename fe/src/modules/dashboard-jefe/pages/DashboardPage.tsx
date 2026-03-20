/**
 * Archivo: modules/dashboard-jefe/pages/DashboardPage.tsx
 * Descripción: Dashboard principal del jefe/admin con métricas, órdenes y alertas.
 * 
 * ¿Qué?
 *   Página que muestra:
 *   - MetricsCards: KPIs (total pedidos, ventas, stock bajo)
 *   - RecentOrdersTable: Últimos pedidos (5-10 más recientes)
 *   - AlertsPanel: Alertas activas (bajo stock, pedidos pending)
 *   - QuickActionsSection: Acciones rápidas (crear orden, añadir producto)
 *   Datos se cargan con: getMetrics(), getRecentOrders(), getAlerts() desde backend
 * 
 * ¿Para qué?
 *   - Visión general del estado del negocio en tiempo real
 *   - Permitir acciones rápidas sin navegar a submódulos
 *   - Alertar sobre problemas críticos (bajo stock, pedidos pending)
 * 
 * ¿Impacto?
 *   ALTO — Punto de entrada principal del jefe/admin.
 *   Si falla: jefe no ve métricas, órdenes recientes, alertas.
 *   Dependencias: services/dashboardService.ts, components/home/*.tsx,
 *                types/dashboard.ts, react-router-dom
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import MetricsCards from '../components/home/MetricsCards';
import RecentOrdersTable from '../components/home/RecentOrdersTable';
import AlertsPanel from '../components/home/AlertsPanel';
import QuickActionsSection from '../components/home/QuickActionsSection';
import { getMetrics, getRecentOrders, getAlerts } from '../services/dashboardService';
import type { Metric, RecentOrder, Alert } from '../types/dashboard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getMetrics().then(setMetrics);
    getRecentOrders().then(setOrders);
    getAlerts().then(setAlerts);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-8 h-8 text-purple-600" />
          Inicio
        </h1>
        <p className="text-gray-600 text-sm mt-1">Bienvenido al dashboard de gestión</p>
      </div>

      {/* KPIs */}
      <MetricsCards metrics={metrics} />

      {/* Tabla + Alertas */}
      <div className="flex flex-col xl:flex-row gap-4">
        <RecentOrdersTable
          orders={orders}
          onViewAll={() => navigate('/dashboard/admin/orders')}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Acciones rápidas */}
      <QuickActionsSection />
    </div>
  );
}
