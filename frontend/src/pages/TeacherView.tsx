import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, Clock, Code2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import Sidebar from '../components/Sidebar'

interface ActiveSession {
  id: string
  status: string
  started_at: string
  editor_url: string
  editor_room_id: string
  host_user_id: number
  partner_user_id: number | null
  exercise: {
    id: number
    title: string
    statement: string
    difficulty: string
    language: string
    initial_code: string
  } | null
}

const TOKENS = [
  { t: '</>', x: '18%', delay: 0,  dur: 18 },
  { t: '{ }', x: '62%', delay: 5,  dur: 22 },
  { t: 'fn()', x: '80%', delay: 9,  dur: 16 },
  { t: '=>',   x: '40%', delay: 2,  dur: 20 },
]

export default function TeacherView() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [sessions, setSessions]   = useState<ActiveSession[]>([])
  const [loading,  setLoading]    = useState(true)
  const [lastPoll, setLastPoll]   = useState<Date>(new Date())

  // Redirigir si no es teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') navigate('/dashboard')
  }, [user, navigate])

  const fetchSessions = async () => {
    try {
      const { data } = await api.get<ActiveSession[]>('/sessions?status=active')
      setSessions(Array.isArray(data) ? data : [])
      setLastPoll(new Date())
    } catch {
      // silencioso — puede no haber sesiones activas
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10_000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const elapsed = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    return mins < 1 ? 'hace un momento' : `hace ${mins} min`
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

      {/* Fondo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <motion.div animate={{ opacity: [0.18, 0.28, 0.18] }} transition={{ duration: 6, repeat: Infinity }} style={{ position: 'absolute', top: '-10%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,128,144,0.15), transparent 70%)', filter: 'blur(90px)' }} />
        {TOKENS.map((tk) => (
          <motion.span key={tk.t + tk.x} style={{ position: 'absolute', left: tk.x, bottom: -30, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(2,195,154,0.1)', userSelect: 'none' }} animate={{ y: [0, -900], opacity: [0, 0.7, 0.7, 0] }} transition={{ duration: tk.dur, repeat: Infinity, delay: tk.delay, ease: 'linear', times: [0, 0.08, 0.92, 1] }}>{tk.t}</motion.span>
        ))}
      </div>

      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Eye size={22} color="#02C39A" strokeWidth={2} />
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.4px', margin: 0 }}>
                  Vista Profesor
                </h1>
              </div>
              <p style={{ fontSize: 13, color: '#3a6a7a', margin: 0 }}>
                {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} activa{sessions.length !== 1 ? 's' : ''} · Actualizado {lastPoll.toLocaleTimeString()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#02C39A' }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#02C39A', display: 'inline-block' }}
              />
              Monitoreo en vivo
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3a6a7a', fontSize: 14 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⟳</motion.span>
              Cargando sesiones activas…
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
              <Users size={48} color="#1e3a4a" strokeWidth={1} />
              <p style={{ fontSize: 15, color: '#3a6a7a', margin: 0 }}>No hay sesiones activas en este momento</p>
              <p style={{ fontSize: 12, color: '#1e3a4a', margin: 0 }}>El monitoreo se actualiza cada 10 segundos</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  whileHover={{ borderColor: 'rgba(2,195,154,0.4)', y: -2 }}
                  onClick={() => navigate(`/session/${session.id}`, {
                    state: {
                      readOnly: true,
                      // Construir sessionData en el formato que espera Session.tsx
                      // para que el ENUNCIADO y el editor carguen correctamente.
                      sessionData: {
                        session: {
                          id:         session.id,
                          status:     session.status,
                          started_at: session.started_at,
                          editor_url: session.editor_url,
                        },
                        exercise: session.exercise
                          ? {
                              id:           session.exercise.id,
                              title:        session.exercise.title,
                              statement:    session.exercise.statement,
                              difficulty:   session.exercise.difficulty,
                              language:     session.exercise.language,
                              initial_code: session.exercise.initial_code,
                            }
                          : null,
                        host: { id: session.host_user_id, name: '', email: '' },
                      },
                    },
                  })}
                  style={{
                    padding: '20px 22px', borderRadius: 16, cursor: 'pointer',
                    background: 'rgba(10,26,38,0.65)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(2,195,154,0.2)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                >
                  {/* Badge live */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(2,195,154,0.1)', border: '1px solid rgba(2,195,154,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Code2 size={14} color="#02C39A" strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(2,195,154,0.07)', border: '1px solid rgba(2,195,154,0.3)', color: '#02C39A', fontWeight: 500 }}>
                        En vivo
                      </span>
                    </div>
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#02C39A', display: 'inline-block' }}
                    />
                  </div>

                  {/* Ejercicio */}
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#e8f4f8', margin: '0 0 6px' }}>
                    {session.exercise?.title ?? 'Ejercicio sin título'}
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {session.exercise?.difficulty && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(5,102,141,0.3)', color: '#3a6a7a' }}>
                        {session.exercise.difficulty}
                      </span>
                    )}
                    {session.exercise?.language && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(5,102,141,0.3)', color: '#3a6a7a' }}>
                        {session.exercise.language}
                      </span>
                    )}
                  </div>

                  {/* Participantes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#7ab8c8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(2,128,144,0.15)', border: '1px solid rgba(2,128,144,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#028090' }}>H</div>
                      Estudiante #{session.host_user_id}
                    </div>
                    {session.partner_user_id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(2,195,154,0.1)', border: '1px solid rgba(2,195,154,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#02C39A' }}>P</div>
                        Estudiante #{session.partner_user_id}
                      </div>
                    ) : (
                      <div style={{ color: '#3a6a7a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(5,102,141,0.08)', border: '1px dashed rgba(5,102,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#3a6a7a' }}>?</div>
                        Esperando pareja…
                      </div>
                    )}
                  </div>

                  {/* Tiempo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, fontSize: 11, color: '#3a6a7a', borderTop: '1px solid rgba(5,102,141,0.15)', paddingTop: 12 }}>
                    <Clock size={11} strokeWidth={2} />
                    Iniciada {elapsed(session.started_at)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
