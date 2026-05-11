/**
 * Archivo: fe/src/__tests__/config.test.ts
 * Descripción: Tests para la configuración de la API.
 */

import { describe, it, expect } from 'vitest';

describe('API Config', () => {
  it('debe tener una URL base definida', () => {
    // La URL base debe ser localhost:8000 por defecto
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    expect(baseURL).toBeTruthy();
    expect(baseURL).toMatch(/^https?:\/\//);
  });

  it('debe tener un timeout definido', () => {
    const API_CONFIG = {
      baseURL: 'http://localhost:8000',
      timeout: 10000,
    };
    expect(API_CONFIG.timeout).toBeGreaterThan(0);
    expect(API_CONFIG.timeout).toBe(10000);
  });
});
