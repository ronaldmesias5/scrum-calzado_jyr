/**
 * Archivo: hooks/useAuth.ts
 * Descripción: Hook personalizado para acceder al contexto de autenticación.
 * ¿Para qué? Simplificar el acceso al AuthContext desde cualquier componente.
 */

import { useContext } from 'react';
import { AuthContext } from '@/store/authContextDef';
import type { AuthContextType } from '@/types/auth';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
