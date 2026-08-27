import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

interface ToastItemProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
}

const bgMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
} as const

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const

export function ToastItem({ message, type, onClose }: ToastItemProps) {
  const Icon = iconMap[type]

  return (
    <div
      className={`${bgMap[type]} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="font-semibold text-sm text-center flex-1">{message}</p>
      <button onClick={onClose} className="shrink-0 hover:opacity-80 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
