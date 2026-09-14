/**
 * Archivo: mobile/components/ChatWidget.tsx
 * Descripción: Widget FAB para chat IA en mobile (Fase 2, Expo + NativeWind).
 *
 * ¿Qué?
 *   - FAB abajo-izquierda (opuesto a acciones principales).
 *   - Modal con historial, input, typing indicator, fuentes.
 *   - Usa mobile/services/aiApi.ts (apiClient con SecureStore).
 *
 * ¿Para qué?
 *   - Chat con contexto por rol en app móvil (Fase 2).
 *
 * ¿Impacto?
 *   Fase 2 — sin este widget no hay chat mobile. Si falla:
 *   - App móvil sin asistente.
 *   Dependencias: services/aiApi.ts, react-native, expo
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getHealth, postChat, type SourceItem } from '@/services/aiApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  timestamp: number;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 500) {
      if (trimmed.length > 500) setError('Máx 500 caracteres');
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

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading]);

  return (
    <>
      {/* FAB — Águila Robot */}
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        className="absolute bottom-6 left-6 w-14 h-14 bg-[#1e40af] rounded-full items-center justify-center shadow-lg border-2 border-white/20"
        accessibilityLabel={isOpen ? 'Cerrar asistente' : 'Abrir Águila J&R'}
        accessibilityRole="button"
      >
        <Text className="text-white text-xl">{isOpen ? '✕' : '🦅'}</Text>
      </Pressable>

      {/* Modal */}
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-2xl h-[70%] overflow-hidden">
            {/* Header — Águila J&R */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-[#1e40af]">
              <Text className="text-white font-semibold text-sm">🦅 Águila J&R · Asistente IA</Text>
              <View className="flex-row gap-2">
                {messages.length > 0 && (
                  <Pressable onPress={() => setMessages([])} className="p-2">
                    <Text className="text-white text-xs">🗑️</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setIsOpen(false)} className="p-2">
                  <Text className="text-white text-lg">✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Historial */}
            <ScrollView ref={scrollRef} className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800" contentContainerStyle={{ gap: 12 }}>
              {messages.length === 0 && (
                <View className="items-center py-8">
                  <Text className="text-2xl mb-2">�</Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300 font-medium text-center">
                    ¡Hola! Soy Águila J&R 🦅
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    Pregúntame por productos, tallas, marcas o cómo ser cliente mayorista.
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mt-4 justify-center">
                    {['¿Qué marcas manejan?', '¿Cómo ser cliente mayorista?', '¿Dónde va mi pedido?'].map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => setInput(q)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full"
                      >
                        <Text className="text-xs text-gray-700 dark:text-gray-200">{q}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {messages.map((m) => (
                <View key={m.id} className={`flex-row gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <View className="w-7 h-7 rounded-full bg-[#1e40af] items-center justify-center">
                      <Text className="text-white text-xs">🤖</Text>
                    </View>
                  )}
                  <View
                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      m.role === 'user' ? 'bg-[#1e40af] rounded-br-sm' : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-bl-sm'
                    }`}
                  >
                    <Text className={`text-sm ${m.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{m.content}</Text>
                    {m.sources && m.sources.length > 0 && (
                      <Text className="text-xs opacity-60 mt-1">Fuentes: {m.sources.length}</Text>
                    )}
                  </View>
                  {m.role === 'user' && (
                    <View className="w-7 h-7 rounded-full bg-gray-300 dark:bg-slate-600 items-center justify-center">
                      <Text className="text-xs">👤</Text>
                    </View>
                  )}
                </View>
              ))}

              {isLoading && (
                <View className="flex-row gap-2">
                  <View className="w-7 h-7 rounded-full bg-[#1e40af] items-center justify-center">
                    <Text className="text-white text-xs">🤖</Text>
                  </View>
                  <View className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl rounded-bl-sm px-3 py-2">
                    <ActivityIndicator size="small" color="#1e40af" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <View className="flex-row gap-2">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Escribe tu pregunta..."
                  maxLength={500}
                  editable={!isLoading}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`w-10 h-10 rounded-full items-center justify-center ${!input.trim() || isLoading ? 'bg-gray-300 dark:bg-slate-600' : 'bg-[#1e40af]'}`}
                  accessibilityLabel="Enviar mensaje"
                >
                  <Text className="text-white">➤</Text>
                </Pressable>
              </View>
              <Text className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                Respuestas con IA, verifica con asesor · Máx 500 caracteres
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default ChatWidget;
