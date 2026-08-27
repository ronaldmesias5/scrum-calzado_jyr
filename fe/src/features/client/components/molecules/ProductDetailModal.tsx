import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Layers,
  MessageSquareText,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import Modal from "@/components/atoms/Modal";
import { useCart } from "@/store/CartContext";
import { useToast } from "@/store/ToastContext";
import {
  resolveImageUrl,
  type WholesaleProduct,
} from "@/services/wholesaleCatalogApi";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: WholesaleProduct | null;
  onAdded?: () => void;
}

const PRESETS = [
  { id: "commercial", label: "Comercial", hint: "Escalera 1·2·3·3·2·1" },
  { id: "2", label: "2 × talla", hint: "" },
  { id: "3", label: "3 × talla", hint: "" },
  { id: "4", label: "4 × talla", hint: "" },
  { id: "5", label: "5 × talla", hint: "" },
];

function StepHeader({
  step,
  title,
  subtitle,
  right,
}: {
  step: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-white shadow-sm dark:bg-white dark:text-slate-900">
          {step}
        </span>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-extrabold uppercase tracking-[0.14em] text-gray-900 dark:text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onAdded,
}: ProductDetailModalProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const sizeStart = product?.category_name.toLowerCase().includes("infantil") ? 21 : 33;
  const sizeEnd = product?.category_name.toLowerCase().includes("infantil") ? 32 : 43;
  const sizes = Array.from(
    { length: sizeEnd - sizeStart + 1 },
    (_, index) => ({ size: String(sizeStart + index) }),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(sizes.map(({ size }) => [size, 0])),
  );
  const [estimatedDate, setEstimatedDate] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setActivePreset(null);
      setEstimatedDate("");
      setObservations("");
      setQuantities(Object.fromEntries(sizes.map(({ size }) => [size, 0])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id]);

  if (!isOpen || !product || !product.name) return null;

  const totalPairs = Object.values(quantities).reduce((sum, amount) => sum + amount, 0);
  const activeSizes = Object.values(quantities).filter((amount) => amount > 0).length;

  const updateQuantity = (size: string, value: number) => {
    setActivePreset(null);
    setQuantities((current) => ({
      ...current,
      [size]: Math.max(0, value),
    }));
  };

  const applyPreset = (preset: string) => {
    const nextQuantities: Record<string, number> = {};
    if (preset === "commercial") {
      const pattern = [1, 2, 3, 3, 2, 1];
      sizes.forEach(({ size }, index) => {
        nextQuantities[size] = pattern[index] ?? 0;
      });
    } else {
      const amount = preset === "clear" ? 0 : Number(preset);
      sizes.forEach(({ size }) => {
        nextQuantities[size] = amount;
      });
    }
    setQuantities(nextQuantities);
    setActivePreset(preset);
  };

  const handleAddToCart = () => {
    if (totalPairs === 0) {
      showToast("Selecciona al menos una talla para continuar", "warning");
      return;
    }
    if (estimatedDate && estimatedDate < todayIso) {
      showToast("La fecha estimada no puede ser anterior a hoy", "error");
      return;
    }

    sizes.forEach(({ size }) => {
      const amount = quantities[size] ?? 0;
      if (amount > 0)
        addItem(product, size, amount, estimatedDate || null, observations.trim() || null);
    });

    showToast(
      "Producto agregado al carrito. Puedes seguir agregando productos.",
      "success",
    );
    onAdded?.();
    onClose();
  };

  const formatDate = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  };

  const todayIso = new Date().toLocaleDateString("en-CA");

  const presetClass = (presetId: string) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 ${
      activePreset === presetId
        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25"
        : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
    }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar pedido"
      size="full"
      centered
    >
      <div className="space-y-6 bg-slate-50/80 p-5 dark:bg-slate-950/50 sm:p-7">
        {/* ── Producto ─────────────────────────────────── */}
        <div className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm duration-300 dark:border-slate-700 dark:bg-slate-800">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[linear-gradient(115deg,transparent_55%,rgba(37,99,235,0.06)_55.5%)] dark:bg-[linear-gradient(115deg,transparent_55%,rgba(96,165,250,0.08)_55.5%)]"
          />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-blue-50 ring-1 ring-slate-200 sm:h-24 sm:w-24 dark:from-slate-700 dark:via-slate-800 dark:to-blue-950/40 dark:ring-slate-600">
              {product.image_url ? (
                <img
                  src={resolveImageUrl(product.image_url)}
                  alt={product.name}
                  className="h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <Package className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {product.brand_name}
              </p>
              <h3 className="truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                  {product.category_name}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                  Estilo · {product.style_name}
                </span>
                {product.color && (
                  <span className="rounded-full border border-slate-800 bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:border-slate-600 dark:bg-slate-600">
                    {product.color.trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Paso 1 · Datos del pedido ────────────────── */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "60ms" }}>
          <StepHeader
            step="1"
            title="Datos del pedido"
            subtitle="Fecha tentativa y notas para fábrica"
          />
          <div className="grid gap-3 sm:grid-cols-5">
            <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors focus-within:border-blue-500 sm:col-span-2 dark:border-slate-700 dark:bg-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Entrega estimada
              </span>
              <input
                type="date"
                value={estimatedDate}
                min={todayIso}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value && value < todayIso) {
                    showToast("Solo puedes elegir hoy o fechas futuras", "warning");
                    return;
                  }
                  setEstimatedDate(value);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:[color-scheme:dark]"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Opcional</span>
            </label>

            <label className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors focus-within:border-blue-500 sm:col-span-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <MessageSquareText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Comentarios o sugerencias
                </span>
                <span
                  className={`text-[10px] font-bold ${observations.length > 450 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}
                >
                  {observations.length}/500
                </span>
              </span>
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                placeholder="Ej.: Prefiero suela blanca, costura reforzada en el talón..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                aria-label="Comentarios o sugerencias del pedido"
              />
            </label>
          </div>
        </section>

        {/* ── Paso 2 · Distribución de pares ───────────── */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "120ms" }}>
          <StepHeader
            step="2"
            title="Distribución de pares"
            subtitle={`Tallas ${sizeStart}–${sizeEnd}`}
            right={
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums transition-colors ${
                  totalPairs > 0
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {totalPairs} {totalPairs === 1 ? "par" : "pares"}
              </span>
            }
          />

          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex w-full items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 sm:w-auto dark:text-slate-400">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                Rellenado rápido
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.hint || undefined}
                    onClick={() => applyPreset(preset.id)}
                    className={presetClass(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-transparent px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {sizes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-slate-600 dark:text-gray-400">
              No hay tallas disponibles para este producto.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sizes.map(({ size }) => {
                const quantity = quantities[size] ?? 0;
                return (
                  <div
                    key={size}
                    className={`min-w-0 overflow-hidden rounded-xl border p-2.5 transition-all duration-200 ${
                      quantity > 0
                        ? "border-blue-500 bg-blue-50/80 shadow-md shadow-blue-600/10 dark:border-blue-500 dark:bg-blue-950/40"
                        : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className={`shrink-0 whitespace-nowrap text-base font-black leading-none tabular-nums transition-colors sm:text-lg ${
                          quantity > 0
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {size}
                      </span>
                      {quantity > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-extrabold text-white">
                          {quantity}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-700/60">
                      <button
                        type="button"
                        onClick={() => updateQuantity(size, quantity - 1)}
                        disabled={quantity === 0}
                        className="shrink-0 rounded-md p-1 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-600 dark:hover:text-white"
                        aria-label={`Disminuir talla ${size}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(event) => updateQuantity(size, Number(event.target.value))}
                        className="min-w-[2rem] w-full bg-transparent px-0.5 text-center text-sm font-extrabold tabular-nums text-gray-900 outline-none [appearance:textfield] dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label={`Cantidad talla ${size}`}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(size, quantity + 1)}
                        className="shrink-0 rounded-md p-1 text-blue-600 transition-all hover:bg-blue-100 active:scale-90 dark:text-blue-300 dark:hover:bg-slate-600"
                        aria-label={`Aumentar talla ${size}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Barra de acción ──────────────────────────── */}
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md duration-300 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white">
                {totalPairs} {totalPairs === 1 ? "par" : "pares"} en {activeSizes}{" "}
                {activeSizes === 1 ? "talla" : "tallas"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {estimatedDate
                  ? `Entrega estimada · ${formatDate(estimatedDate)}`
                  : "Sin fecha de entrega definida"}
                {observations.trim() && " · Con nota para fábrica"}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col-reverse gap-2.5 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={totalPairs === 0}
              className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              Agregar al carrito
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
