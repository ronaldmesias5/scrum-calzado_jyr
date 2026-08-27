import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/utils/httpError';
import { isJefe } from '@/utils/roles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);

  if (isAuthenticated && user) {
    if (user.must_change_password) {
      return <Redirect href="/forgot-password" />;
    }
    if (isJefe(user)) {
      return <Redirect href="/(admin)/(tabs)" />;
    }
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
        <View className="items-center gap-3">
          <Ionicons name="construct-outline" size={48} color="#1e40af" />
          <Text className="text-center text-lg font-bold text-gray-900 dark:text-white">
            Panel no disponible
          </Text>
          <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
            Tu rol aún no tiene una sección en esta app. Vuelve pronto.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });
      if (user.must_change_password) {
        router.replace('/forgot-password');
        return;
      }
      router.replace('/(admin)/(tabs)');
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
            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary dark:bg-primary-light shadow-lg">
              <Ionicons name="footsteps" size={40} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Calzado J&R
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Inicia sesión en tu cuenta
            </Text>
          </View>

          <View className="gap-4">
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
            <View className="gap-1.5">
              <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Contraseña
              </Text>
              <View className="relative">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!loading}
                  className="pr-12"
                />
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                  disabled={loading}
                />
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Recordarme
                </Text>
              </View>
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-primary dark:text-primary-light"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </View>

            {error ? (
              <View className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 px-4 py-3">
                <Text className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}