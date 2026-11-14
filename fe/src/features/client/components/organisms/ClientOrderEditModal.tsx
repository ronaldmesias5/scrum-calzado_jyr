import { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, Plus, Trash2, X } from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { useToast } from '@/store/ToastContext';
import {
  getClientCatalogProducts,
  getWholesaleCategories,
  getWholesaleBrands,
  getWholesaleStyles,
  resolveImageUrl,
  type Brand,
  type Category,
  type Style,
  type WholesaleProductWithPrice
} from '@/services/wholesaleCatalogApi';
import {
  updateMyOrder,
  type ClientOrder,
  type OrderDetailItemCreateRequest
} from '@/services/clientApi';
import { getSizesList } from '@/utils/shoeSizes';
import NumeracionesRapidas from '@/components/atoms/NumeracionesRapidas';

interface EditLine {
  uid: string;
  product_id: string;
  product_name: string | null;
  brand_name: string | null;
  category_name: string | null;
  image_url: string | null;
  colour: string | null;
  observations: string | null;
  sizes: Array<{ size: string; amount: number }>;
}

interface ClientOrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ClientOrder | null;
  onSaved: () => void;
}

const groupKey = (productId: string, colour: string | null) =>
  `${productId}::${colour ?? ''}`;

function buildLines(order: ClientOrder | null): EditLine[] {
  if (!order) return [];
  const map = new Map<string, EditLine>();
  for (const d of order.details) {
    const key = groupKey(d.product_id, d.colour);
    const existing = map.get(key);
    if (existing) {
      existing.sizes.push({ size: d.size, amount: d.amount });
    } else {
      map.set(key, {
        uid: key,
        product_id: d.product_id,
        product_name: d.product_name,
        brand_name: d.brand_name,
        category_name: d.category_name,
        image_url: d.image_url,
        colour: d.colour,
        observations: d.observations ?? null,
        sizes: [{ size: d.size, amount: d.amount }]
      });
    }
  }
  return [...map.values()];
}

function extractErrorMessage(error: unknown): string {
  const responseError = error as {
    response?: { data?: { detail?: string | Array<{ msg?: string }> } };
  };
  const detail = responseError.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg)
      .filter(Boolean)
      .join('. ');
  }
  return typeof detail === 'string' ? detail : '';
}

