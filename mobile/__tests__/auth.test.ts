/**
 * Archivo: __tests__/auth.test.ts
 * Descripción: Tests básicos de autenticación para la app móvil.
 * 
 * Ejecutar: cd mobile && npx jest __tests__/auth.test.ts
 */

import { isJefe } from '../utils/roles';

// Mock del tipo UserResponse
function mockUser(overrides: Partial<{ role_name: string; occupation: string; is_active: boolean }> = {}) {
  return {
    id: '123',
    email: 'test@test.com',
    name: 'Test',
    last_name: 'User',
    role_name: 'employee',
    occupation: 'cortador',
    is_active: true,
    ...overrides,
  } as any;
}

describe('Utils — isJefe()', () => {
  it('retorna true si el usuario tiene role admin', () => {
    const user = mockUser({ role_name: 'admin' });
    expect(isJefe(user)).toBe(true);
  });

  it('retorna true si el usuario es employee con occupation jefe', () => {
    const user = mockUser({ role_name: 'employee', occupation: 'jefe' });
    expect(isJefe(user)).toBe(true);
  });

  it('retorna false si el usuario es employee con occupation cortador', () => {
    const user = mockUser({ role_name: 'employee', occupation: 'cortador' });
    expect(isJefe(user)).toBe(false);
  });

  it('retorna false si el usuario es client', () => {
    const user = mockUser({ role_name: 'client' });
    expect(isJefe(user)).toBe(false);
  });

  it('retorna false si el usuario es null', () => {
    expect(isJefe(null)).toBe(false);
  });

  it('retorna false si el usuario es undefined', () => {
    expect(isJefe(undefined)).toBe(false);
  });
});
