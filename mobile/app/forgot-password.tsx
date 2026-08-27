import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/utils/httpError';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-2 mb-8">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary dark:bg-primary-light shadow-lg">
              <Ionicons name="key-outline" size={32} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Recuperar contraseña
            </Text>
            <Text className="text-sm text-center text-gray-500 dark:text-gray-400">
              Te enviaremos un correo con instrucciones para restablecer tu
              contraseña.
            </Text>
          </View>

          <View className="gap-4">
            {sent ? (
              <View className="gap-4">
                <View className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/30 px-4 py-3">
                  <Text className="text-sm text-green-700 dark:text-green-300">
                    Si el correo existe, recibirás un enlace para restablecer tu
                    contraseña.
                  </Text>
                </View>
                <Button title="Volver al inicio de sesión" onPress={() => router.replace('/login')} />
              </View>
            ) : (
              <>
                <Input
                  label="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tucorreo@ejemplo.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!loading}
                />
                {error ? (
                  <View className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 px-4 py-3">
                    <Text className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </Text>
                  </View>
                ) : null}
                <Button
                  title="Enviar enlace"
                  onPress={handleSubmit}
                  loading={loading}
                />
                <Button
                  title="Volver"
                  variant="ghost"
                  onPress={() => router.back()}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}