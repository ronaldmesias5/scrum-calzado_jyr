/**
 * Módulo: OrdersPage.tsx
 * Descripción: Página de gestión de pedidos mayoristas del dashboard.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Package, Filter, Search, Loader2, AlertCircle, Clock,
  Zap, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowRight, Mail, Phone, User, Plus, ArrowLeft,
  PlayCircle, Pencil, Ban, RefreshCw, Trash2
} from 'lucide-react';
import {
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  deleteOrder,
  type Order,
  type OrderDetail,
  type OrderStatus,
} from '../services/ordersApi';
import OrderFormModal from '../components/OrderFormModal';
import ContactClientModal from '../components/ContactClientModal';
import StatCard from '../components/StatCard';
import ImageViewerModal from '../components/ImageViewerModal';
import { resolveImageUrl } from '../services/catalogService';

// ─────────────────────────────────────────
// Helpers de estado
// ─────────────────────────────────────────

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pendiente': return <Clock className="w-4 h-4" />;
    case 'en_progreso': return <Zap className="w-4 h-4" />;
    case 'completado': return <CheckCircle className="w-4 h-4" />;
    case 'cancelado': return <XCircle className="w-4 h-4" />;
    default: return null;
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    pendiente:   { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
    en_progreso: { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'En Producción' },
    completado:  { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Completado' },
    cancelado:   { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Cancelado' },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>
      <StatusIcon status={status} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────
// Cards de resumen
// ─────────────────────────────────────────

function SummaryCards({ totals }: { totals: Record<OrderStatus, number> }) {
  const items: Array<{ status: OrderStatus; color: 'yellow' | 'blue' | 'green' | 'red'; label: string; icon: React.ReactNode }> = [
    { status: 'pendiente',   color: 'yellow', label: 'Pendiente', icon: <Clock size={24} /> },
    { status: 'en_progreso', color: 'blue',   label: 'En Producción', icon: <Zap size={24} /> },
    { status: 'completado',  color: 'green',  label: 'Completado', icon: <CheckCircle size={24} /> },
    { status: 'cancelado',   color: 'red',    label: 'Cancelado', icon: <XCircle size={24} /> },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No hay pedidos que mostrar</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">ID Pedido</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Cliente</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">Pares</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                #{order.id.substring(0, 8)}
              </td>
              <td className="px-6 py-4 text-gray-900">
                {order.customer_name && order.customer_last_name
                  ? `${order.customer_name} ${order.customer_last_name}`
                  : <span className="text-gray-400 font-mono text-xs">{order.customer_id.substring(0, 12)}...</span>}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {order.total_pairs} pares
                </span>
              </td>
              <td className="px-6 py-4"><StatusBadge status={order.state} /></td>
              <td className="px-6 py-4 text-gray-600 text-xs">
                {new Date(order.created_at).toLocaleDateString('es-CO')}
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => onSelect(order)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  onEdit,
  onContactClient,
}: {
  order: OrderDetail;
  isUpdating: boolean;
  onBack: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onDelete: (orderId: string) => void;
  onEdit: () => void;
  onContactClient: () => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingProductName, setViewingProductName] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const canStartProduction = order.state === 'pendiente';
  const canComplete        = order.state === 'en_progreso';
  const canCancel          = order.state !== 'cancelado' && order.state !== 'completado';
  const canDelete          = order.state === 'cancelado';
  const canEdit            = order.state === 'pendiente' || order.state === 'en_progreso';
  const isEverythingInStock = order.details.length > 0 && order.details.every(d => (d.stock_available ?? 0) >= d.amount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido <span className="font-mono text-blue-600">#{order.id.substring(0, 8)}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Creado el {new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <StatusBadge status={order.state} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: información del pedido + tabla de productos */}
        <div className="lg:col-span-2 space-y-6">

          {/* Resumen */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Información del Pedido</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">ID Pedido</p>
                <p className="font-mono font-bold text-gray-900">#{order.id.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Total de Pares</p>
                <p className="font-bold text-gray-900 text-lg">{order.total_pairs}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Estado</p>
                <StatusBadge status={order.state} />
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Entrega Estimada</p>
                <p className="font-medium text-gray-900">
                  {order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString('es-CO')
                    : <span className="text-gray-400">No definida</span>}
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
                <h2 className="text-base font-bold text-gray-900">
                  Productos del Pedido
                  <span className="ml-2 text-sm font-normal text-gray-500">
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
                    const allAvailable = lines.every(l => (l.stock_available ?? 0) >= l.amount);

                    return (
                      <div key={productId} className={`bg-white border rounded-xl overflow-hidden ${allAvailable ? 'border-green-200' : 'border-gray-200'}`}>
                        <div className={`${allAvailable ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-200'} border-b px-5 py-4 flex items-center justify-between`}>
                          <div className="flex items-center gap-4 min-w-0">
                            {productImageUrl && !failedImages.has(productImageUrl) ? (
                              <button
                                onClick={() => { setViewingImage(productImageUrl); setViewingProductName(productName); }}
                                style={{
                                  width: '140px',
                                  height: '140px',
                                  border: `1px solid ${allAvailable ? '#bbf7d0' : '#d1d5db'}`,
                                  borderRadius: '8px',
                                  padding: '0',
                                  overflow: 'hidden',
                                  backgroundColor: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
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
                              <div style={{
                                width: '140px',
                                height: '140px',
                                border: `1px solid ${allAvailable ? '#bbf7d0' : '#d1d5db'}`,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                flexShrink: 0,
                              }}>
                                <Package className={`w-10 h-10 ${allAvailable ? 'text-green-300' : 'text-gray-300'}`} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-lg">{productName}</p>
                                {allAvailable && (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">
                                    <CheckCircle size={10} />
                                    Todo en Bodega
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {[brandName, styleName, categoryName].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap">
                              {totalProductPairs} pares pedidos
                            </span>
                          </div>
                        </div>
                        {/* Tallas y cantidades */}
                        <div className="p-5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {lines.map((line) => {
                              const hasStock = (line.stock_available ?? 0) >= line.amount;
                              const stockColor = hasStock ? 'text-green-600' : (line.stock_available ?? 0) > 0 ? 'text-orange-500' : 'text-red-500';
                              const bgColor = hasStock ? 'bg-green-50/30' : 'bg-gray-50';
                              const borderColor = hasStock ? 'border-green-100' : 'border-gray-200';

                              return (
                                <div key={line.id} className={`flex flex-col gap-1 border rounded-lg px-3 py-2 ${bgColor} ${borderColor}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500">Talla {line.size}</span>
                                    <span className="text-sm font-bold text-gray-900">{line.amount} pares</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-gray-100 mt-1 pt-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-medium">En Bodega:</span>
                                    <span className={`text-xs font-bold ${stockColor}`}>
                                      {Math.floor(line.stock_available ?? 0)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            );
          })()}
        </div>

        {/* Columna derecha: info cliente + acciones */}
        <div className="space-y-4">

          {/* Card del cliente */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Información del Cliente
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">
                    {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.customer_name && order.customer_last_name
                      ? `${order.customer_name} ${order.customer_last_name}`
                      : 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{order.customer_id.substring(0, 16)}...</p>
                </div>
              </div>
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{order.customer_email}</span>
                </a>
              )}
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {order.customer_phone}
                </a>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Acciones</h2>

            {/* Estado actual visible dentro del card */}
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500">Estado actual:</span>
              <StatusBadge status={order.state} />
            </div>

            <div className="space-y-2.5">
              {/* Despachar directamente si hay stock total */}
              {canStartProduction && isEverythingInStock && (
                <button
                  onClick={() => onStatusChange(order.id, 'completado')}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold flex items-center justify-center gap-2 text-sm shadow-md border border-green-500"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Completar desde Inventario
                </button>
              )}

              {/* Iniciar Producción */}
              {canStartProduction && (
                <button
                  onClick={() => onStatusChange(order.id, 'en_progreso')}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Iniciar Producción
                </button>
              )}

              {/* Completar pedido */}
              {canComplete && (
                <button
                  onClick={() => onStatusChange(order.id, 'completado')}
                  disabled={isUpdating}
                  className="w-full py-2.5 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Marcar como Entregado
                </button>
              )}

              {/* Editar Pedido */}
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Editar Pedido
                </button>
              )}

              {/* Cancelar Pedido */}
              {canCancel && !confirmCancel && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar Pedido
                </button>
              )}
              {canCancel && confirmCancel && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <p className="text-red-800 font-medium mb-2">¿Confirmas la cancelación?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onStatusChange(order.id, 'cancelado'); setConfirmCancel(false); }}
                      disabled={isUpdating}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium text-xs"
                    >
                      Sí, cancelar
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="flex-1 py-1.5 border border-gray-300 rounded hover:bg-white font-medium text-xs"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Eliminar Pedido (solo si está cancelado) */}
              {canDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 border border-red-400 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
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
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalByStatus, setTotalByStatus] = useState<Record<OrderStatus, number>>({
    pendiente: 0, en_progreso: 0, completado: 0, cancelado: 0,
  });

  const calculateTotals = useCallback(async () => {
    try {
      const statuses: OrderStatus[] = ['pendiente', 'en_progreso', 'completado', 'cancelado'];
      const totals: Record<OrderStatus, number> = { pendiente: 0, en_progreso: 0, completado: 0, cancelado: 0 };
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

  useEffect(() => { loadOrders(); calculateTotals(); }, [loadOrders, calculateTotals]);

  const handleSelectOrder = async (order: Order) => {
    setDetailLoading(true);
    try {
      const detail = await getOrderDetail(order.id);
      setSelectedOrder(detail);
      setView('detail');
    } catch {
      setError('No se pudo cargar el detalle del pedido.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(orderId, { state: newStatus });
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, state: newStatus } : o));
      await calculateTotals();
    } catch {
      setError('Error al actualizar el estado del pedido.');
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
          onBack={() => { setView('list'); setSelectedOrder(null); }}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteOrder}
          onEdit={() => setIsEditModalOpen(true)}
          onContactClient={() => setIsContactModalOpen(true)}
        />
        <OrderFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editOrder={selectedOrder}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-red-600" />
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Administra todos los pedidos mayoristas • {total} en total
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <SummaryCards totals={totalByStatus} />

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Search className="w-4 h-4 inline mr-1" />
            Buscar cliente
          </label>
          <input
            type="text"
            placeholder="Nombre del cliente..."
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Filter className="w-4 h-4 inline mr-1" />
            Estado
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) => { setStatusFilter((e.target.value as OrderStatus) || null); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Producción</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <button
          onClick={() => loadOrders()}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Cargando pedidos...</p>
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
