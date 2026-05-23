// ============================================================================
// hooks/useAuth.ts
// Hook que consume el AuthContext. Sin JSX → archivo .ts (sin x).
// Vive aparte del Provider para satisfacer react-refresh/only-export-components.
// ============================================================================

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}