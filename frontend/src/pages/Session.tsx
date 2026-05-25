import { motion } from 'framer-motion'
import { Zap, Bug, BookOpen, ChevronLeft, Users } from 'lucide-react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import type { SessionData } from '../services/sessionService'
import CollaborativeEditor from '../components/CollaborativeEditor'
import { useAuth } from '../hooks/useAuth'

const aiActions = [
  { icon: <Zap size={14} strokeWidth={2} />, label: 'Pedir sugerencia', accent: true },
  { icon: <Bug size={14} strokeWidth={2} />, label: 'Analizar errores', accent: false },
  { icon: <BookOpen size={14} strokeWidth={2} />, label: 'Explicar código', accent: false },
]

export default function Session() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user } = useAuth()

  const sessionData = (location.state as { sessionData: SessionData } | null)?.sessionData ?? (() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('recent_sessions') ?? '[]')
      const found = sessions.find((s: any) => s.id === id)
      return found?.exerciseData ?? null
    } catch { return null }
  })()
  
  const exercise = sessionData?.exercise

  const readOnly = (location.state as any)?.readOnly ?? (() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('recent_sessions') ?? '[]')
      return sessions.find((s: any) => s.id === id)?.status === 'ended'
    } catch { return false }
  })()
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#081623', borderBottom: '1px solid rgba(5,102,141,0.18)', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3a6a7a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
          >
            <ChevronLeft size={14} strokeWidth={2} /> Dashboard
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(5,102,141,0.3)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8' }}>
              {exercise?.title ?? 'Cargando…'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: '#3a6a7a', marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {/* Pulsing live dot */}
                <span style={{ position: 'relative', width: 6, height: 6, display: 'inline-flex' }}>
                  <motion.span
                    animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#02C39A' }}
                  />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#02C39A', display: 'block' }} />
                </span>
                En vivo
              </span>

              {readOnly && (
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b' }}>
                  Solo lectura
                </span>
              )}

              <span>Sala: {id?.slice(0, 8) ?? '…'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={10} strokeWidth={2} /> 2 participantes
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            try {
              const sessions = JSON.parse(localStorage.getItem('recent_sessions') ?? '[]')
              const updated = sessions.map((s: any) =>
                s.id === id ? { ...s, status: 'ended' } : s
              )
              localStorage.setItem('recent_sessions', JSON.stringify(updated))
            } catch {}
            navigate('/dashboard')
          }}
          style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(220,60,60,0.35)', color: '#ff6b6b', background: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
        >
          Terminar sesión
        </button>
      </motion.header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Code editor — 7 parts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ flex: 7, display: 'flex', flexDirection: 'column', background: '#060f18', borderRight: '1px solid rgba(5,102,141,0.18)', position: 'relative', overflow: 'hidden' }}
        >
          {/* Subtle grid inside code area */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'linear-gradient(rgba(2,195,154,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.025) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />

          {/* Componente del Editor Colaborativo */}
          <CollaborativeEditor
            sessionId={id ?? 'default'}
            userId={user?.id ?? 0}
            userName={user?.name ?? 'Usuario'}
            language={exercise?.language ?? 'javascript'}
            initialCode={exercise?.initial_code ?? '// Cargando…'}
            readOnly={readOnly}
          />
        </motion.div>

        {/* Sidebar — 3 parts */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ flex: 3, display: 'flex', flexDirection: 'column', minWidth: 280, background: '#081623' }}
        >

          {/* Partner */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(5,102,141,0.18)' }}>
            <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Pareja</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#028090', flexShrink: 0 }}>CP</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8' }}>Camila P.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#02C39A', marginTop: 2 }}>
                  <span style={{ position: 'relative', width: 6, height: 6, display: 'inline-flex' }}>
                    <motion.span
                      animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2.3, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#02C39A' }}
                    />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#02C39A', display: 'block' }} />
                  </span>
                  En línea · editando
                </div>
              </div>
            </div>
          </div>

          {/* Problem statement dinámico */}
          <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', borderBottom: '1px solid rgba(5,102,141,0.18)' }}>
            <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Enunciado</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8', marginBottom: 12 }}>
              {exercise?.title ?? '—'}
            </p>
            <div style={{ fontSize: 12, color: '#7ab8c8', lineHeight: 1.7, padding: '14px 16px', borderRadius: 12, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.18)', whiteSpace: 'pre-wrap' }}>
              {exercise?.statement ?? '—'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(5,102,141,0.25)', color: '#3a6a7a' }}>{exercise?.difficulty ?? '—'}</span>
              <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(5,102,141,0.25)', color: '#3a6a7a' }}>{exercise?.language ?? '—'}</span>
            </div>
          </div>

          {/* AI assistant */}
          <div style={{ padding: '20px 24px', background: 'rgba(5,102,141,0.04)' }}>
            <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Copilot IA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {aiActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 12, fontSize: 12, textAlign: 'left', cursor: 'pointer',
                    ...(action.accent
                      ? { background: 'linear-gradient(135deg, #028090, #02C39A)', color: '#07101a', fontWeight: 700, border: 'none' }
                      : { background: 'rgba(5,102,141,0.07)', color: '#7ab8c8', border: '1px solid rgba(5,102,141,0.2)' }),
                  }}
                >
                  {action.icon} {action.label}
                </motion.button>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}