import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiHost(): string {
  // En dev, hostUri trae la IP LAN del PC que corre Expo (ej: "192.168.1.50:8081"),
  // necesaria para que un teléfono físico alcance la API.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return Platform.select({
    android: '10.0.2.2', // emulador Android → localhost del host
    default: 'localhost',
  });
}

function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  return `http://${resolveApiHost()}:8000/api/v1`;
}

export const API_URL = resolveApiUrl();