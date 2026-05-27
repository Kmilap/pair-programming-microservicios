import { motion } from 'framer-motion'
import { Code2, Plus, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import type { SessionData } from '../services/sessionService'
import { useState } from 'react'
import NewSessionModal from '../components/NewSessionModal'
import Sidebar from '../components/Sidebar'
import NotificationWidget from '../components/NotificationWidget'

const TOKENS = [
  { t: '</>', x: '18%', delay: 0,  dur: 18 },
  { t: '{ }', x: '62%', delay: 5,  dur: 22 },
  { t: 'fn()', x: '80%', delay: 9,  dur: 16 },
  { t: '=>',   x: '40%', delay: 2,  dur: 20 },
  { t: '++',   x: '55%', delay: 13, dur: 17 },
  { t: 'async',x: '72%', delay: 7,  dur: 19 },
]

const glass = {
  background: 'rgba(10,26,38,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(5,102,141,0.2)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
} as const

export default function Dashboard() {
  const navigate = useNavigate()
  const [starting,  setStarting]  = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string | number
    name: string
    lang: string
    difficulty: string
    partner?: string | null
    status: string
    exerciseData?: SessionData
  }>>(() => {
    try {
      const raw = localStorage.getItem('recent_sessions')
      return raw ? (JSON.parse(raw) as []) : []
    } catch { return [] }
  })

  const handleNewSession = async (exerciseId: number | null) => {
    setStarting(true)
    try {
      const data = await sessionService.start(exerciseId ?? undefined)
      const newSession = {
        id: data.session.id,
        name: data.exercise.title,
        lang: data.exercise.language,
        difficulty: data.exercise.difficulty,
        status: 'active',
        exerciseData: data,
      }
      const updated = [newSession, ...recentSessions].slice(0, 10)
      localStorage.setItem('recent_sessions', JSON.stringify(updated))
      setRecentSessions(updated)
      setModalOpen(false)
      navigate(`/session/${data.session.id}`, { state: { sessionData: data } })
    } catch (err) {
      console.error('Error starting session:', err)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

      {/* Fondo animado */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <motion.div animate={{ opacity: [0.18, 0.28, 0.18] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: '-10%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,128,144,0.18), transparent 70%)', filter: 'blur(90px)' }} />
        {TOKENS.map((tk) => (
          <motion.span key={tk.t + tk.x} style={{ position: 'absolute', left: tk.x, bottom: -30, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(2,195,154,0.1)', letterSpacing: '0.05em', userSelect: 'none' }} animate={{ y: [0, -900], opacity: [0, 0.7, 0.7, 0] }} transition={{ duration: tk.dur, repeat: Infinity, delay: tk.delay, ease: 'linear', times: [0, 0.08, 0.92, 1] }}>{tk.t}</motion.span>
        ))}
      </div>

      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.4px', margin: 0 }}>Mis sesiones</h1>
              <p style={{ fontSize: 13, color: '#3a6a7a', marginTop: 6 }}>{recentSessions.length} sesiones en total</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* B5 — Widget de notificaciones con polling 5s */}
              <NotificationWidget />
              <motion.button
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#07101a', background: 'linear-gradient(135deg, #028090, #02C39A)', border: 'none', cursor: 'pointer' }}
              >
                <Plus size={14} strokeWidth={2.5} /> Nueva sesión
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ borderRadius: 16, marginBottom: 40, overflow: 'hidden', ...glass }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { label: 'Sesiones activas', value: recentSessions.filter(s => s.status === 'active').length.toString(), highlight: true },
                { label: 'Completadas',       value: recentSessions.filter(s => s.status === 'ended').length.toString(), highlight: false },
                { label: 'Horas totales',     value: `${(recentSessions.length * 0.5).toFixed(1)}h`, highlight: false },
              ].map((stat, i) => (
                <div key={stat.label} style={{ padding: '28px 32px', borderRight: i < 2 ? '1px solid rgba(5,102,141,0.2)' : 'none' }}>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} style={{ fontSize: 32, fontWeight: 700, color: stat.highlight ? '#02C39A' : '#e8f4f8', letterSpacing: '-0.5px', marginBottom: 6 }}>
                    {stat.value}
                  </motion.div>
                  <div style={{ fontSize: 11, color: '#3a6a7a' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>Sesiones recientes</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(5,102,141,0.2)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
                whileHover={{ borderColor: session.status === 'active' ? 'rgba(2,195,154,0.4)' : 'rgba(2,128,144,0.35)' }}
                onClick={() => navigate(`/session/${session.id}`, { state: { sessionData: session.exerciseData, readOnly: session.status === 'ended' } })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderRadius: 14, cursor: 'pointer', ...glass, border: session.status === 'active' ? '1px solid rgba(2,195,154,0.2)' : '1px solid rgba(5,102,141,0.18)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: session.status === 'active' ? 'rgba(2,195,154,0.1)' : 'rgba(5,102,141,0.1)', border: session.status === 'active' ? '1px solid rgba(2,195,154,0.2)' : '1px solid rgba(5,102,141,0.2)' }}>
                    <Code2 size={15} strokeWidth={2} color={session.status === 'active' ? '#02C39A' : '#3a6a7a'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8' }}>{session.name}</div>
                    <div style={{ fontSize: 12, color: '#3a6a7a', marginTop: 3 }}>
                      {session.lang} · {session.difficulty}{session.partner && ` · ${session.partner}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 10, padding: '4px 12px', borderRadius: 20, fontWeight: 500, color: session.status === 'active' ? '#02C39A' : '#3a6a7a', background: session.status === 'active' ? 'rgba(2,195,154,0.07)' : 'rgba(5,102,141,0.06)', border: session.status === 'active' ? '1px solid rgba(2,195,154,0.3)' : '1px solid rgba(5,102,141,0.2)' }}>
                    {session.status === 'active' ? 'Activa' : 'Finalizada'}
                  </span>
                  <ChevronRight size={14} strokeWidth={2} color="#3a6a7a" />
                </div>
              </motion.div>
            ))}

            <motion.div
              onClick={() => setModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px', borderRadius: 14, cursor: 'pointer', border: '1px dashed rgba(5,102,141,0.3)' }}
            >
              <Plus size={14} strokeWidth={1.5} color="#3a6a7a" />
              <span style={{ fontSize: 13, color: '#3a6a7a' }}>Nueva sesión</span>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <NewSessionModal open={modalOpen} onClose={() => setModalOpen(false)} onStart={handleNewSession} loading={starting} />
    </div>
  )
}
