/**
 * Archivo: components/ui/Button.tsx
 * Descripción: Botón reutilizable con estado de carga y alineación estandarizada.
 * 
 * ¿Qué? Componente de botón con variantes primary/secondary y spinner de carga.
 * ¿Para qué? Estandarizar la UI y cumplir con la restricción RD-003 (alineación) y WCAG.
 * ¿Impacto? Centraliza el diseño de acciones y previene el uso de degradados prohibidos (RD-001).
 */

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  type = "button",
  fullWidth = false,
  isLoading = false,
  disabled = false,
  variant = "primary",
  onClick,
  className,
}: ButtonProps) {

  const baseClasses =
    "btn-glow rounded-lg px-6 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden";

  const variantClasses =
    variant === "primary"
      ? "bg-[#1e3a8a] dark:bg-blue-600 text-white hover:bg-[#1e40af] dark:hover:bg-blue-500 btn-shimmer btn-glow"
      : "border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800";

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <>
      <style>{`
        .btn-glow:active {
          transform: scale(0.98);
        }
      `}</style>
      <button
        type={type}
        disabled={isLoading || disabled}
        onClick={onClick}
        aria-busy={isLoading}
        aria-label={isLoading ? "Procesando, por favor espera" : undefined}
        className={`${baseClasses} ${variantClasses} ${widthClass} ${className || ""}`}
      >
        <span className="relative z-10">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Procesando...
            </span>
          ) : (
            children
          )}
        </span>
      </button>
    </>
  );
}
