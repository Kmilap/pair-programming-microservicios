import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Search, ChevronRight, Plus } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import NewSessionModal from '../components/NewSessionModal'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { sessionService } from '../services/sessionService'
import type { SessionData } from '../services/sessionService'

type FilterStatus = 'all' | 'active' | 'ended'

interface SessionRow {
  id: string | number
  name?: string
  status: string
  lang?: string
  difficulty?: string
  exerciseData?: SessionData
  exercise?: { title: string; difficulty: string; language: string }
}

const glass = {
  background: 'rgba(10,26,38,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(5,102,141,0.2)',
} as const

export default function Sessions() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  const [filter,     setFilter]     = useState<FilterStatus>('all')
  const [search,     setSearch]     = useState('')
  const [sessions,   setSessions]   = useState<SessionRow[]>([])
  const [modalOpen,  setModalOpen]  = useState(false)
  const [starting,   setStarting]   = useState(false)

  useEffect(() => {
    api.get<SessionRow[]>('/sessions')
      .then(({ data }) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {
        try { setSessions(JSON.parse(localStorage.getItem('recent_sessions') ?? '[]')) }
        catch { setSessions([]) }
      })
  }, [])

  const handleNewSession = async (exerciseId: number | null) => {
    setStarting(true)
    try {
      const data = await sessionService.start(exerciseId ?? undefined)
      const newRow: SessionRow = {
        id:           data.session.id,
        name:         data.exercise.title,
        lang:         data.exercise.language,
        difficulty:   data.exercise.difficulty,
        status:       'active',
        exerciseData: data,
      }
      const updated = [newRow, ...sessions].slice(0, 10)
      localStorage.setItem('recent_sessions', JSON.stringify(updated))
      setSessions(updated)
      setModalOpen(false)
      navigate(`/session/${data.session.id}`, { state: { sessionData: data } })
    } catch (err) {
      console.error('Error starting session:', err)
    } finally {
      setStarting(false)
    }
  }

  const title    = (s: SessionRow) => s.exercise?.title ?? s.name ?? 'Sesión'
  const lang     = (s: SessionRow) => s.exercise?.language ?? s.lang ?? '—'
  const diff     = (s: SessionRow) => s.exercise?.difficulty ?? s.difficulty ?? '—'

  const filtered = sessions
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => !search || title(s).toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.025) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.4px', margin: 0 }}>
                {isTeacher ? 'Todas las sesiones' : 'Sesiones'}
              </h1>
              <p style={{ fontSize: 13, color: '#3a6a7a', marginTop: 6 }}>
                {isTeacher
                  ? 'Historial completo de sesiones del sistema (visible solo para profesores).'
                  : 'Historial completo de sesiones de pair programming'}
              </p>
            </div>
            {!isTeacher && (
              <motion.button
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#07101a', background: 'linear-gradient(135deg, #028090, #02C39A)', border: 'none', cursor: 'pointer' }}
              >
                <Plus size={14} strokeWidth={2.5} /> Nueva sesión
              </motion.button>
            )}
          </div>

          {/* Búsqueda y filtros */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#3a6a7a', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio…"
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, fontSize: 13, background: 'rgba(10,26,38,0.65)', border: '1px solid rgba(5,102,141,0.2)', color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'active', 'ended'] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12,
                    fontWeight: filter === f ? 600 : 400,
                    border:      filter === f ? '1px solid rgba(2,195,154,0.3)'  : '1px solid rgba(5,102,141,0.2)',
                    background:  filter === f ? 'rgba(2,195,154,0.1)'             : 'rgba(10,26,38,0.65)',
                    color:       filter === f ? '#02C39A'                         : '#3a6a7a',
                    transition: 'all 0.15s',
                  }}
                >
                  {{ all: 'Todas', active: 'Activas', ended: 'Finalizadas' }[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <div style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
            {/* Cabecera */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', padding: '12px 22px', borderBottom: '1px solid rgba(5,102,141,0.15)', fontSize: 10, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <span>Ejercicio</span>
              <span>Dificultad</span>
              <span>Lenguaje</span>
              <span>Estado</span>
              <span />
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '56px', textAlign: 'center', color: '#3a6a7a', fontSize: 13 }}>
                {search ? `Sin resultados para "${search}"` : 'No hay sesiones todavía.'}
              </div>
            ) : filtered.map((s, i) => (
              <motion.div
                key={s.id ?? i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/session/${s.id}`, { state: { readOnly: s.status === 'ended', sessionData: s.exerciseData ?? s } })}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                  padding: '16px 22px', cursor: 'pointer', transition: 'background 0.15s',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(5,102,141,0.08)' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2,195,154,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Ejercicio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: s.status === 'active' ? 'rgba(2,195,154,0.1)' : 'rgba(5,102,141,0.1)', border: s.status === 'active' ? '1px solid rgba(2,195,154,0.2)' : '1px solid rgba(5,102,141,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Code2 size={13} color={s.status === 'active' ? '#02C39A' : '#3a6a7a'} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 14, color: '#e8f4f8', fontWeight: 500 }}>{title(s)}</span>
                </div>

                <span style={{ fontSize: 12, color: '#3a6a7a', alignSelf: 'center' }}>{diff(s)}</span>
                <span style={{ fontSize: 12, color: '#3a6a7a', alignSelf: 'center' }}>{lang(s)}</span>

                <div style={{ alignSelf: 'center' }}>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 500, color: s.status === 'active' ? '#02C39A' : '#3a6a7a', background: s.status === 'active' ? 'rgba(2,195,154,0.07)' : 'rgba(5,102,141,0.06)', border: s.status === 'active' ? '1px solid rgba(2,195,154,0.3)' : '1px solid rgba(5,102,141,0.2)' }}>
                    {s.status === 'active' ? 'Activa' : 'Finalizada'}
                  </span>
                </div>

                <ChevronRight size={14} color="#3a6a7a" style={{ alignSelf: 'center', justifySelf: 'center' }} />
              </motion.div>
            ))}
          </div>

          {/* Nueva sesión vacía CTA */}
          {filtered.length === 0 && !search && !isTeacher && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              onClick={() => setModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px', borderRadius: 14, cursor: 'pointer', border: '1px dashed rgba(5,102,141,0.3)', marginTop: 12 }}
            >
              <Plus size={14} strokeWidth={1.5} color="#3a6a7a" />
              <span style={{ fontSize: 13, color: '#3a6a7a' }}>Nueva sesión</span>
            </motion.div>
          )}

        </motion.div>
      </main>

      <NewSessionModal open={modalOpen} onClose={() => setModalOpen(false)} onStart={handleNewSession} loading={starting} />
    </div>
  )
}
