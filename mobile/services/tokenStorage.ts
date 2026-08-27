import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'calzado.accessToken';
const REFRESH_TOKEN_KEY = 'calzado.refreshToken';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await setItem(ACCESS_TOKEN_KEY, accessToken);
    await setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  },
};