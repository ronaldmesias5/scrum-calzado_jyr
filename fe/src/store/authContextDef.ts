// ════════════════════════════════════════
// 📄 Definición del contexto de autenticación (separado del Provider)
// ════════════════════════════════════════

import { createContext } from 'react';
import type { AuthContextType } from '@/types/auth';

export const AuthContext = createContext<AuthContextType | null>(null);
