import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.tsx'
import ProtectedRoute from './components/ProtectedRoute'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import Session     from './pages/Session'
import Sessions    from './pages/Sessions'
import TeacherView from './pages/TeacherView'
import Progress    from './pages/Progress'
import Settings    from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sessions"  element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/progress"  element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/teacher"   element={<ProtectedRoute><TeacherView /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
