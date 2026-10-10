/**
 * SkeletonLoader — esqueleto de carga reutilizable con pulso Tailwind.
 *
 * Simula la estructura real de las páginas (tarjetas, tablas, texto)
 * mientras se descargan datos o chunks, en lugar de un spinner plano.
 * Sigue el design system existente: tarjetas `rounded-2xl border-gray-200
 * dark:border-slate-800 shadow-sm`, bloques `bg-gray-200 dark:bg-slate-700`
 * con `animate-pulse` (mismo patrón que ReportsPage/TasksPage).
 */

type SkeletonVariant = 'page' | 'cards' | 'table' | 'text';

interface SkeletonLoaderProps {
  /** Forma del esqueleto. 'page' = compuesto header+stats+tabla (Suspense). */
  variant?: SkeletonVariant;
  /** Número de bloques (tarjetas / filas / líneas de texto). */
  count?: number;
  className?: string;
}

/** Bloque base con pulso. */
function Block({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${className}`}
    />
  );
}

/** Tarjeta contenedora que imita el estilo de card del dashboard. */
function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
      {children}
    </div>
  );
}

/** Variante texto: líneas de párrafo con anchos variables. */
function TextSkeleton({ count = 4 }: { count: number }) {
  const widths = ['w-3/4', 'w-full', 'w-5/6', 'w-2/3'];
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Block key={i} className={`h-4 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

/** Variante tarjetas: grid responsive de cards (imagen + líneas de texto). */
function CardsSkeleton({ count = 6 }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i}>
          <Block className="mb-4 h-40 w-full rounded-xl" />
          <Block className="mb-2 h-4 w-2/3" />
          <Block className="mb-2 h-3 w-1/2" />
          <Block className="mb-4 h-3 w-1/3" />
          <Block className="h-8 w-full rounded-xl" />
        </CardSkeleton>
      ))}
    </div>
  );
}

/** Variante tabla: encabezado + filas (patrón de Orders/Inventory/Losses). */
function TableSkeleton({ count = 6 }: { count: number }) {
  return (
    <CardSkeleton>
      <div className="space-y-4">
        {/* Encabezado de tabla */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3" aria-hidden="true">
          <Block className="h-3 w-1/4" />
          <Block className="h-3 w-1/5" />
          <Block className="h-3 w-1/6" />
          <Block className="h-3 w-1/6" />
          <Block className="h-3 w-1/8" />
        </div>
        {/* Filas */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4" aria-hidden="true">
            <Block className="h-4 w-1/4" />
            <Block className="h-4 w-1/5" />
            <Block className="h-4 w-1/6" />
            <Block className="h-4 w-1/6" />
            <Block className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

/**
 * Variante página (fallback por defecto de <Suspense>): imita la estructura
 * de un dashboard admin — header, fila de stats y tabla principal.
 */
function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header: título + subtítulo */}
      <div aria-hidden="true">
        <Block className="mb-2 h-8 w-56 rounded-xl" />
        <Block className="h-4 w-80" />
      </div>
      {/* Fila de tarjetas de resumen (4 stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i}>
            <Block className="mb-3 h-3 w-1/2" />
            <Block className="h-7 w-1/3" />
          </CardSkeleton>
        ))}
      </div>
      {/* Barra de filtros */}
      <div aria-hidden="true" className="flex gap-4">
        <Block className="h-10 flex-1 rounded-xl" />
        <Block className="h-10 w-32 rounded-xl" />
      </div>
      {/* Tabla principal */}
      <TableSkeleton count={6} />
    </div>
  );
}

export default function SkeletonLoader({
  variant = 'page',
  count,
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido"
      className={`min-h-[50vh] ${className}`}
    >
      {variant === 'text' && <TextSkeleton count={count ?? 4} />}
      {variant === 'cards' && <CardsSkeleton count={count ?? 6} />}
      {variant === 'table' && <TableSkeleton count={count ?? 6} />}
      {variant === 'page' && <PageSkeleton />}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
