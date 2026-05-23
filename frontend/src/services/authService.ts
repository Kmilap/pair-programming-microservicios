// ============================================================================
// services/authService.ts
// Capa de servicio para hablar con el microservicio Auth.
// El frontend NO conoce que Auth está en Laravel: solo conoce los endpoints
// expuestos vía Traefik. Esto es lo que hace que la arquitectura sea limpia.
// ============================================================================

import { api } from '../lib/api';
import type {
  LoginRequest,
  LoginResponse,
  User,
  ValidateResponse,
} from '../types/auth';

export const authService = {
  /**
   * POST /auth/login
   * Devuelve { access_token, token_type, expires_in, user }.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * GET /auth/me  (requiere JWT)
   * Devuelve los datos del usuario autenticado.
   */
  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  /**
   * POST /auth/validate
   * Valida un JWT sin necesidad de estar autenticado.
   * Usado principalmente por otros microservicios; útil aquí para
   * comprobar al inicializar la app si el token guardado sigue vivo.
   */
  async validate(token: string): Promise<ValidateResponse> {
    const { data } = await api.post<ValidateResponse>('/auth/validate', { token });
    return data;
  },

  /**
   * POST /auth/logout  (requiere JWT)
   * Invalida el token en el servidor. Es buena práctica llamarlo,
   * pero si falla NO debemos bloquear el logout local.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silencioso: aunque el server falle, el cliente debe poder cerrar sesión.
    }
  },
};