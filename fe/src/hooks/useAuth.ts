// ════════════════════════════════════════
// 📄 Hook personalizado para acceder al contexto de autenticación
// ════════════════════════════════════════

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
