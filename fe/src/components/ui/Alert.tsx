/**
 * Archivo: components/ui/Alert.tsx
 * Descripción: Componente de alerta para mensajes de éxito, error o información.
 */

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const styles = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
      text: "text-green-800 dark:text-green-300",
      icon: <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />,
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
      text: "text-red-800 dark:text-red-300",
      icon: <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
      text: "text-blue-800 dark:text-blue-300",
      icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${style.bg}`}
      role="alert"
    >
      <div className="shrink-0">{style.icon}</div>
      <p className={`text-sm ${style.text} flex-1`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`shrink-0 ${style.text} hover:opacity-70`}
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
