/**
 * Archivo: fe/src/hooks/useChat.ts
 * Descripción: Hook para estado del chat IA (Fase 1).
 *
 * ¿Qué?
 *   - messages: historial {role, content, sources?}
 *   - isLoading, error
 *   - sendMessage(message): llama a postChat y actualiza historial
 *   - clearMessages(): limpia historial
 *
 * ¿Para qué?
 *   - ChatWidget.tsx consume este hook para UI reactiva.
 *   - Encapsula lógica de API y estado (separación de capas).
 *
 * ¿Impacto?
 *   Fase 1 — sin este hook no hay chat. Si falla:
 *   - ChatWidget no envía ni muestra respuestas.
 *   Modificar firma rompe: ChatWidget.tsx.
 *   Dependencias: services/aiApi.ts
 */

import { useCallback, useState } from 'react';
import { postChat, type SourceItem } from '@/services/aiApi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  timestamp: number;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      setError('El mensaje no puede exceder 500 caracteres');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await postChat({ message: trimmed });
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        'Error al contactar al asistente';
      setError(msg);
      // Mensaje de error visible en el chat
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${msg}. Intenta de nuevo o contáctanos por WhatsApp al 3137061602.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
