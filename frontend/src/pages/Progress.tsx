import { motion } from 'framer-motion'
import { BarChart2, Clock, CheckCircle, Zap } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function Progress() {
  const sessions: Array<{ id: string; name: string; status: string }> = (() => {
    try { return JSON.parse(localStorage.getItem('recent_sessions') ?? '[]') }
    catch { return [] }
  })()

  const active    = sessions.filter((s) => s.status === 'active').length
  const completed = sessions.filter((s) => s.status === 'ended').length
  const total     = sessions.length

  const stats = [
    { icon: Zap,         label: 'Sesiones activas',    value: active,    color: '#02C39A' },
    { icon: CheckCircle, label: 'Completadas',          value: completed,  color: '#028090' },
    { icon: BarChart2,   label: 'Total de sesiones',   value: total,      color: '#7ab8c8' },
    { icon: Clock,       label: 'Horas estimadas',     value: `${(total * 0.5).toFixed(1)}h`, color: '#3a6a7a' },
  ]

  const glass = {
    background: 'rgba(10,26,38,0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(5,102,141,0.2)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  } as const

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.4px', margin: 0 }}>Progreso</h1>
            <p style={{ fontSize: 13, color: '#3a6a7a', marginTop: 6 }}>Resumen de tu actividad de pair programming</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{ padding: '28px 28px', borderRadius: 16, ...glass }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={s.color} strokeWidth={2} />
                    </div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#3a6a7a' }}>{s.label}</div>
                </motion.div>
              )
            })}
          </div>

          {/* Lista de sesiones */}
          {sessions.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Historial</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(5,102,141,0.2)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: 12, ...glass }}
                  >
                    <span style={{ fontSize: 13, color: '#e8f4f8' }}>{s.name}</span>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, color: s.status === 'active' ? '#02C39A' : '#3a6a7a', background: s.status === 'active' ? 'rgba(2,195,154,0.07)' : 'rgba(5,102,141,0.06)', border: s.status === 'active' ? '1px solid rgba(2,195,154,0.3)' : '1px solid rgba(5,102,141,0.2)' }}>
                      {s.status === 'active' ? 'Activa' : 'Finalizada'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
