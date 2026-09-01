/**
 * Archivo: components/ui/InputField.tsx
 * Descripción: Campo de entrada reutilizable con label, icono y toggle de contraseña.
 * ¿Para qué? Estandarizar todos los inputs del formulario con el diseño de CALZADO J&R.
 */

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  error?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  icon?: ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onCopy?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export function InputField({
  label,
  name,
  type = 'text',
  error,
  value,
  placeholder,
  autoComplete,
  autoFocus,
  required = false,
  icon,
  onChange,
  onPaste,
  onCopy
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={onChange}
          onPaste={isPassword ? (e) => e.preventDefault() : onPaste}
          onCopy={isPassword ? (e) => e.preventDefault() : onCopy}
          onCut={isPassword ? (e) => e.preventDefault() : undefined}
          onDrop={isPassword ? (e) => e.preventDefault() : undefined}
          onContextMenu={isPassword ? (e) => e.preventDefault() : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`block w-full rounded-lg border ${icon ? 'pl-10' : 'px-3'} ${
            isPassword ? 'pr-10' : icon ? 'pr-3' : ''
          } py-2.5 text-sm transition-colors duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 bg-white text-gray-900 dark:bg-slate-800 dark:text-slate-100 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 dark:border-slate-700 focus:border-[#1e40af] focus:ring-[#1e40af]/20'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
