/**
 * Página: ClientPricesPage.tsx
 * Descripción: Gestión de precios personalizados por cliente.
 * Flujo: Seleccionar cliente → ver catálogo con filtros e imagen → asignar/editar/eliminar precio.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Users,
  Package,
  X,
  Filter
} from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';
import {
  listClientPrices,
  createOrUpdateClientPrice,
  updateClientPrice,
  deleteClientPrice,
  type ClientPrice
} from '@/services/clientPricesApi';
import { getAllUsers } from '@/services/adminApi';
import type { UserResponse } from '@/types/auth';
import { listProducts, resolveImageUrl, type Product } from '@/services/catalogService';

export default function ClientPricesPage() {
  const { showToast } = useToast();

  // Data
  const [clients, setClients] = useState<UserResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<ClientPrice[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterColor, setFilterColor] = useState('');

  // Image lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ClientPrice | null>(null);
  const [formProductId, setFormProductId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deletingPrice, setDeletingPrice] = useState<ClientPrice | null>(null);

  // Unique values for filter dropdowns
  const uniqueBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand_name).filter(Boolean))].sort(),
    [products]
  );
  const uniqueStyles = useMemo(
    () => [...new Set(products.map((p) => p.style_name).filter(Boolean))].sort(),
    [products]
  );
  const uniqueCategories = useMemo(
    () => [...new Set(products.map((p) => p.category_name).filter(Boolean))].sort(),
    [products]
  );
  const uniqueColors = useMemo(
    () => [...new Set(products.map((p) => p.color).filter(Boolean))].sort(),
    [products]
  );

  const fetchClients = useCallback(async () => {
    try {
      const data = await getAllUsers('client');
      setClients(data);
    } catch {
      console.error('Error loading clients');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await listProducts();
      setProducts(res.products);
    } catch {
      console.error('Error loading products');
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    if (!selectedClientId) {
      setPrices([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listClientPrices(selectedClientId);
      setPrices(data);
    } catch {
      showToast('Error al cargar precios', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, showToast]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, [fetchClients, fetchProducts]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Build catalog rows: products + their assigned price (if any)
  const catalogRows = useMemo(
    () =>
      products.map((prod) => {
        const price = prices.find((p) => p.product_id === prod.id);
        return { product: prod, price: price || null };
      }),
    [products, prices]
  );

  const filteredCatalog = useMemo(
    () =>
      catalogRows.filter((row) => {
        if (filterName && !(row.product.name || '').toLowerCase().includes(filterName.toLowerCase()))
          return false;
        if (filterBrand && row.product.brand_name !== filterBrand) return false;
        if (filterStyle && row.product.style_name !== filterStyle) return false;
        if (filterCategory && row.product.category_name !== filterCategory) return false;
        if (filterColor && row.product.color !== filterColor) return false;
        return true;
      }),
    [catalogRows, filterName, filterBrand, filterStyle, filterCategory, filterColor]
  );

  const assignedCount = prices.length;

  const openCreateModal = (productId: string) => {
    setEditingPrice(null);
    setFormProductId(productId);
    setFormPrice('');
    setIsModalOpen(true);
  };

  const openEditModal = (price: ClientPrice) => {
    setEditingPrice(price);
    setFormProductId(price.product_id);
    setFormPrice(String(price.unit_price));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formProductId || !formPrice) {
      showToast('Ingrese un precio', 'error');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('El precio debe ser un número mayor a 0', 'error');
      return;
    }

    if (!selectedClientId) {
      showToast('Seleccione un cliente primero', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingPrice) {
        await updateClientPrice(editingPrice.id, priceNum);
        showToast('Precio actualizado correctamente', 'success');
      } else {
        await createOrUpdateClientPrice({
          client_id: selectedClientId,
          product_id: formProductId,
          unit_price: priceNum
        });
        showToast('Precio asignado correctamente', 'success');
      }
      setIsModalOpen(false);
      fetchPrices();
    } catch {
      showToast('Error al guardar el precio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPrice) return;
    try {
      await deleteClientPrice(deletingPrice.id);
      showToast('Precio eliminado correctamente', 'success');
      setDeletingPrice(null);
      fetchPrices();
    } catch {
      showToast('Error al eliminar el precio', 'error');
    }
  };

  const handleClearFilters = () => {
    setFilterName('');
    setFilterBrand('');
    setFilterStyle('');
    setFilterCategory('');
    setFilterColor('');
  };

  const isFiltering = !!(filterName || filterBrand || filterStyle || filterCategory || filterColor);

  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(v);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const handleImgError = (id: string) => setImgErrors((prev) => ({ ...prev, [id]: true }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Precios por Cliente
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selecciona un cliente para ver o asignar precios del catálogo
        </p>
      </div>

      {/* Client selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Seleccionar Cliente:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              handleClearFilters();
            }}
            className="flex-1 max-w-md px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- Todos los clientes --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.last_name} ({c.email})
              </option>
            ))}
          </select>
          {selectedClientId && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {assignedCount} precio(s) asignado(s)
            </span>
          )}
        </div>
      </div>

      {/* Catalog section */}
      {selectedClientId && (
        <>
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Filter size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Filtros de producto
                </span>
                {isFiltering && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                    Activos
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-all duration-150 shadow-sm"
              >
                <X size={15} />
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Producto */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Producto
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre del producto..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150"
                  />
                </div>
              </div>
              {/* Marca */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Marca
                </label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150"
                >
                  <option value="">Todas</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              {/* Estilo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Estilo
                </label>
                <select
                  value={filterStyle}
                  onChange={(e) => setFilterStyle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150"
                >
                  <option value="">Todos</option>
                  {uniqueStyles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Categoría
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150"
                >
                  <option value="">Todas</option>
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Color
                </label>
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-150"
                >
                  <option value="">Todos</option>
                  {uniqueColors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Catalog table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="ml-2 text-gray-500">Cargando catálogo...</span>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="text-center py-12">
                <Package
                  size={40}
                  className="mx-auto text-gray-300 dark:text-gray-600"
                />
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  {isFiltering
                    ? 'No se encontraron productos con esos filtros'
                    : 'No hay productos en el catálogo'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-16">
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Producto
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Marca
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Estilo
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Categoría
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Color
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Estado
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Precio Unitario (COP)
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((row) => {
                      const imgUrl = resolveImageUrl(row.product.image_url);
                      const hasImgError = imgErrors[row.product.id];
                      return (
                        <tr
                          key={row.product.id}
                          className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-4 py-2">
                            {imgUrl && !hasImgError ? (
                              <img
                                src={imgUrl}
                                alt={row.product.name}
                                onError={() => handleImgError(row.product.id)}
                                onClick={() => setLightboxUrl(imgUrl)}
                                className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-slate-600 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {row.product.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {row.product.brand_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {row.product.style_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {row.product.category_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {row.product.color || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.product.state
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                              }`}
                            >
                              {row.product.state ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.price ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCOP(row.price.unit_price)}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">
                                Sin precio
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {row.price ? (
                                <>
                                  <button
                                    onClick={() => openEditModal(row.price!)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Editar precio"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingPrice(row.price)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Eliminar precio"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => openCreateModal(row.product.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 dark:border-emerald-800 dark:hover:bg-emerald-600 transition-colors"
                                  title="Asignar precio"
                                >
                                  <Plus size={13} />
                                  Asignar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state when no client selected */}
      {!selectedClientId && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <Users
            size={48}
            className="mx-auto text-gray-300 dark:text-gray-600"
          />
          <p className="mt-3 text-gray-500 dark:text-gray-400 font-medium">
            Selecciona un cliente para ver y administrar sus precios
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            El catálogo de productos aparecerá con los precios asignados
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPrice ? 'Editar Precio' : 'Asignar Precio'}
      >
        <div className="space-y-5 p-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Producto
            </label>
            <input
              type="text"
              value={
                products.find((p) => p.id === formProductId)?.name || ''
              }
              disabled
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white text-sm opacity-70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Precio Unitario (COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formPrice ? formatCOP(parseInt(formPrice.replace(/\D/g, '') || '0', 10)).replace('COP', '').trim() : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormPrice(raw);
                }}
                placeholder="$ 0"
                autoFocus
                className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            {formPrice && parseInt(formPrice, 10) > 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {formatCOP(parseInt(formPrice, 10))} por par
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formPrice}
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingPrice ? 'Actualizar' : 'Asignar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingPrice}
        onClose={() => setDeletingPrice(null)}
        title="Eliminar Precio"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Estás seguro de eliminar el precio de{' '}
            <strong>{deletingPrice?.product_name}</strong> para{' '}
            <strong>{selectedClient?.name} {selectedClient?.last_name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingPrice(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] p-2">
            <img
              src={lightboxUrl}
              alt="Vista ampliada"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
