/**
 * PageLoader — fallback de carga para <Suspense> (code splitting).
 *
 * Se muestra mientras se descarga el chunk de una ruta perezosa.
 * Consistente con el spinner de marca usado en ProtectedRoute
 * (border-[#1e40af]).
 */

interface PageLoaderProps {
  /** Texto junto al spinner */
  label?: string;
}

export default function PageLoader({ label = 'Cargando…' }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <div
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-4 border-[#1e40af] border-t-transparent"
      />
      <p className="text-sm text-gray-500">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
