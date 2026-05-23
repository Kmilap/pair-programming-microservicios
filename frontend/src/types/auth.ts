// ============================================================================
// types/auth.ts
// Tipos compartidos para el flujo de autenticación.
// El backend (Laravel + tymon/jwt-auth) emite el JWT con claims custom
// (name, email, role) para Single Sign-On entre microservicios.
// ============================================================================

export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

// ----- Requests --------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// ----- Responses -------------------------------------------------------------
// Forma típica de respuesta de tymon/jwt-auth:
//   { access_token: "...", token_type: "bearer", expires_in: 3600, user: {...} }
//
// Si tu AuthController devuelve algo distinto, ajusta `LoginResponse`.

export interface LoginResponse {
  message?: string;
  token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

export interface ValidateResponse {
  valid: boolean;
  claims?: {
    sub: number;
    name: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
  };
}

// ----- Estado en cliente -----------------------------------------------------

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ----- Constantes de almacenamiento -----------------------------------------

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;