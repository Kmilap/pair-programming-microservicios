import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Code2, Lock, Mail, User, Users } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { RegisterRequest, LoginResponse } from '../types/auth'
import { STORAGE_KEYS } from '../types/auth'

// 1. Configuración de tokens flotantes para el fondo
const TOKENS = [
  { t: '</>', x: '7%', delay: 0, dur: 11 },
  { t: 'def', x: '81%', delay: 1.8, dur: 13 },
  { t: '{ }', x: '54%', delay: 3.5, dur: 12 },
  { t: 'fn()', x: '91%', delay: 0.9, dur: 9.5 },
  { t: '=>', x: '21%', delay: 2.3, dur: 14 },
  { t: '===', x: '67%', delay: 4.4, dur: 10.5 },
  { t: 'async', x: '39%', delay: 0.4, dur: 12 },
  { t: '++', x: '75%', delay: 2.9, dur: 9 },
]

export default function Register() {
  const [form, setForm] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()

  const set = (key: keyof RegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setFormError(null)

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Todos los campos son obligatorios.')
      return
    }
    if (form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post<LoginResponse>('/auth/register', form)
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } }
      }
      const msg = error.response?.data?.message || error.response?.data?.error
      setFormError(msg || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(8,22,35,0.85)',
    border: '1px solid rgba(5,102,141,0.3)',
    borderRadius: 12,
    padding: '13px 14px 13px 42px',
    fontSize: 13,
    color: '#e8f4f8',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Fondo con Grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(2,195,154,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.045) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      
      {/* Resplandor Ambiental */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,128,144,0.13), transparent 70%)', filter: 'blur(85px)', pointerEvents: 'none' }} />

      {/* 2. Mapeo de Tokens Flotantes */}
      {TOKENS.map((tk) => (
        <motion.span
          key={tk.t + tk.x}
          style={{ position: 'absolute', left: tk.x, bottom: -40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(2,195,154,0.17)', letterSpacing: '0.05em', userSelect: 'none', pointerEvents: 'none' }}
          animate={{ y: [0, -920], opacity: [0, 0.95, 0.95, 0] }}
          transition={{ duration: tk.dur, repeat: Infinity, delay: tk.delay, ease: 'linear', times: [0, 0.07, 0.93, 1] }}
        >
          {tk.t}
        </motion.span>
      ))}

      {/* Tarjeta de Registro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400, background: 'rgba(10, 26, 38, 0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(5,102,141,0.22)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #028090, #02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code2 size={15} strokeWidth={2.5} color="#07101a" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>Micro-Pair</div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.5px', marginBottom: 8 }}>Crear cuenta</h1>
        <p style={{ fontSize: 13, color: '#7ab8c8', marginBottom: 28 }}>Únete a la plataforma</p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Campo: Nombre */}
            <div>
              <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>Nombre completo</label>
              <div style={{ position: 'relative' }}>
                <User size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Tu nombre" value={form.name} onChange={set('name')} disabled={submitting} autoComplete="name" style={inputStyle} />
              </div>
            </div>

            {/* Campo: Email */}
            <div>
              <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" placeholder="usuario@unab.edu.co" value={form.email} onChange={set('email')} disabled={submitting} autoComplete="email" style={inputStyle} />
              </div>
            </div>

            {/* Campo: Password */}
            <div>
              <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} disabled={submitting} autoComplete="new-password" style={inputStyle} />
              </div>
            </div>

            {/* Campo: Rol */}
            <div>
              <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>Rol</label>
              <div style={{ position: 'relative' }}>
                <Users size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select value={form.role} onChange={set('role')} disabled={submitting}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  <option value="student">Estudiante</option>
                  <option value="teacher">Docente</option>
                </select>
              </div>
            </div>

            {/* Error Display */}
            {formError && (
              <div role="alert" style={{ fontSize: 12, color: '#ff8aa5', background: 'rgba(255,138,165,0.06)', border: '1px solid rgba(255,138,165,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                {formError}
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : undefined}
              whileTap={!submitting ? { scale: 0.98 } : undefined}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#07101a', background: 'linear-gradient(135deg, #028090, #02C39A)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4, opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s ease' }}
            >
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </motion.button>
          </div>
        </form>

        <p style={{ fontSize: 12, color: '#3a6a7a', textAlign: 'center', marginTop: 24 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#00A896', textDecoration: 'none', fontWeight: 500 }}>Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  )
}