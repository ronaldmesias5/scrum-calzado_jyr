// ════════════════════════════════════════
// 📄 Token de acceso en memoria (nunca en localStorage/sessionStorage)
// ════════════════════════════════════════

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Elimina restos de sesiones antiguas que guardaban el token en storage. */
export function clearLegacyTokens(): void {
  for (const key of ['access_token', 'refresh_token']) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
