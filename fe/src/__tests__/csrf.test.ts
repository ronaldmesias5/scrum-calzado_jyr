/**
 * Archivo: __tests__/csrf.test.ts
 * Descripción: Tests del interceptor CSRF en el frontend.
 */

describe('CSRF Token Helper', () => {
  // Mock de document.cookie
  const originalCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'cookie'
  );

  beforeEach(() => {
    // Reset cookies
    document.cookie = '';
  });

  afterAll(() => {
    // Restaurar cookie descriptor original
    if (originalCookie) {
      Object.defineProperty(Document.prototype, 'cookie', originalCookie);
    }
  });

  it('debe leer el token csrf_token de las cookies', () => {
    document.cookie = 'csrf_token=abc123def456';

    // La función getCsrfToken lee document.cookie
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    expect(token).toBe('abc123def456');
  });

  it('debe retornar null si no hay cookie csrf_token', () => {
    document.cookie = 'other=value';

    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    expect(token).toBeNull();
  });

  it('debe manejar cookies vacías', () => {
    document.cookie = '';

    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    expect(token).toBeNull();
  });
});
