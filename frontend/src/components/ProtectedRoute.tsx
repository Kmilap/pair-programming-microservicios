// ============================================================================
// components/ProtectedRoute.tsx
// Wrapper de rutas que requiere autenticación.
// Si no hay sesión válida, redirige a /login.
// Si está rehidratando (isLoading), muestra un placeholder mínimo.
// ============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mientras rehidratamos sesión, evitamos parpadeo a /login.
  // Spinner mínimo, alineado con la paleta del Login de Noel.
  if (isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#07101a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7ab8c8',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    // Guardamos la URL original para volver tras el login (mejora UX futura).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}