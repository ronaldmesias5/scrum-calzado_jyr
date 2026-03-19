/**
 * Modal: ContactClientModal.tsx
 * Opciones de contacto con el cliente (email, teléfono, copiar datos)
 */

import { Mail, Phone, Copy, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ContactClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  orderId: string;
}

export default function ContactClientModal({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  clientPhone,
  orderId,
}: ContactClientModalProps) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEmail = () => {
    if (clientEmail) {
      window.location.href = `mailto:${clientEmail}?subject=Pedido ${orderId.substring(0, 8)}`;
      onClose();
    }
  };

  const handlePhone = () => {
    if (clientPhone) {
      window.location.href = `tel:${clientPhone}`;
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Contactar Cliente</h2>
              <p className="text-sm text-gray-500 mt-0.5">{clientName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-3">
            {/* Email */}
            {clientEmail ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm text-gray-900 font-medium truncate">{clientEmail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(clientEmail, 'email')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                    title="Copiar email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEmail}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Enviar email"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-50">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm text-gray-500">No disponible</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {clientPhone ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-sm text-gray-900 font-medium truncate">{clientPhone}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(clientPhone, 'phone')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                    title="Copiar teléfono"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePhone}
                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                    title="Llamar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-50">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-sm text-gray-500">No disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Feedback de copiar */}
          {copied && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
              {copied === 'email' ? '✓ Email copiado' : '✓ Teléfono copiado'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
