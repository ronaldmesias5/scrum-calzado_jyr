/**
 * Módulo: OrdersPage.tsx
 * Descripción: Página de gestión de pedidos mayoristas del dashboard.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Scissors, Hammer, Sparkles, PenTool, Maximize2,
  ShoppingCart, Package, Filter, Search, Loader2, AlertCircle, Clock,
  Zap, CheckCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  ArrowRight, Mail, Phone, User, Plus, ArrowLeft,
  PlayCircle, Ban, RefreshCw, Trash2, Eraser, Edit2
} from 'lucide-react';
import {
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  updateOrderDetails,
  deleteOrder,
  getOrderTasks,
  getNextValeNumber,
  type Order,
  type OrderDetail,
  type OrderStatus,
  createProductionTasks,
  updateProductionTaskStatus
} from '../services/ordersApi';
import { getAllUsers } from '../services/adminApi';
import { type UserResponse } from '@/types/auth';
import OrderFormModal from '../components/OrderFormModal';
import ContactClientModal from '../components/ContactClientModal';
import StatCard from '../components/StatCard';
import ImageViewerModal from '../components/ImageViewerModal';
import { StatusBadge } from '../components/StatusBadgeComponent';
import { resolveImageUrl } from '../services/catalogService';
import { checkProductSupplies, type ProductSuppliesCheckResponse } from '../services/suppliesService';

// ─── Etapas y Cargos ─────────────────────
const STAGES_LOGIC = [
  { key: 'corte',        label: 'Corte',        occupation: 'cortador',     color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10', icon: Scissors },
  { key: 'guarnicion',   label: 'Guarnición',   occupation: 'guarnecedor',  color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10',   icon: PenTool },
  { key: 'soladura',     label: 'Soladura',     occupation: 'solador',      color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10', icon: Hammer },
  { key: 'emplantillado', label: 'Emplantillado', occupation: 'emplantillador', color: 'border-green-500 bg-green-50/50 dark:bg-green-900/10', icon: Sparkles },
];

const CAT_TO_STAGE: Record<string, string> = {
  'sintéticos': 'corte', 'forros': 'corte', 'mayas': 'corte', 'cambre': 'corte', 'carnazas': 'corte', 'apliques': 'corte',
  'tiras': 'guarnicion', 'hilos': 'guarnicion',
  'suelas': 'soladura',
  'plantillas': 'emplantillado', 'lujos': 'emplantillado'
};

const getStageByCat = (cat: string) => CAT_TO_STAGE[cat.toLowerCase()] || 'otros';

// ─────────────────────────────────────────
// ─────────────────────────────────────────
// Cards de resumen
// ─────────────────────────────────────────

function SummaryCards({ totals }: { totals: Record<OrderStatus, number> }) {
  const items: Array<{ status: OrderStatus; color: 'yellow' | 'blue' | 'green' | 'red'; label: string; icon: React.ReactNode }> = [
    { status: 'pendiente',   color: 'yellow', label: 'Pendiente', icon: <Clock size={24} /> },
    { status: 'en_progreso', color: 'blue',   label: 'En Producción', icon: <Zap size={24} /> },
    { status: 'completado',  color: 'green',  label: 'Completado', icon: <CheckCircle size={24} /> },
    { status: 'entregado',   color: 'green',  label: 'Entregado', icon: <CheckCircle2 size={24} /> },
    { status: 'cancelado',   color: 'red',    label: 'Cancelado', icon: <XCircle size={24} /> },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {items.map(({ status, color, label, icon }) => (
        <StatCard
          key={status}
          label={label}
          value={totals[status] || 0}
          icon={icon}
          color={color}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Tabla de pedidos
// ─────────────────────────────────────────

function OrdersTable({ orders, onSelect }: { orders: Order[]; onSelect: (o: Order) => void }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-12 text-center transition-all">
        <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No hay pedidos que mostrar</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">Prueba ajustando los filtros de búsqueda</p>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Pedido</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pares</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-2 font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  #{order?.id?.substring(0, 8) || '---'}
                </td>
                <td className="px-4 py-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                    {order.customer_name && order.customer_last_name
                      ? `${order.customer_name} ${order.customer_last_name}`
                      : <span className="text-gray-400 font-mono text-xs italic">Sin identificar</span>}
                  </p>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                    {order.total_pairs}
                  </span>
                </td>
                <td className="px-4 py-2"><StatusBadge status={order.state} /></td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  {new Date(order.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => onSelect(order)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-95 shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Vista detalle del pedido
// ─────────────────────────────────────────

function OrderDetailView({
  order,
  isUpdating,
  onBack,
  onStatusChange,
  onDelete,
  onContactClient,
  onUpdateItemsStatus,
  orderSupplies,
  productionModal,
  setProductionModal,
  error,
  onOrderUpdate,
  setIsEditModalOpen,
}: {
  order: OrderDetail;
  isUpdating: boolean;
  onBack: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onDelete: (orderId: string) => void;
  onContactClient: () => void;
  onUpdateItemsStatus: (productId: string, newStatus: OrderStatus) => void;
  orderSupplies: Record<string, ProductSuppliesCheckResponse>;
  productionModal: {
    productId: string;
    productName: string;
    missingCount: number;
    totalCount: number;
    forceProgress?: boolean;
  } | null;
  setProductionModal: React.Dispatch<React.SetStateAction<{
    productId: string;
    productName: string;
    missingCount: number;
    totalCount: number;
    forceProgress?: boolean;
  } | null>>;
  onOrderUpdate?: (updatedOrder: OrderDetail) => void;
  error?: string | null;
  setIsEditModalOpen: (productId?: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [productionStep, setProductionStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B'>('A');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [nextValeNumber, setNextValeNumber] = useState<number | null>(null);
  const [currentTasks, setCurrentTasks] = useState<any[]>([]);

  useEffect(() => {
    if (productionModal) {
      setProductionStep(productionModal.forceProgress ? 2 : 1);
      // Only clear if not forcing progress to avoid flickering locked states
      if (!productionModal.forceProgress) {
        setCurrentTasks([]);
        setAssignments({});
      }
      setLoadingTasks(true);

      // Fetch next vale number (for new assignments) usando la instancia configurada
      getNextValeNumber()
        .then(n => setNextValeNumber(n))
        .catch(console.error);

      // Fetch current tasks for this order usando la instancia configurada (con baseURL y auth)
      const capturedProductId = productionModal.productId;
      getOrderTasks(order.id)
        .then(allOrderTasks => {
          // Filtrar en frontend por product_id (comparación normalizada a minúsculas)
          const tasks = allOrderTasks.filter(
            (t) => t.product_id?.toLowerCase() === capturedProductId?.toLowerCase()
          );
          
          if (tasks.length > 0) {
            setCurrentTasks(tasks);
            const newAssignments: Record<string, string> = {};
            tasks.forEach((t) => {
              if (t?.type) newAssignments[t.type] = t.assigned_to || '';
            });
            setAssignments(newAssignments);
            setProductionStep(2);
          } else {
            setCurrentTasks([]);
            if (capturedProductId && productionModal?.forceProgress) setProductionStep(2);
          }
        })
        .catch(err => {
          console.error('Error fetching tasks:', err);
          setCurrentTasks([]);
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [productionModal, order.id]);

  useEffect(() => {
    getAllUsers('employee').then(setEmployees).catch(console.error);
  }, []);

  // Cargar tareas del orden para mostrar números de vale en las cards
  useEffect(() => {
    if (order?.id) {
      getOrderTasks(order.id)
        .then(tasks => {
          setCurrentTasks(tasks);
        })
        .catch(err => {
          console.error('Error fetching tasks for display:', err);
        });
    }
  }, [order?.id]);

  // Limpiar estados al cerrar modal y recargar tareas para mostrar en cards
  useEffect(() => {
    if (!productionModal) {
      setProductionStep(1);
      setAssignments({});
      setLoadingTasks(false);
      
      // Recargar todas las tareas para mostrar números de vale en las cards
      if (order?.id) {
        getOrderTasks(order.id)
          .then(tasks => setCurrentTasks(tasks))
          .catch(err => console.error('Error fetching tasks:', err));
      }
    }
  }, [productionModal, order?.id]);

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setLoadingTasks(true);
      // Filtrar los detalles para eliminar el producto seleccionado
      const updatedDetails = order.details.filter(d => d.product_id !== productId);
      
      // Si no hay más detalles, no permitir (la orden debe tener al menos un producto)
      if (updatedDetails.length === 0) {
        setSuccessToast('La orden debe tener al menos un producto');
        setTimeout(() => setSuccessToast(null), 3000);
        return;
      }

      // Actualizar la orden sin el producto eliminado
      const response = await updateOrderDetails(order.id, {
        delivery_date: order.delivery_date,
        details: updatedDetails.map(d => ({
          product_id: d.product_id,
          size: d.size,
          colour: d.colour,
          amount: d.amount,
          state: d.state
        } as any))
      });

      // Actualizar la orden en el componente padre
      onOrderUpdate?.(response);
      setProductToDelete(null);
      setSuccessToast('Producto eliminado de la orden');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setSuccessToast('Error al eliminar el producto');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setLoadingTasks(true);
      
      // Buscar el task ANTES de actualizar el estado
      const taskToUpdate = Array.isArray(currentTasks) ? currentTasks.find(t => t.id === taskId) : null;
      const isEmlantillado = taskToUpdate?.type === 'emplantillado';
      const productId = taskToUpdate?.product_id;
      
      await updateProductionTaskStatus(taskId, newStatus);
      
      // Actualizar estado local
      setCurrentTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      // Si es emplantillado y estado es completado, refrescar orden completa INMEDIATAMENTE
      if (newStatus === 'completado' && isEmlantillado) {
        try {
          // Refrescar los detalles de la orden para actualizar el estado del producto
          const refreshedOrder = await getOrderDetail(order.id);
          
          // AUTOMÁTICAMENTE marcar el producto como completado (sin validar stock)
          if (productId) {
            const updatedDetails = refreshedOrder.details.map(d => 
              d.product_id === productId ? { ...d, state: 'completado' as const } : d
            );
            
            // Actualizar solo el detalle sin validar stock
            const res = await updateOrderDetails(refreshedOrder.id, {
              delivery_date: refreshedOrder.delivery_date,
              details: updatedDetails.map(d => ({
                product_id: d.product_id,
                size: d.size,
                colour: d.colour,
                amount: d.amount,
                state: d.state
              } as any))
            });
            
            onOrderUpdate?.(res);
            
            // Ahora calcular si el estado global debe cambiar
            if (res?.details) {
              const allCompleted = res.details.every(d => d.state === 'completado');
              if (allCompleted && res.state !== 'completado') {
                console.log('✅ Todos los productos completados, actualizando estado global en el backend...');
                try {
                  // Llamar al backend para actualizar el estado del pedido a completado
                  // Esto también crea los movimientos de inventario automáticamente
                  await updateOrderStatus(order.id, { state: 'completado' });
                  
                  // Refrescar la orden para obtener el estado actualizado
                  const updatedOrder = await getOrderDetail(order.id);
                  onOrderUpdate?.(updatedOrder);
                  console.log('✅ Estado global actualizado a completado y movimientos de inventario creados');
                } catch (statusErr: any) {
                  console.error('❌ Error actualizando estado global:', statusErr);
                  // Si falla, al menos actualizar localmente
                  onOrderUpdate?.({
                    ...res,
                    state: 'completado'
                  });
                }
              }
            }
          } else {
            onOrderUpdate?.(refreshedOrder);
          }
        } catch (refreshError) {
          console.warn('Warning al refrescar orden:', refreshError);
          // No mostrar error, continuar
        }
        setSuccessToast('🎉 Vale Terminado - Producto Completado - Listo para Entrega!');
      } else {
        setSuccessToast(`Tarea actualizada a ${newStatus} con éxito`);
      }
      
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      console.error('Error updating task:', e);
      setSuccessToast('Error al actualizar la tarea');
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setLoadingTasks(false);
    }
  };

  const canStartProduction = order.state === 'pendiente';
  const canCancel          = order.state === 'pendiente';
  const canDelete          = order.state === 'cancelado';
  const canRestore         = order.state === 'cancelado';
  const isEverythingInStock = order.details.length > 0 && order.details.every(d => (d.stock_available ?? 0) >= d.amount);
  
  // Verificar si hay tareas de producción activas (si el producto fue fabricado)
  const hasProductionTasks = currentTasks && currentTasks.length > 0;
  
  // "Completar desde Inventario" solo para pendiente SIN tareas de producción Y con stock
  const canCompleteFromStock = canStartProduction && !hasProductionTasks && isEverythingInStock;

  // Agrupar por product_id para cálculos globales
  const groups = order.details.reduce<Record<string, typeof order.details>>((acc, d) => {
    const key = d.product_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const productCount = Object.keys(groups).length;
  const completedProducts = Object.values(groups).filter(lines => lines.every(l => l.state === 'completado' || l.state === 'entregado')).length;
  const inProgressProducts = Object.values(groups).filter(lines => lines.some(l => l.state === 'en_progreso')).length;
  
  const progressText = order.state === 'entregado'
    ? "Completado y Entregado al Cliente"
    : completedProducts === productCount 
    ? "Todos los productos terminados y listos para entregar"
    : completedProducts > 0 
      ? `${completedProducts} de ${productCount} productos terminados`
      : inProgressProducts > 0 
        ? "Producción en curso"
        : "Esperando inicio de producción";

  return (
    <div className="space-y-6">
      {/* Toast Animado Minimalista */}
      {successToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500">
          <div className="bg-white dark:bg-slate-900 border-2 border-green-500 rounded-full px-6 py-4 shadow-2xl flex items-center gap-4 border-b-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{successToast}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors">
              Pedido <span className="font-mono text-blue-600 dark:text-blue-400">#{order.id.substring(0, 8)}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{progressText}</span>
              {completedProducts < productCount && order.state !== 'entregado' && (
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
              )}
              {completedProducts < productCount && productCount - completedProducts > 0 && order.state !== 'entregado' && (
                <span className="text-[10px] font-black text-orange-500 uppercase">Faltan {productCount - completedProducts} productos</span>
              )}
            </div>
          </div>
          <div className="sm:hidden">
            <StatusBadge status={order.state} />
          </div>
        </div>
        <div className="hidden sm:block">
           <StatusBadge status={order.state} />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 transition-colors sm:hidden">
          Creado el {new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: información del pedido + tabla de productos */}
        <div className="lg:col-span-2 space-y-6">

          {/* Resumen */}
          <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 transition-all duration-300">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Información del Pedido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-widest">ID Pedido</p>
                <p className="font-mono font-bold text-gray-900 dark:text-gray-100">#{order.id.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Total de Pares</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{order.total_pairs}</p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Entrega Estimada</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString('es-CO')
                    : <span className="text-gray-400 dark:text-gray-500">No definida</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Cards de productos agrupadas por producto */}
          {order.details.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Sin líneas de detalle</p>
            </div>
          ) : (() => {
            // Agrupar por product_id
            const groups = order.details.reduce<Record<string, typeof order.details>>((acc, d) => {
              const key = d.product_id;
              if (!acc[key]) acc[key] = [];
              acc[key].push(d);
              return acc;
            }, {});

            return (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Productos del Pedido
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({Object.keys(groups).length} {Object.keys(groups).length === 1 ? 'producto' : 'productos'})
                  </span>
                </h2>
                {Object.entries(groups).map(([productId, lines]) => {
                  const first = lines && lines.length > 0 ? lines[0] : null;
                  
                  if (!first) return null;

                  const productName = first.product_name ?? `Producto #${productId.substring(0, 8)}`;
                  const styleName = first.style_name;
                  const categoryName = first.category_name;
                  const brandName = first.brand_name;
                  
                  // Usar directamente el image_url del backend (que ya viene con el detalle del pedido)
                  const productImageUrl = first.image_url ? resolveImageUrl(first.image_url) : null;
                  
                    const totalProductPairs = lines.reduce((s, l) => s + l.amount, 0);
                    const totalToProduce = lines.reduce((acc, l) => acc + Math.max(0, l.amount - Math.max(0, Math.floor(l.stock_available ?? 0))), 0);
                    const allAvailable = lines.every(l => (l.stock_available ?? 0) >= l.amount);
                    const productSuppliesData = orderSupplies[productId];
                    
                    // El estado del producto es el estado del primer item (asumimos consistencia por grupo)
                    const productState = first.state || 'pendiente';

                    return (
                      <div key={productId} className={`bg-white dark:bg-slate-900/50 border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${allAvailable ? 'border-green-200 dark:border-green-900/50' : 'border-gray-200 dark:border-slate-800'}`}>
                         <div className={`${productState === 'completado' ? 'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30' : productState === 'en_progreso' ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800'} border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Inner content (image and name) stays as flex-row */}
                              {/* ... already handled above ... */}
                              {productImageUrl && !failedImages.has(productImageUrl) ? (
                                <button
                                  onClick={() => { setViewingImage(productImageUrl); setViewingProductName(productName); }}
                                  className="relative w-20 h-20 sm:w-32 sm:h-32 border rounded-xl overflow-hidden bg-transparent cursor-pointer flex items-center justify-center flex-shrink-0"
                                style={{
                                  borderColor: allAvailable ? '#22c55e40' : '#33415540',
                                }}
                                title="Click para ver imagen completa"
                              >
                                <img
                                  src={productImageUrl}
                                  alt={productName}
                                  crossOrigin="anonymous"
                                  onError={() => {
                                    console.error('❌ Imagen error:', productImageUrl);
                                    handleImageError(productImageUrl);
                                  }}
                                  onLoad={() => {

                                  }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    backgroundColor: '#ffffff',
                                  }}
                                />
                              </button>
                            ) : (
                              <div 
                                className="w-20 h-20 sm:w-32 sm:h-32 border rounded-xl flex items-center justify-center bg-transparent flex-shrink-0"
                                style={{
                                  borderColor: allAvailable ? '#22c55e40' : '#33415540',
                                }}
                              >
                                <Package className={`w-10 h-10 ${allAvailable ? 'text-green-300 dark:text-green-700' : 'text-gray-300 dark:text-gray-700'}`} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-lg transition-colors">{productName}</p>
                                {allAvailable && (
                                  <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200 dark:border-green-900/50">
                                    <CheckCircle size={10} />
                                    Todo en Bodega
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                                {[brandName, styleName, categoryName].filter(Boolean).join(' · ')}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <StatusBadge status={productState} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap border border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                              {totalProductPairs} pares pedidos
                              {(() => {
                                const taskForProduct = Array.isArray(currentTasks) ? currentTasks.find(t => t.product_id?.toLowerCase() === productId.toLowerCase()) : null;
                                if (taskForProduct?.vale_number) {
                                  return (
                                    <span className="text-red-600 dark:text-red-400 font-black">
                                      • Vale #{taskForProduct.vale_number}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </span>

                            {/* Acciones de Producción por Producto */}
                            <div className="flex items-center gap-2">
                              {productState === 'pendiente' && (
                                <button 
                                  onClick={() => setProductionModal({ productId, productName, missingCount: totalToProduce, totalCount: totalProductPairs })}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                                >
                                  <PlayCircle size={14} />
                                  <span>Iniciar Producción</span>
                                </button>
                              )}
                              
                              {productState === 'en_progreso' && (
                                <button 
                                  onClick={() => setProductionModal({ productId, productName, missingCount: totalToProduce, totalCount: totalProductPairs, forceProgress: true })}
                                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold border border-blue-200 dark:border-blue-900/30"
                                  title="Ver detalle del vale y progreso"
                                >
                                  <Maximize2 size={14} />
                                  <span>Ver Progreso</span>
                                </button>
                              )}

                              {productState === 'completado' && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setProductionModal({ productId, productName, missingCount: totalToProduce, totalCount: totalProductPairs, forceProgress: true })}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                                    title="Ver detalles del vale"
                                  >
                                    <Package size={14} />
                                    <span>Ver Vale</span>
                                  </button>
                                  <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-lg text-xs font-black uppercase flex items-center gap-2">
                                    <Package size={14} />
                                    Listo para Entrega
                                  </div>
                                </div>
                              )}

                              {productState === 'entregado' && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setProductionModal({ productId, productName, missingCount: totalToProduce, totalCount: totalProductPairs, forceProgress: true })}
                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                                    title="Ver detalles del vale entregado"
                                  >
                                    <Package size={14} />
                                    <span>Ver Vale</span>
                                  </button>
                                  <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-black uppercase flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    Entregado al Cliente
                                  </div>
                                </div>
                              )}
                            </div>
                            
                           {/* Botones de editar y eliminar producto — solo cuando está pendiente */}
                            {productState === 'pendiente' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setIsEditModalOpen(productId)}
                                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold flex-1"
                                >
                                  <Edit2 size={14} />
                                  <span>Editar</span>
                                </button>
                                {!productToDelete && (
                                  <button
                                    onClick={() => setProductToDelete(productId)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold flex-1"
                                  >
                                    <Trash2 size={14} />
                                    <span>Eliminar</span>
                                  </button>
                                )}
                              </div>
                            )}
                            {/* Confirmación de eliminación */}
                            {productToDelete === productId && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-sm space-y-2">
                                <p className="text-red-800 dark:text-red-300 font-medium">¿Confirmas la eliminación?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeleteProduct(productId)}
                                    disabled={loadingTasks}
                                    className="flex-1 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 font-medium text-xs"
                                  >
                                    {loadingTasks ? 'Eliminando...' : 'Sí, eliminar'}
                                  </button>
                                  <button
                                    onClick={() => setProductToDelete(null)}
                                    className="flex-1 py-1.5 border border-gray-300 dark:border-slate-600 rounded hover:bg-white dark:hover:bg-slate-700 dark:text-gray-300 font-medium text-xs transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Tallas y cantidades */}
                        <div className="p-5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {[...lines].sort((a, b) => parseInt(a.size || "0") - parseInt(b.size || "0")).map((line) => {
                              const hasStock = (line.stock_available ?? 0) >= line.amount;
                              const stockColor = hasStock ? 'text-green-600 dark:text-green-400' : (line.stock_available ?? 0) > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400';
                              const bgColor = hasStock ? 'bg-green-50/30 dark:bg-green-950/10' : 'bg-gray-50 dark:bg-slate-800/30';
                              const borderColor = hasStock ? 'border-green-100 dark:border-green-900/30' : 'border-gray-200 dark:border-slate-800';

                              return (
                                <div key={line.id} className={`flex flex-col gap-1 border rounded-lg px-3 py-2 ${bgColor} ${borderColor}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Talla {line.size}</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{line.amount} pares</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 mt-1 pt-1 font-bold">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">En Bodega:</span>
                                    <span className={`text-xs font-bold ${stockColor}`}>
                                      {Math.max(0, Math.floor(line.stock_available ?? 0))}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Botón ENTREGAR cuando está completado / Métricas de Insumos cuando está en producción */}
                        {productState === 'completado' ? (
                          <div className="px-5 py-4 bg-green-50/50 dark:bg-green-950/20 border-t border-green-100 dark:border-green-900/30 space-y-3">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">✓ Producto Fabricado y Listo</h3>
                            </div>
                            <button
                              onClick={() => onUpdateItemsStatus(productId, 'entregado')}
                              disabled={isUpdating}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Entregar al Cliente
                            </button>
                          </div>
                        ) : productState === 'entregado' ? (
                          <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900/30 space-y-3">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">✓ Entregado al Cliente</h3>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Métricas de Insumos para Producción */}
                            {(() => {
                              if (totalToProduce === 0) return (
                                <div className="px-5 py-3 bg-green-50/50 dark:bg-green-950/10 border-t border-green-100 dark:border-green-900/30 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">No se requiere producción: Todo disponible en bodega</p>
                                </div>
                              );

                              return (
                                <div className="px-5 py-4 bg-blue-50/20 dark:bg-slate-800/10 border-t border-gray-100 dark:border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Insumos para Producción </h3>
                                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">(Calculados según requerimiento por docena en catálogo)</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase">Faltan {totalToProduce} pares</span>
                                  </div>

                                  {!productSuppliesData ? (
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 italic">Cargando métricas de materiales...</p>
                                  ) : productSuppliesData.supplies.length === 0 ? (
                                    <p className="text-[10px] font-bold text-orange-500 dark:text-orange-400 italic">Este producto no tiene insumos vinculados para calcular métricas.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {productSuppliesData.supplies.map(s => {
                                    const neededMissing = totalToProduce * s.quantity_required;
                                    const neededTotal = totalProductPairs * s.quantity_required;
                                    const hasStockMissing = s.stock_quantity >= neededMissing;
                                    const hasStockTotal = s.stock_quantity >= neededTotal;
                                    
                                    const fmt = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(2);

                                    return (
                                      <div key={s.supply_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-900/40">
                                        <div className="mb-2 sm:mb-0">
                                          <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 truncate leading-tight">{s.supply_name}</p>
                                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{s.supply_category || 'General'}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-gray-400">Stock:</span>
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{fmt(s.stock_quantity)}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-6 border-t sm:border-t-0 sm:border-l border-gray-50 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-6">
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Para Faltantes ({totalToProduce}p)</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className={`text-[10px] font-black ${hasStockMissing ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                                                {fmt(neededMissing)}
                                              </span>
                                              {hasStockMissing ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                            </div>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Para Total ({totalProductPairs}p)</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className={`text-[10px] font-black ${hasStockTotal ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                                                {fmt(neededTotal)}
                                              </span>
                                              {hasStockTotal ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                            })()}
                          </>
                        )}
                      </div>
                    );
                })}
              </div>
            );
          })()}
        </div>

        {/* Modal Inicio Producción: Hoja de Producción Pro */}
        {productionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-all duration-500 flex flex-col ${productionStep === 1 ? 'max-w-xl w-full' : 'max-w-4xl w-full max-h-[90vh]'}`}>
              
              {/* Header Modal */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        <span className="flex items-center gap-2">
                          VALE <span className="text-red-600 text-[16px] font-black">
                            Nº {(() => {
                              if (!Array.isArray(currentTasks) || (loadingTasks && currentTasks.length === 0)) return '⏳';
                              // Buscar el número de vale más reciente de estas tareas
                              const fromTasks = currentTasks.filter(t => t?.vale_number).sort((a,b) => b.vale_number - a.vale_number)[0]?.vale_number;
                              if (fromTasks) return fromTasks;
                              // Fallback a nextValeNumber si es realmente una carga nueva
                              if (nextValeNumber) return nextValeNumber;
                              return 'TBD';
                            })()}
                          </span>
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       {productionModal?.productName} 
                       <span className="w-1 h-1 bg-gray-300 rounded-full" />
                       {(() => {
                         const check = orderSupplies[productionModal?.productId];
                         const allOk = check?.all_supplies_available;
                         return (
                           <span className={allOk ? 'text-green-600' : 'text-amber-600'}>
                             {allOk ? '✅ Insumos Completos' : '⚠️ Insumos Faltantes'}
                           </span>
                         );
                       })()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setProductionModal(null)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-red-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido Modal */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {productionStep === 1 ? (
                  /* PASO 1: Selección de Opción y Visualización de Tallas */
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase">¿Qué deseas fabricar hoy?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona la cantidad de pares para iniciar el lote de trabajo</p>
                    </div>

                    {(productionModal?.missingCount ?? 0) === (productionModal?.totalCount ?? 0) ? (
                      <div className="grid grid-cols-1 gap-6">
                        <div className="relative group p-6 rounded-[2rem] border-2 border-orange-500 bg-orange-50/30 ring-4 ring-orange-500/10 cursor-pointer">
                          <div className="flex flex-col items-center justify-center mb-4 text-center space-y-2">
                            <span className="text-lg font-black text-orange-600 uppercase">⚠️ PRODUCCIÓN COMPLETA REQUERIDA</span>
                            <span className="text-xs font-bold text-gray-500">No hay unidades disponibles en bodega para este producto.</span>
                          </div>
                          <div className="flex justify-center mb-4">
                            <span className="px-6 py-2 bg-orange-500 text-white text-sm font-black rounded-full shadow-lg shadow-orange-500/20">{productionModal?.totalCount || 0} PARES TOTALES</span>
                          </div>

                          <div className="overflow-x-auto bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-2">
                            <table className="w-full text-[10px] font-bold">
                              <thead>
                                <tr className="text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800">
                                  <th className="p-2 text-left">Talla</th>
                                  {[...order.details.filter(d => d.product_id === productionModal?.productId)].sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0')).map(d => (
                                    <th key={d.size} className="p-2 text-center border-l border-gray-50 dark:border-slate-800">{d.size}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-gray-700 dark:text-gray-300">
                                  <td className="p-2 uppercase tracking-tighter text-orange-600">Fabricar</td>
                                  {[...order.details.filter(d => d.product_id === productionModal?.productId)].sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0')).map(d => (
                                    <td key={d.size} className="p-2 text-center border-l border-gray-50 dark:border-slate-800 font-black">{d.amount}</td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* Opción A: Faltantes */}
                      <div className={`relative group p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedOption === 'A' ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10' : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}
                           onClick={() => setSelectedOption('A')}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === 'A' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                              {selectedOption === 'A' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-lg font-black text-gray-900 dark:text-white uppercase">Opción A: Solo Faltantes</span>
                          </div>
                          <span className="px-4 py-1.5 bg-blue-600 text-white text-xs font-black rounded-full shadow-lg shadow-blue-600/20">{productionModal?.missingCount || 0} PARES</span>
                        </div>

                        {/* Tabla resumida de tallas faltantes */}
                        <div className="overflow-x-auto bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-2">
                          <table className="w-full text-[10px] font-bold">
                            <thead>
                              <tr className="text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800">
                                <th className="p-2 text-left">Talla</th>
                                {[...order.details
                                  .filter(d => d.product_id === productionModal?.productId)]
                                  .sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0'))
                                  .map(d => (
                                    <th key={d.size} className="p-2 text-center border-l border-gray-50 dark:border-slate-800">{d.size}</th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-blue-600 dark:text-blue-400">
                                <td className="p-2 uppercase tracking-tighter">Faltante</td>
                                {[...order.details
                                  .filter(d => d.product_id === productionModal?.productId)]
                                  .sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0'))
                                  .map(d => {
                                    const stockSize = d.stock_available || 0;
                                    const missing = Math.max(0, d.amount - stockSize);
                                    return (
                                      <td key={d.size} className="p-2 text-center border-l border-gray-50 dark:border-slate-800 font-black">{missing}</td>
                                    );
                                  })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Opción B: Lote Completo */}
                      <div className={`relative group p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedOption === 'B' ? 'border-orange-500 bg-orange-50/30 ring-4 ring-orange-500/10' : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}
                           onClick={() => setSelectedOption('B')}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === 'B' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                              {selectedOption === 'B' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-lg font-black text-gray-900 dark:text-white uppercase">Opción B: Lote Completo</span>
                          </div>
                          <span className="px-4 py-1.5 bg-orange-500 text-white text-xs font-black rounded-full shadow-lg shadow-orange-500/20">{productionModal?.totalCount || 0} PARES</span>
                        </div>

                        {/* Tabla resumida de tallas originales */}
                        <div className="overflow-x-auto bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-2">
                          <table className="w-full text-[10px] font-bold">
                            {(() => {
                              const details = [...order.details.filter(d => d.product_id === productionModal?.productId)].sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0'));
                              
                              return (
                                <>
                                  <thead>
                                    <tr className="text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800">
                                      <th className="p-2 text-left">Talla</th>
                                      {details.map(d => (
                                        <th key={d.id} className="p-2 text-center border-l border-gray-50 dark:border-slate-800">{d.size}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="text-gray-700 dark:text-gray-300">
                                      <td className="p-2 uppercase tracking-tighter text-orange-600">Original</td>
                                      {details.map(d => (
                                        <td key={d.id} className="p-2 text-center border-l border-gray-50 dark:border-slate-800 font-black">{d.amount}</td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </>
                              );
                            })()}
                          </table>
                        </div>
                      </div>
                    </div>
                    )}

                    <button 
                      onClick={() => setProductionStep(2)}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                    >
                      Configurar Personal y Tareas <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ) : (
                  /* PASO 2: Hoja de Producción Pro */
                  <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                    
                    {/* Encabezado de la Hoja */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm gap-6">
                      <div className="flex items-center gap-6">
                        <img src="/logo.png" alt="Logo Fábrica" className="w-16 h-16 object-contain drop-shadow-md" />
                        <div className="h-10 w-[2px] bg-gray-100 dark:bg-slate-800 hidden sm:block" />
                        <div>
                          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">CALZADO J&R</h1>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mt-1">SISTEMA DE PRODUCCIÓN</p>
                        </div>
                      </div>
                      <div className="flex gap-8 text-right">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vale Nº</p>
                          <p className="text-lg font-black text-red-600">
                            {currentTasks && currentTasks.length > 0 && currentTasks[0].vale_number
                              ? `# ${currentTasks[0].vale_number}`
                              : (nextValeNumber ? `# ${nextValeNumber}` : '# ⏳')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</p>
                          <p className="text-lg font-black text-gray-800 dark:text-gray-200">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de Producto y Cliente */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-6">
                        <button 
                          onClick={() => {
                            const url = order.details.find(d => d.product_id === productionModal?.productId)?.image_url;
                            if (url != null) {
                              setViewingProductName(productionModal?.productName);
                              setViewingImage(resolveImageUrl(url) ?? null);
                            }
                          }}
                          className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-inner flex-shrink-0 relative group"
                        >
                           <img src={resolveImageUrl(order.details.find(d => d.product_id === productionModal?.productId)?.image_url)} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                alt="Producto" 
                                onError={(e) => {
                                  const url = (e.target as HTMLImageElement).src;
                                  handleImageError(url);
                                }}
                            />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-6 h-6 text-white" />
                           </div>
                        </button>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Detalle del Pedido</p>
                          <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{productionModal?.productName}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                             <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Cliente: <span className="text-gray-900 dark:text-white uppercase">{order.customer_name} {order.customer_last_name}</span></p>
                             <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Color: <span className="text-gray-900 dark:text-white uppercase">{order.details.find(d => d.product_id === productionModal?.productId)?.colour || 'N/A'}</span></p>
                             <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Cantidad: <span className="text-blue-600 dark:text-blue-400">{productionModal?.totalCount || 0} pares</span></p>
                          </div>
                          {/* Observations display */}
                          {(() => {
                            const obs = (order.details.find(d => d.product_id === productionModal?.productId) as any)?.observations;
                            if (!obs) return null;
                            return (
                              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">Observaciones:</p>
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{obs}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                    </div>

                    {/* Tabla de Tallas Solicitadas (Numeración en 2 Filas) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                       <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-2 border-b border-gray-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Numeración y Cantidades</span>
                       </div>
                       <div className="overflow-x-auto">
                         <table className="w-full">
                           <tbody>
                             {/* Mostrar cada línea de details tal cual, sin agrupar */}
                             {(() => {
                               const details = [...order.details
                                 .filter(d => d.product_id === productionModal?.productId)
                                 .filter(d => (selectedOption === 'A' ? Math.max(0, d.amount - (d.stock_available || 0)) : d.amount) > 0)]
                                 .sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0'));
                               
                               return (
                                 <>
                                   {/* Fila superior: Tallas */}
                                   <tr className="border-b border-gray-50 dark:border-slate-800/50">
                                     <td className="px-4 py-2 bg-gray-50/30 dark:bg-slate-800/20 text-[10px] font-black text-gray-400 uppercase tracking-tighter border-r border-gray-100 dark:border-slate-800">Talla</td>
                                     {details.map(d => (
                                       <td key={`${d.id}`} className="px-4 py-2 text-center text-[11px] font-black text-blue-600 dark:text-blue-400 border-r border-gray-50 dark:border-slate-800 last:border-0">
                                         {d.size}
                                       </td>
                                     ))}
                                   </tr>
                                   {/* Fila inferior: Cantidades */}
                                   <tr>
                                     <td className="px-4 py-2 bg-gray-50/30 dark:bg-slate-800/20 text-[10px] font-black text-gray-400 uppercase tracking-tighter border-r border-gray-100 dark:border-slate-800">Cant.</td>
                                     {details.map(d => {
                                       const qty = selectedOption === 'A' ? Math.max(0, d.amount - (d.stock_available || 0)) : d.amount;
                                       return (
                                         <td key={`${d.id}`} className="px-4 py-2 text-center text-xs font-black text-gray-900 dark:text-white border-r border-gray-50 dark:border-slate-800 last:border-0">
                                           {qty}
                                         </td>
                                       );
                                     })}
                                   </tr>
                                 </>
                               );
                             })()}
                           </tbody>
                         </table>
                       </div>
                    </div>

                    {/* Tarjetas de Tareas de Producción */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Módulos de Producción</h3>
                         <span className="text-[10px] font-bold text-gray-400 italic">Asigna un responsable por cada etapa</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {STAGES_LOGIC.map((stage, idx) => {
                          // Sequential locking logic
                          const prevStage = idx > 0 ? STAGES_LOGIC[idx - 1] : null;
                          const prevTask = prevStage && Array.isArray(currentTasks) ? currentTasks.find(t => t.type === prevStage.key) : null;
                          const isUnreachable = prevStage && (!prevTask || prevTask.status !== 'completado');
                          
                          // Current task info
                          const currentTask = Array.isArray(currentTasks) ? currentTasks.find(t => t.type === stage.key) : null;
                          const isCompleted = currentTask?.status === 'completado';
                          
                          return (
                            <div key={stage.key} className={`p-6 rounded-[2rem] border-2 transition-all shadow-sm ${stage.color} ${isUnreachable ? 'opacity-50 grayscale pointer-events-none bg-gray-100 dark:bg-slate-800' : ''}`}>
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 relative">
                                     <stage.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                     {isUnreachable && (
                                       <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                                         <Ban size={10} />
                                       </div>
                                     )}
                                     {isCompleted && (
                                       <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                                         <CheckCircle size={10} />
                                       </div>
                                     )}
                                   </div>
                                   <div>
                                     <h5 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{stage.label}</h5>
                                     {isUnreachable && <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Bloqueado hasta completar {prevStage?.label}</p>}
                                     {isCompleted && <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Tarea Completada</p>}
                                   </div>
                                 </div>
                                 <span className="text-[9px] font-black px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded uppercase tracking-tighter text-gray-600 dark:text-gray-400">Cargo: {stage.occupation}</span>
                              </div>

                              <div className="space-y-4">
                                {currentTask ? (
                                    <div className="flex flex-col gap-3 p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-black/5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                                          <User size={16} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-0.5">Responsable</p>
                                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none truncate">
                                            {currentTask?.assigned_user_name || 'Asignado'}
                                          </p>
                                        </div>
                                        <div className={`ml-auto px-2 py-0.5 text-[8px] font-black rounded uppercase flex-shrink-0 ${
                                          currentTask.status === 'completado' 
                                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' 
                                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                        }`}>
                                          {currentTask.status === 'completado' ? 'Hecho' : 'Activo'}
                                        </div>
                                      </div>
                                      
                                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                        {(() => {
                                          // Verificar si la siguiente etapa ya fue creada/iniciada
                                          const currentIndex = STAGES_LOGIC.findIndex(s => s.key === stage.key);
                                          const nextIndex = currentIndex + 1;
                                          const nextStage = nextIndex < STAGES_LOGIC.length ? STAGES_LOGIC[nextIndex] : null;
                                          const nextTaskExists = nextStage && Array.isArray(currentTasks) && currentTasks.some(t => t?.type === nextStage.key);
                                          
                                          // Si es EMPLANTILLADO y está completado, mostrar mensaje especial
                                          if (stage.key === 'emplantillado' && currentTask.status === 'completado') {
                                            return (
                                              <div className="w-full text-[11px] font-black uppercase bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg py-3 px-3 flex flex-col items-center justify-center gap-2 text-center">
                                                <CheckCircle2 size={18} />
                                                <span>🎉 Producto Terminado</span>
                                                <span className="text-[9px] font-bold opacity-80 block">Listo para Entrega</span>
                                              </div>
                                            );
                                          }
                                          
                                          // Solo bloquear si la siguiente etapa fue iniciada
                                          if (nextTaskExists) {
                                            return (
                                              <div className="w-full text-[10px] font-black uppercase bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg py-2 px-2 flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                                <CheckCircle2 size={14} />
                                                Completado
                                              </div>
                                            );
                                          }
                                          
                                          // De lo contrario, permitir editar el estado
                                          return (
                                            <select 
                                              value={currentTask.status}
                                              onChange={(e) => handleUpdateTaskStatus(currentTask.id, e.target.value)}
                                              disabled={loadingTasks}
                                              className="w-full text-[10px] font-black uppercase bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 px-2 outline-none cursor-pointer disabled:opacity-50 transition-colors"
                                            >
                                              <option value="en_progreso">En Progreso</option>
                                              <option value="completado">Completado</option>
                                              <option value="cancelado">Cancelado</option>
                                            </select>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                ) : (
                                  <select 
                                    value={assignments[stage.key] || ''}
                                    onChange={(e) => setAssignments(p => ({ ...p, [stage.key]: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                  >
                                    <option value="">Seleccionar Empleado...</option>
                                    {employees.filter(e => e.occupation === stage.occupation).map(emp => (
                                      <option key={emp.id} value={emp.id}>{emp.name} {emp.last_name}</option>
                                    ))}
                                  </select>
                                )}

                                {/* Materiales en esta etapa */}
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Insumos Relacionados</p>
                                  <div className="flex flex-wrap gap-1.5">
                                     {(() => {
                                        const productSupplies = orderSupplies[productionModal?.productId]?.supplies || [];
                                        const stageSupplies = productSupplies.filter(is => getStageByCat(is.supply_category) === stage.key);
                                        
                                        if (stageSupplies.length === 0) return <span className="text-[10px] text-gray-400 italic">No hay insumos específicos</span>;
                                        
                                        return stageSupplies.map(is => (
                                          <span key={is.supply_id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900/50 text-[10px] font-bold text-gray-700 dark:text-gray-300 rounded-lg border border-black/5 dark:border-white/5">
                                            <Package className="w-3 h-3 text-blue-500" />
                                            {is.supply_name}
                                          </span>
                                        ));
                                     })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
                       {/* Mostrar botón "Volver al paso 1" solo si no hay tareas iniciadas */}
                       {(!Array.isArray(currentTasks) || currentTasks.length === 0) && (
                         <button 
                           onClick={() => setProductionStep(1)}
                           className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest px-4 py-2"
                         >
                           <ArrowLeft className="w-4 h-4" /> Volver al paso 1
                         </button>
                       )}

                       {(() => {
                         const next = Array.isArray(currentTasks) ? STAGES_LOGIC.find(s => !currentTasks.some(t => t?.type === s.key)) : null;
                         // Ocultar el botón si no hay siguiente etapa (producción completada)
                         if (!next) return null;
                         
                         return (
                       <button 
                        onClick={async () => {
                          const nextPendingStage = STAGES_LOGIC.find(s => 
                            Array.isArray(currentTasks) && !currentTasks.some(t => t?.type === s.key)
                          );
                          
                          if (!nextPendingStage) return;
                          
                          // Verificar si la etapa anterior está completada
                          const nextIndex = STAGES_LOGIC.findIndex(s => s.key === nextPendingStage.key);
                          if (nextIndex > 0) {
                            const prevStage = STAGES_LOGIC[nextIndex - 1]!;
                            const prevTask = Array.isArray(currentTasks) ? currentTasks.find(t => t?.type === prevStage?.key) : null;
                            if (!prevTask || prevTask.status !== 'completado') {
                              setSuccessToast(`Completar ${prevStage?.label || 'la etapa anterior'} primero`);
                              setTimeout(() => setSuccessToast(null), 3000);
                              return;
                            }
                          }
                          
                          // Si ya hay una asignación manual en curso para esta etapa pero aún no se ha creado la tarea en DB
                          const assignedUser = assignments[nextPendingStage.key];
                          if (!assignedUser && !currentTasks.some(t => t.type === nextPendingStage.key)) {
                            setSuccessToast(`Por favor selecciona un empleado para ${nextPendingStage.label}`);
                            setTimeout(() => setSuccessToast(null), 3000);
                            return;
                          }

                          setLoadingTasks(true);
                          try {
                            await onUpdateItemsStatus(productionModal?.productId, 'en_progreso');
                            
                            const taskData = {
                              product_id: productionModal?.productId,
                              assigned_to: assignedUser || '',
                              type: nextPendingStage.key,
                              description: `Iniciando ${nextPendingStage.label} para ${productionModal?.productName} (Vale #${nextValeNumber || '0'})`,
                              priority: 'media'
                            };

                            await createProductionTasks(order.id, [taskData]);
                            
                            // Auto-marcar la tarea anterior como completada al iniciar la siguiente
                            const nextIndex2 = STAGES_LOGIC.findIndex(s => s.key === nextPendingStage.key);
                            if (nextIndex2 > 0) {
                              const prevStage2 = STAGES_LOGIC[nextIndex2 - 1]!;
                              const prevTask = currentTasks.find(t => t?.type === prevStage2?.key);
                              if (prevTask && prevTask.status !== 'completado') {
                                await updateProductionTaskStatus(prevTask.id, 'completado');
                              }
                            }
                            
                            setSuccessToast(`¡Etapa de ${nextPendingStage.label.toUpperCase()} iniciada!`);
                            setTimeout(() => setSuccessToast(null), 4000);
                            
                            // Refresh tasks usando la instancia configurada (con baseURL y auth)
                            const currentProductId = productionModal?.productId;
                            const allTasks = await getOrderTasks(order.id);
                            const updatedList = allTasks.filter(
                              (t) => t.product_id?.toLowerCase() === currentProductId?.toLowerCase()
                            );
                            setCurrentTasks(updatedList);
                            // Actualizar assignments para reflejar las tareas recién creadas
                            const newAssignments: Record<string, string> = {};
                            updatedList.forEach((t) => {
                              if (t?.type) newAssignments[t.type] = t.assigned_to || '';
                            });
                            setAssignments(newAssignments);
                            setProductionStep(2);
                          } catch (e) {
                            console.error(e);
                            setSuccessToast('Error al crear la tarea de producción');
                            setTimeout(() => setSuccessToast(null), 4000);
                          } finally {
                            setLoadingTasks(false);
                          }
                        }}
                        disabled={(() => {
                          const next = Array.isArray(currentTasks) ? STAGES_LOGIC.find(s => !currentTasks.some(t => t?.type === s.key)) : null;
                          if (!next) return false;
                          
                          // Checkear si hay empleado seleccionado
                          const hasAssignedEmployee = !!assignments[next.key];
                          
                          const nextIndex3 = STAGES_LOGIC.findIndex(s => s.key === next.key);
                          if (nextIndex3 > 0) {
                            const prevStage3 = STAGES_LOGIC[nextIndex3 - 1]!;
                            const prevTask = Array.isArray(currentTasks) ? currentTasks.find(t => t?.type === prevStage3?.key) : null;
                            // Deshabilitar si no hay empleado O si la tarea anterior no está completada
                            return !hasAssignedEmployee || !prevTask || prevTask.status !== 'completado';
                          }
                          return !hasAssignedEmployee;
                        })() || loadingTasks}
                        className={`px-10 py-5 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                          (() => {
                            const next = Array.isArray(currentTasks) ? STAGES_LOGIC.find(s => !currentTasks.some(t => t?.type === s.key)) : null;
                            if (!next) return 'bg-green-600 hover:bg-green-700 shadow-green-600/20';
                            
                            // Checkear si hay empleado seleccionado
                            const hasAssignedEmployee = !!assignments[next.key];
                            
                            const nextIndex4 = STAGES_LOGIC.findIndex(s => s.key === next.key);
                            if (nextIndex4 > 0) {
                              const prevStage4 = STAGES_LOGIC[nextIndex4 - 1]!;
                              const prevTask = Array.isArray(currentTasks) ? currentTasks.find(t => t?.type === prevStage4?.key) : null;
                              
                              // Si no hay empleado seleccionado, gris
                              if (!hasAssignedEmployee) {
                                return 'bg-gray-400 cursor-not-allowed opacity-60';
                              }
                              
                              // Si la tarea anterior no está completada, gris
                              if (!prevTask || prevTask.status !== 'completado') {
                                return 'bg-gray-400 cursor-not-allowed opacity-60';
                              }
                            }
                            return 'bg-green-600 hover:bg-green-700 shadow-green-600/20';
                          })()
                        }`}
                      >
                        {(() => {
                           if (loadingTasks) return 'PROCESANDO...';
                           if (!Array.isArray(currentTasks)) return 'INICIALIZANDO...';
                           const next = STAGES_LOGIC.find(s => !currentTasks.some(t => t?.type === s.key));
                           return next ? `CONFIRMAR E INICIAR ${next.label}` : 'PRODUCCIÓN COMPLETADA';
                         })()}
                         <PlayCircle className="w-5 h-5" />
                      </button>
                         );
                       })()}
                    </div>

                  </div>
                )}

              </div>
              
              {/* Footer info motivacional (sólo en paso 1) */}
              {productionStep === 1 && (
                <div className="px-8 py-4 bg-gray-50 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    Recuerda revisar el stock de insumos antes de confirmar la asignación de personal.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Columna derecha: info cliente + acciones */}
        <div className="space-y-4">

          {/* Card del cliente */}
          <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-all duration-300">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Información del Cliente
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                    {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 transition-colors">
                    {order.customer_name && order.customer_last_name
                      ? `${order.customer_name} ${order.customer_last_name}`
                      : 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{order.customer_id.substring(0, 16)}...</p>
                </div>
              </div>
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{order.customer_email}</span>
                </a>
              )}
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {order.customer_phone}
                </a>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-all duration-300">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Acciones</h2>

            <div className="space-y-2.5">
              {/* Agregar Producto al Pedido */}
              {order.state !== 'entregado' && order.state !== 'cancelado' && (
                <button
                  onClick={() => setIsEditModalOpen(undefined)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              )}
              {/* Despachar directamente si hay stock total (SOLO para pendientes SIN fabricación) */}
              {canCompleteFromStock && (
                <button
                  onClick={() => onStatusChange(order.id, 'completado')}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold flex items-center justify-center gap-2 text-sm shadow-md border border-green-500"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Completar desde Inventario
                </button>
              )}



              {/* Cancelar Pedido */}
              {canCancel && !confirmCancel && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2.5 border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar Pedido
                </button>
              )}
              {canCancel && confirmCancel && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-sm">
                  <p className="text-red-800 dark:text-red-300 font-medium mb-2">¿Confirmas la cancelación?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onStatusChange(order.id, 'cancelado'); setConfirmCancel(false); }}
                      disabled={isUpdating}
                      className="flex-1 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 font-medium text-xs"
                    >
                      Sí, cancelar
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="flex-1 py-1.5 border border-gray-300 dark:border-slate-600 rounded hover:bg-white dark:hover:bg-slate-700 dark:text-gray-300 font-medium text-xs transition-colors"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Restaurar Pedido (solo si está cancelado) */}
              {canRestore && (
                <button
                  onClick={() => onStatusChange(order.id, 'pendiente')}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-bold flex items-center justify-center gap-2 text-sm shadow-md border border-indigo-500"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Restaurar Pedido
                </button>
              )}

              {/* Eliminar Pedido (solo si está cancelado) */}
              {canDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 border border-red-400 text-red-700 bg-red-100/50 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar Pedido
                </button>
              )}
              {canDelete && confirmDelete && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm">
                  <p className="text-red-800 font-semibold mb-1">¿Eliminar permanentemente?</p>
                  <p className="text-red-600 text-xs mb-3">Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDelete(order.id)}
                      disabled={isUpdating}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium text-xs"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 border border-gray-300 rounded hover:bg-white font-medium text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Contactar Cliente */}
              <button
                onClick={onContactClient}
                className="w-full py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-bold flex items-center justify-center gap-2 text-sm transition-all"
              >
                <Mail className="w-4 h-4" />
                Contactar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal visor de imagen */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage}
        productName={viewingProductName}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────

export default function OrdersPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [orderSupplies, setOrderSupplies] = useState<Record<string, ProductSuppliesCheckResponse>>({});
  const [productionModal, setProductionModal] = useState<{
    productId: string;
    productName: string;
    missingCount: number;
    totalCount: number;
    forceProgress?: boolean;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalByStatus, setTotalByStatus] = useState<Record<OrderStatus, number>>({
    pendiente: 0, en_progreso: 0, completado: 0, entregado: 0, cancelado: 0,
  });

  const calculateTotals = useCallback(async () => {
    try {
      const statuses: OrderStatus[] = ['pendiente', 'en_progreso', 'completado', 'entregado', 'cancelado'];
      const totals: Record<OrderStatus, number> = { pendiente: 0, en_progreso: 0, completado: 0, entregado: 0, cancelado: 0 };
      await Promise.all(
        statuses.map(async (s) => {
          const r = await getOrders(1, 1, s);
          totals[s] = r.total;
        })
      );
      setTotalByStatus(totals);
    } catch { /* silencioso */ }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders(page, 10, statusFilter, clientFilter || undefined);
      setOrders(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setError('No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, clientFilter]);

  const [searchParams] = useSearchParams();
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => { loadOrders(); calculateTotals(); }, [loadOrders, calculateTotals]);

  // Lógica de auto-apertura desde parámentros de URL
  useEffect(() => {
    if (!loading && orders.length > 0 && !autoOpened) {
      const orderId = searchParams.get('order');
      const productId = searchParams.get('product');
      if (orderId) {
        // Encontrar el pedido (o forzar carga si no está en la página actual)
        const order = orders.find(o => o.id === orderId);
        if (order) {
          handleSelectOrder(order).then(() => {
            if (productId) {
              // Si hay producto, intentamos abrir el modal de producción directamente
              // Necesitamos esperar a que selectedOrder se actualice (esto es asíncrono)
            }
          });
          setAutoOpened(true);
        }
      }
    }
  }, [orders, loading, searchParams, autoOpened]);

  // Segunda fase de auto-apertura: Abrir el modal de producción una vez cargado el detalle
  useEffect(() => {
    if (autoOpened && selectedOrder) {
      const productId = searchParams.get('product');
      if (productId && selectedOrder) {
        const item = selectedOrder.details.find(d => d.product_id === productId);
        if (item) {
          // Calcular el total de pares para este producto sumando todos los detalles
          const totalProductPairsForProduct = selectedOrder.details
            .filter(d => d.product_id === productId)
            .reduce((sum, d) => sum + d.amount, 0);
          
          // Abrir el modal de producción para este producto
          setProductionModal({
            productId: item.product_id,
            productName: item.product_name || 'Producto',
            missingCount: 0,
            totalCount: totalProductPairsForProduct,
            forceProgress: true
          });
          // Limpiar parámetros para evitar reaperturas infinitas
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [selectedOrder, autoOpened, searchParams]);

  const handleSelectOrder = async (orderOrId: Order | string) => {
    const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId.id;
    setDetailLoading(true);
    try {
      const detail = await getOrderDetail(orderId);
      setSelectedOrder(detail);

      // Cargar insumos para los productos del pedido
      const productIds = Array.from(new Set(detail.details.map(d => d.product_id)));
      const suppliesMap: Record<string, ProductSuppliesCheckResponse> = {};
      
      await Promise.all(productIds.map(async (id) => {
        try {
          const res = await checkProductSupplies(id);
          suppliesMap[id] = res;
        } catch (err) {
          console.error('Error cargando insumos para producto:', id, err);
        }
      }));
      setOrderSupplies(suppliesMap);

      setView('detail');
    } catch {
      setError('No se pudo cargar el detalle del pedido.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateItemsStatus = async (productId: string, newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    setError(null);
    try {
      const updatedDetails = selectedOrder.details.map(item => {
        if (item.product_id === productId) {
          return { ...item, state: newStatus };
        }
        return item;
      });

      // El backend calcula el estado global automáticamente al actualizar detalles
      await updateOrderDetails(selectedOrder.id, {
        delivery_date: selectedOrder.delivery_date,
        details: updatedDetails.map(d => ({
          product_id: d.product_id,
          size: d.size,
          colour: d.colour,
          amount: d.amount,
          state: d.state
        } as any))
      });

      // Pequeño delay para asegurar que el backend procesó
      await new Promise(resolve => setTimeout(resolve, 300));

      // Refrescar la orden completa para obtener el estado global actualizado
      const refreshed = await getOrderDetail(selectedOrder.id);
      setSelectedOrder(refreshed);
      setOrders(prev => prev.map(o => o.id === refreshed.id ? { ...o, state: refreshed.state } : o));
    } catch (err: unknown) {
      console.error('Error actualizando estados:', err);
      // Extraer mensaje de error específico del backend
      const errorMsg = (err as any)?.response?.data?.detail || (err as any)?.message || 'Error desconocido al actualizar estados';
      setError(`No se pudo actualizar el estado: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    setError(null);
    try {
      // El backend automáticamente actualiza todos los detalles a 'entregado' cuando la orden se entrega
      await updateOrderStatus(orderId, { state: newStatus });
      
      // Refrescar la orden completa para obtener estado actualizado de orden y detalles
      const updated = await getOrderDetail(orderId);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, state: newStatus } : o));
      await calculateTotals();
    } catch (err: unknown) {
      // @ts-expect-error err has response from axios
      const msg = err.response?.data?.detail || 'Error al actualizar el estado del pedido.';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsUpdating(true);
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setView('list');
      setSelectedOrder(null);
      await calculateTotals();
    } catch {
      setError('Error al eliminar el pedido.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Cargando detalle...</p>
      </div>
    );
  }

  if (view === 'detail' && selectedOrder) {
    return (
      <>
        <OrderDetailView
          order={selectedOrder}
          isUpdating={isUpdating}
          onBack={() => { setView('list'); setSelectedOrder(null); setError(null); }}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteOrder}
          onContactClient={() => setIsContactModalOpen(true)}
          onUpdateItemsStatus={handleUpdateItemsStatus}
          orderSupplies={orderSupplies}
          productionModal={productionModal}
          setProductionModal={setProductionModal}
          onOrderUpdate={setSelectedOrder}
          error={error}
          setIsEditModalOpen={(productId?: string) => {
            setEditingProductId(productId);
            setIsEditModalOpen(true);
          }}
        />
        <OrderFormModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingProductId(undefined); }}
          editOrder={selectedOrder}
          editProductId={editingProductId}
          onSuccess={async () => {
            setIsEditModalOpen(false);
            try {
              const refreshed = await getOrderDetail(selectedOrder.id);
              setSelectedOrder(refreshed);
              setOrders((prev) => prev.map((o) => o.id === refreshed.id ? { ...o, total_pairs: refreshed.total_pairs } : o));
              await calculateTotals();
            } catch { /* silently ignore */ }
          }}
        />
        <ContactClientModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          clientName={`${selectedOrder.customer_name || ''} ${selectedOrder.customer_last_name || ''}`.trim()}
          clientEmail={selectedOrder.customer_email}
          clientPhone={selectedOrder.customer_phone}
          orderId={selectedOrder.id}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <ShoppingCart className="w-8 h-8 text-red-600 dark:text-red-500" />
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 transition-colors">
            Administra todos los pedidos mayoristas • {total} en total
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <SummaryCards totals={totalByStatus} />

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-stretch md:items-end shadow-sm transition-all duration-300">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            <Search className="w-4 h-4 inline mr-1 text-blue-500" />
            Buscar cliente
          </label>
          <input
            type="text"
            placeholder="Nombre del cliente..."
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            <Filter className="w-4 h-4 inline mr-1 text-blue-500" />
            Estado
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) => { setStatusFilter((e.target.value as OrderStatus) || null); setPage(1); }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Producción</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => loadOrders()}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={() => { setClientFilter(''); setStatusFilter(null); setPage(1); }}
            className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Eraser className="w-4 h-4" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-20 text-center shadow-sm flex flex-col items-center gap-4 transition-all">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
            <Package size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-bold text-lg">No se encontraron pedidos</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Prueba ajustando los filtros de búsqueda o el rango de fechas</p>
          </div>
          <button 
            onClick={() => { setClientFilter(''); setStatusFilter(null); loadOrders(); }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Ver todos los pedidos
          </button>
        </div>
      ) : (
        <>
          <OrdersTable orders={orders} onSelect={handleSelectOrder} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => { loadOrders(); calculateTotals(); }}
      />
    </div>
  );
}
