// ============================================================================
// contexts/AuthContext.ts
// Contexto compartido entre <AuthProvider> y el hook useAuth().
// Vive en un archivo aparte para cumplir con la regla react-refresh/only-export-components
// (los archivos que exportan componentes no deben exportar también valores/contextos).
// ============================================================================

import { createContext } from 'react';
import type { AuthState, LoginRequest } from '../types/auth';

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);