export default function ClientOrderEditModal({
  isOpen,
  onClose,
  order,
  onSaved
}: ClientOrderEditModalProps) {
  const { showToast } = useToast();
  const [lines, setLines] = useState<EditLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [selCategory, setSelCategory] = useState('');
  const [selBrand, setSelBrand] = useState('');
  const [selStyle, setSelStyle] = useState('');

  const [pickerResults, setPickerResults] = useState<WholesaleProductWithPrice[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickedProduct, setPickedProduct] = useState<WholesaleProductWithPrice | null>(null);
  const [pickedSizes, setPickedSizes] = useState<Record<string, number>>({});
  const [pickedPreset, setPickedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLines(buildLines(order));
      setSelCategory('');
      setSelBrand('');
      setSelStyle('');
      setPickerResults([]);
      setPickedProduct(null);
      setPickedSizes({});
      setPickedPreset(null);
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen || categories.length > 0) return;
    getWholesaleCategories(true)
      .then(setCategories)
      .catch(() => {});
  }, [isOpen, categories.length]);

  useEffect(() => {
    if (!isOpen || !selCategory) {
      setBrands([]);
      return;
    }
    getWholesaleBrands(true, selCategory)
      .then(setBrands)
      .catch(() => setBrands([]));
  }, [selCategory, isOpen]);

  useEffect(() => {
    if (!isOpen || !selBrand) {
      setStyles([]);
      return;
    }
    getWholesaleStyles(true, selBrand, selCategory)
      .then(setStyles)
      .catch(() => setStyles([]));
  }, [selBrand, selCategory, isOpen]);

  useEffect(() => {
    if (!isOpen || !selCategory || !selBrand || !selStyle) {
      setPickerResults([]);
      return;
    }
    setPickerLoading(true);
    getClientCatalogProducts(
      { category_id: selCategory, brand_id: selBrand, style_id: selStyle },
      1,
      12
    )
      .then((res) => setPickerResults(res.products))
      .catch(() => setPickerResults([]))
      .finally(() => setPickerLoading(false));
  }, [selCategory, selBrand, selStyle, isOpen]);

  const handleCategoryChange = (value: string) => {
    setSelCategory(value);
    setSelBrand('');
    setSelStyle('');
    setPickedProduct(null);
    setPickedSizes({});
    setPickedPreset(null);
  };

  const handleBrandChange = (value: string) => {
    setSelBrand(value);
    setSelStyle('');
    setPickedProduct(null);
    setPickedSizes({});
    setPickedPreset(null);
  };

  const handleStyleChange = (value: string) => {
    setSelStyle(value);
    setPickedProduct(null);
    setPickedSizes({});
    setPickedPreset(null);
  };

  const linePairs = (line: EditLine) =>
    line.sizes.reduce((sum, s) => sum + s.amount, 0);

  const totalPairs = useMemo(
    () => lines.reduce((sum, line) => sum + linePairs(line), 0),
    [lines]
  );

  const handleSizeChange = (uid: string, size: string, raw: string) => {
    const amount = Math.max(0, parseInt(raw, 10) || 0);
    setLines((prev) =>
      prev.map((line) => {
        if (line.uid !== uid) return line;
        const withoutSize = line.sizes.filter((s) => s.size !== size);
        const sizes =
          amount > 0
            ? [...withoutSize, { size, amount }].sort(
                (a, b) => Number(a.size) - Number(b.size)
              )
            : withoutSize;
        return { ...line, sizes };
      })
    );
  };

  const handleRemoveLine = (uid: string) => {
    setLines((prev) => prev.filter((line) => line.uid !== uid));
  };

  const handlePickProduct = (product: WholesaleProductWithPrice) => {
    setPickedProduct(product);
    setPickedSizes({});
    setPickedPreset(null);
  };

  const handleAddPickedProduct = () => {
    if (!pickedProduct) return;
    const newSizes = Object.entries(pickedSizes)
      .filter(([, amount]) => amount > 0)
      .map(([size, amount]) => ({ size, amount }));
    if (newSizes.length === 0) return;

    const key = groupKey(pickedProduct.id, pickedProduct.color ?? null);
    setLines((prev) => {
      const existing = prev.find((line) => line.uid === key);
      if (existing) {
        return prev.map((line) => {
          if (line.uid !== key) return line;
          const merged = [...line.sizes];
          for (const s of newSizes) {
            const found = merged.find((m) => m.size === s.size);
            if (found) found.amount += s.amount;
            else merged.push(s);
          }
          return {
            ...line,
            sizes: merged.sort((a, b) => Number(a.size) - Number(b.size))
          };
        });
      }
      return [
        ...prev,
        {
          uid: key,
          product_id: pickedProduct.id,
          product_name: pickedProduct.name,
          brand_name: pickedProduct.brand_name,
          category_name: pickedProduct.category_name,
          image_url: pickedProduct.image_url ?? null,
          colour: pickedProduct.color ?? null,
          observations: null,
          sizes: [...newSizes].sort((a, b) => Number(a.size) - Number(b.size))
        }
      ];
    });
    setPickedProduct(null);
    setPickedSizes({});
    setPickedPreset(null);
    showToast('Producto agregado al pedido', 'success');
  };

  const handleSave = async () => {
    if (isSubmitting || !order) return;
    const nonEmptyLines = lines.filter((line) => linePairs(line) > 0);
    if (nonEmptyLines.length === 0 || totalPairs === 0) {
      showToast('El pedido debe tener al menos un par.', 'error');
      return;
    }

    const details: OrderDetailItemCreateRequest[] = nonEmptyLines.flatMap(
      (line, index) =>
        line.sizes
          .filter((s) => s.amount > 0)
          .map((s) => ({
            product_id: line.product_id,
            size: s.size,
            colour: line.colour,
            amount: s.amount,
            observations: line.observations ?? undefined,
            line_group: index
          }))
    );

    try {
      setIsSubmitting(true);
      await updateMyOrder(order.id, { details });
      showToast('Pedido actualizado correctamente', 'success');
      onSaved();
      onClose();
    } catch (error) {
      showToast(
        extractErrorMessage(error) || 'No se pudo actualizar el pedido.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar pedido" size="lg" centered>
      <div className="space-y-5 bg-slate-50/70 p-5 dark:bg-slate-950/40 sm:p-7">
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-900/20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Modificando pedido
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Ajusta las cantidades o agrega más productos
            </p>
          </div>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {totalPairs} <span className="text-xs font-semibold">pares</span>
          </span>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.uid}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
                    {line.image_url ? (
                      <img
                        src={resolveImageUrl(line.image_url)}
                        alt={line.product_name || 'Producto'}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Producto {index + 1}
                    </p>
                    <h3 className="truncate font-bold text-gray-900 dark:text-white">
                      {line.product_name || 'Producto'}
                    </h3>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {[line.brand_name, line.colour].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line.uid)}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  aria-label={`Quitar ${line.product_name || 'producto'} del pedido`}
                  title="Quitar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {getSizesList(line.category_name ?? undefined).map((size) => {
                  const current =
                    line.sizes.find((s) => s.size === size)?.amount || 0;
                  return (
                    <div key={size} className="flex flex-col gap-1">
                      <label className="text-center text-[9px] font-black uppercase text-gray-400 dark:text-gray-500">
                        T{size}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={current || ''}
                        onChange={(e) =>
                          handleSizeChange(line.uid, size, e.target.value)
                        }
                        className={`w-full min-w-[2rem] rounded-lg border px-1 py-1.5 text-center text-xs font-black outline-none transition-all focus:ring-2 focus:ring-blue-500 ${
                          current > 0
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'border-transparent bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-white'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <input
                  type="text"
                  value={line.observations ?? ''}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l) =>
                        l.uid === line.uid
                          ? { ...l, observations: e.target.value || null }
                          : l
                      )
                    )
                  }
                  placeholder="Nota (opcional)"
                  maxLength={500}
                  className="w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-300"
                />
                <span className="ml-3 inline-flex shrink-0 items-center bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50">
                  {linePairs(line)} pares
                </span>
              </div>
            </div>
          ))}

          {lines.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No tienes productos en este pedido. Agrega al menos uno.
              </p>
            </div>
          )}
        </div>

        {/* Agregar productos — selector en cascada: categoría → marca → estilo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            Agregar más productos
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                1. Categoría
              </label>
              <select
                value={selCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                2. Marca
              </label>
              <select
                value={selBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                disabled={!selCategory}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
              >
                <option value="">
                  {selCategory ? 'Seleccionar marca...' : 'Elige categoría'}
                </option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                3. Estilo
              </label>
              <select
                value={selStyle}
                onChange={(e) => handleStyleChange(e.target.value)}
                disabled={!selBrand}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
              >
                <option value="">
                  {selBrand ? 'Seleccionar estilo...' : 'Elige marca'}
                </option>
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pickerLoading && (
            <div className="mt-3 flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          )}

          {!pickerLoading && selStyle && pickerResults.length === 0 && (
            <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay productos para este estilo.
            </p>
          )}

          {!pickerLoading && pickerResults.length > 0 && !pickedProduct && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {pickerResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProduct(product)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-800">
                    {product.image_url ? (
                      <img
                        src={resolveImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <span className="line-clamp-2 text-[11px] font-bold leading-tight text-gray-800 dark:text-gray-200">
                    {product.name}
                  </span>
                  <span className="text-[9px] font-semibold uppercase text-gray-400">
                    {product.brand_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {pickedProduct && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-900/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {pickedProduct.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[pickedProduct.brand_name, pickedProduct.category_name]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickedProduct(null);
                    setPickedSizes({});
                    setPickedPreset(null);
                  }}
                  className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-slate-800"
                  aria-label="Cancelar selección"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3">
                <NumeracionesRapidas
                  categoryName={pickedProduct.category_name}
                  amounts={pickedSizes}
                  activePreset={pickedPreset}
                  onPresetChange={setPickedPreset}
                  onApply={(newAmounts) =>
                    setPickedSizes((prev) => ({ ...prev, ...newAmounts }))
                  }
                />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {getSizesList(pickedProduct.category_name).map((size) => (
                  <div key={size} className="flex flex-col gap-1">
                    <label className="text-center text-[9px] font-black uppercase text-gray-400 dark:text-gray-500">
                      T{size}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={pickedSizes[size] || ''}
                      onChange={(e) =>
                        setPickedSizes((prev) => ({
                          ...prev,
                          [size]: Math.max(0, parseInt(e.target.value, 10) || 0)
                        }))
                      }
                      className={`w-full min-w-[2rem] rounded-lg border px-1 py-1.5 text-center text-xs font-black outline-none transition-all focus:ring-2 focus:ring-blue-500 ${
                        (pickedSizes[size] || 0) > 0
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'border-transparent bg-white text-gray-900 dark:bg-slate-900 dark:text-white'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddPickedProduct}
                disabled={
                  Object.values(pickedSizes).every((amount) => amount <= 0)
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Agregar al pedido
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Total de pares
          </span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalPairs}
          </span>
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || totalPairs === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
