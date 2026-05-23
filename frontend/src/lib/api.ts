// ============================================================================
// lib/api.ts
// Cliente HTTP axios con interceptores para JWT.
//
// Patrón arquitectónico: API Gateway
//   El frontend SIEMPRE habla con http://localhost (Traefik).
//   Traefik enruta /auth/*, /sessions/*, /editor/*, /ai/*, /notifications/*
//   al microservicio correspondiente. El frontend no conoce los servicios
//   directamente; eso es exactamente lo que se busca en microservicios.
//
// Patrón: Single Sign-On
//   El interceptor de request adjunta el JWT en cada llamada saliente.
//   Cualquier servicio downstream puede validarlo contra /auth/validate.
// ============================================================================

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../types/auth';

// Base URL: Traefik está en localhost:80. Si más adelante exponen el frontend
// fuera del host, mover esto a una variable de entorno VITE_API_BASE_URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ----- Request interceptor: añade Bearer si hay token ------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ----- Response interceptor: si 401, limpia sesión y redirige a /login -------
//
// Nota: NO redirigimos con react-router aquí porque este módulo vive fuera
// del árbol de componentes. Usamos window.location para forzar reload limpio.
// Esto además asegura que el AuthContext se reinicialice al volver a /login.

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isOnLoginPage = window.location.pathname === '/login';
      if (!isOnLoginPage) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ----- Helper: extraer mensaje de error legible para la UI -------------------

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Errores de red (servicio caído, CORS, timeout)
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica que los servicios estén corriendo.';
    }
    // Errores HTTP con cuerpo
    const data = error.response.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    // Códigos comunes
    if (error.response.status === 401) return 'Credenciales inválidas.';
    if (error.response.status === 422) return 'Datos inválidos. Revisa email y contraseña.';
    if (error.response.status >= 500) return 'Error del servidor. Intenta de nuevo en un momento.';
  }
  return 'Ocurrió un error inesperado.';
}