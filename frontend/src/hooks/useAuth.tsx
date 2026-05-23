// ============================================================================
// hooks/useAuth.tsx
// AuthProvider: componente que envuelve la app y maneja el estado de sesión.
//
// El hook useAuth() vive en hooks/useAuth.ts (sin .x) para mantener este
// archivo "limpio" de exports no-componente y conservar Fast Refresh de Vite.
//
// Persistencia: localStorage. Al montar la app:
//   1. Lee token de localStorage.
//   2. Llama a /auth/validate para confirmar que sigue vivo.
//   3. Si es válido, hidrata el state. Si no, limpia todo.
// ============================================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { extractErrorMessage } from '../lib/api';
import {
  STORAGE_KEYS,
  type LoginRequest,
  type User,
} from '../types/auth';

// ----- Helpers de persistencia ----------------------------------------------

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: User): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// ----- Provider --------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // isLoading arranca en true: estamos rehidratando sesión desde localStorage.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ----- Rehidratación al montar la app -----
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = readStoredUser();

    if (!storedToken || !storedUser) {
      // Caso "no hay sesión guardada": marcar isLoading = false de inmediato.
      // Es síncrono adrede para evitar parpadeo del placeholder; el "doble render"
      // que advierte react-hooks aquí es deseable y no causa cascada visible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    // Optimismo: ponemos el state primero (UX rápida) y validamos en segundo plano.
    setToken(storedToken);
    setUser(storedUser);

    authService
      .validate(storedToken)
      .then((res) => {
        if (!res.valid) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        // Si /auth/validate falla (red, server caído), no expulsamos al usuario
        // del cliente: dejamos que el siguiente request 401 dispare el logout.
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ----- Login -----
  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      persistSession(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      setError(extractErrorMessage(err));
      throw err; // propagar para que el componente decida no redirigir
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ----- Logout -----
  const logout = useCallback(async () => {
    await authService.logout(); // best-effort, no bloquea
    clearSession();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, token, isLoading, error, login, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}