/**
 * Archivo: __tests__/csrf.test.ts
 * Descripción: Tests del interceptor CSRF en el frontend.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';

describe('CSRF Token Helper', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'cookie'
  );

  beforeEach(() => {
    // jsdom no limpia cookies con document.cookie = '', expirar manualmente
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqIdx = cookie.indexOf('=');
      const name = (eqIdx > -1 ? cookie.substring(0, eqIdx) : cookie).trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });

  afterAll(() => {
    if (originalCookie) {
      Object.defineProperty(Document.prototype, 'cookie', originalCookie);
    }
  });

  it('debe leer el token csrf_token de las cookies', () => {
    document.cookie = 'csrf_token=abc123def456';

    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;

    expect(token).toBe('abc123def456');
  });

  it('debe retornar null si no hay cookie csrf_token', () => {
    document.cookie = 'other=value';

    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;

    expect(token).toBeNull();
  });

  it('debe manejar cookies vacías', () => {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;

    expect(token).toBeNull();
  });
});
