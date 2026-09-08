/**
 * Archivo: fe/src/features/ai/components/organisms/ChatWidget.tsx
 * Descripción: Widget FAB flotante para chat IA (Fase 1, RAG).
 *
 * ¿Qué?
 *   - FAB colapsable (burbuja abajo-izquierda, opuesto a WhatsApp derecha).
 *   - Panel 380x500px: header, historial, typing indicator, input + enviar, footer.
 *   - Usa useChat hook, aiApi, lucide-react, Tailwind, a11y (role dialog, focus trap).
 *   - Basado en WhatsAppButton + Modal (createPortal, Escape, focus trap).
 *
 * ¿Para qué?
 *   - Chat público en LandingPage (Fase 1) para visitantes 24/7.
 *   - Base para Fase 2 (layouts autenticados).
 *
 * ¿Impacto?
 *   Fase 1 — sin este widget no hay UI de chat. Si falla:
 *   - Landing sin asistente.
 *   Modificar props rompe: LandingPage.tsx.
 *   Dependencias: hooks/useChat.ts, services/aiApi.ts, lucide-react
 */

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, User } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FAB — abajo-izquierda, opuesto a WhatsApp (derecha) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente Calzado J&R'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? <X className="w-7 h-7" aria-hidden="true" /> : <MessageCircle className="w-7 h-7" aria-hidden="true" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asistente Calzado J&R"
          className="fixed bottom-24 left-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1e40af] text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" aria-hidden="true" />
              <span className="font-semibold text-sm">Asistente J&R</span>
              <span className="text-xs opacity-80 hidden sm:inline">· Catálogo y FAQs</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearMessages}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Limpiar conversación"
                  title="Limpiar"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Historial */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-800">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" aria-hidden="true" />
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">¡Hola! Soy el asistente de Calzado J&R</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pregúntame por productos, tallas, marcas o cómo ser cliente mayorista.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {['¿Tienen botas talla 42?', '¿Cómo ser cliente mayorista?', '¿Qué marcas manejan?'].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#1e40af] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1e40af] text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <details className="mt-2 text-xs opacity-70">
                      <summary className="cursor-pointer hover:opacity-100">Fuentes ({m.sources.length})</summary>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {m.sources.slice(0, 3).map((s, i) => (
                          <li key={i} className="truncate">
                            {s.content.slice(0, 80)}...
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#1e40af] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                maxLength={500}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent disabled:opacity-50"
                aria-label="Mensaje para el asistente"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-[#1e40af] hover:bg-[#1e3a8a] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
              Respuestas con IA, verifica con asesor · Máx 500 caracteres
            </p>
          </div>
        </div>
      )}
    </>
  );
}
