/**
 * Modal: ContactClientModal.tsx
 * Opciones de contacto con el cliente (email, teléfono, copiar datos)
 */

import { Mail, Phone, MessageCircle, X, ExternalLink, User, Building2, MapPin, Copy } from 'lucide-react';
import Modal from '@/components/ui/Modal';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contactar Cliente"
      size="md"
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-6 py-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{clientName}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 bg-white dark:bg-slate-900">
            {/* Email */}
            {clientEmail ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-all group">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest mb-0.5">Electrónico</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-bold truncate">{clientEmail}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(clientEmail, 'email')}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                    title="Copiar email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEmail}
                    className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    title="Enviar email"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 opacity-60">
                <div className="p-3 bg-gray-200 dark:bg-slate-700 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest">Email</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">No registrado</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {clientPhone ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-all group">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest mb-0.5">Teléfono Movil</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-bold truncate">{clientPhone}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(clientPhone, 'phone')}
                    className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                    title="Copiar teléfono"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePhone}
                    className="p-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95"
                    title="Llamar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 opacity-60">
                <div className="p-3 bg-gray-200 dark:bg-slate-700 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest">Contacto</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">No registrado</p>
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 dark:border-slate-800 flex justify-end bg-gray-50/50 dark:bg-slate-800/20 transition-colors">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] border border-gray-200 dark:border-slate-700"
            >
              Cerrar Diálogo
            </button>
        </div>

        {/* Feedback de copiar */}
        {copied && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
              {copied === 'email' ? '✓ Email copiado' : '✓ Teléfono copiado'}
            </div>
        )}
      </div>
    </Modal>
  );
}
