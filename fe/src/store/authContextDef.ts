/**
 * Archivo: context/authContextDef.ts
 * Descripción: Definición del contexto de autenticación (separado del Provider).
 * ¿Para qué? Evitar imports circulares entre AuthContext y useAuth.
 */

import { createContext } from "react";
import type { AuthContextType } from "@/types/auth";

export const AuthContext = createContext<AuthContextType | null>(null);
