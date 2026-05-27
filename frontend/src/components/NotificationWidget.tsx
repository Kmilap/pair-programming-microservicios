import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, AlertCircle, BarChart2, Star, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: number
  type: string
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

interface SessionReport {
  summary?: string
  code_quality?: { score: number; feedback: string }
  collaboration?: { score: number; feedback: string }
  suggestions?: string[]
  highlights?: string[]
  source?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIcon(type: string) {
  if (type === 'session_report') return <BarChart2 size={14} color="#02C39A" />
  if (type === 'session.started') return <CheckCircle size={14} color="#028090" />
  return <AlertCircle size={14} color="#3a6a7a" />
}

function getLabel(type: string): string {
  return (
    {
      'session.started': 'Sesión iniciada',
      'session.ended': 'Sesión finalizada',
      session_report: 'Reporte IA disponible',
    }[type] ?? type
  )
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#02C39A' : score >= 5 ? '#ffc107' : '#ff6b6b'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 700, color,
      padding: '2px 6px', borderRadius: 5,
      background: `${color}18`,
      border: `1px solid ${color}40`,
    }}>
      <Star size={9} fill={color} /> {score}/10
    </span>
  )
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function NotificationWidget() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen]     = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Polling cada 5 segundos ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const fetch_ = async () => {
      try {
        const { data } = await api.get<NotificationItem[]>(`/notifications?userId=${user.id}`)
        setNotifications(Array.isArray(data) ? data : [])
      } catch {
        // silencioso — el servicio puede no estar disponible aún
      }
    }

    fetch_()
    const interval = setInterval(fetch_, 5_000)
    return () => clearInterval(interval)
  }, [user?.id])

  // ── Cerrar al hacer click fuera ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const unread = notifications.filter((n) => !n.read_at).length

  // Marcar como leída al expandir
  const handleExpand = async (n: NotificationItem) => {
    const next = expanded === n.id ? null : n.id
    setExpanded(next)
    if (next && !n.read_at) {
      try {
        await api.patch(`/notifications/${n.id}/read`)
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item
          )
        )
      } catch { /* silencioso */ }
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>

      {/* ── Campana ──────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          background: open ? 'rgba(2,195,154,0.1)' : 'none',
          border: open ? '1px solid rgba(2,195,154,0.25)' : '1px solid transparent',
          borderRadius: 10,
          cursor: 'pointer',
          color: open ? '#02C39A' : '#3a6a7a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          transition: 'all 0.15s',
        }}
      >
        <Bell size={16} strokeWidth={2} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: 4, right: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: '#02C39A', color: '#07101a',
                fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 340, maxHeight: 480, overflowY: 'auto',
              background: '#0d1e2e',
              border: '1px solid rgba(5,102,141,0.3)',
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(2,195,154,0.05)',
              zIndex: 1000,
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(5,102,141,0.15)',
              position: 'sticky', top: 0, background: '#0d1e2e', zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8f4f8' }}>
                  Notificaciones
                </span>
                {unread > 0 && (
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(2,195,154,0.12)', color: '#02C39A',
                    border: '1px solid rgba(2,195,154,0.25)', fontWeight: 600,
                  }}>
                    {unread} nuevas
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a6a7a', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Lista */}
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Bell size={24} color="rgba(5,102,141,0.3)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#3a6a7a', margin: 0 }}>
                  Sin notificaciones aún
                </p>
                <p style={{ fontSize: 10, color: '#1e3a4a', margin: '4px 0 0' }}>
                  Termina una sesión para ver el análisis IA
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  expanded={expanded === n.id}
                  onToggle={() => handleExpand(n)}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Fila individual ──────────────────────────────────────────────────────────

function NotificationRow({
  notification: n,
  expanded,
  onToggle,
}: {
  notification: NotificationItem
  expanded: boolean
  onToggle: () => void
}) {
  const isReport = n.type === 'session_report'
  const report   = isReport ? (n.payload?.report as SessionReport | undefined) : undefined

  return (
    <div
      onClick={onToggle}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(5,102,141,0.08)',
        background: n.read_at ? 'transparent' : 'rgba(2,195,154,0.04)',
        cursor: isReport ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    >
      {/* Cabecera de la fila */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>{getIcon(n.type)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e8f4f8' }}>
              {getLabel(n.type)}
            </span>
            {isReport && (
              <Zap size={11} color="#02C39A" style={{ flexShrink: 0 }} />
            )}
          </div>

          {/* Subtítulo */}
          {n.payload?.exerciseTitle && (
            <p style={{ fontSize: 11, color: '#3a6a7a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {n.payload.exerciseTitle as string}
            </p>
          )}

          {/* Preview del reporte (siempre visible) */}
          {isReport && report?.summary && !expanded && (
            <p style={{
              fontSize: 11, color: '#7ab8c8', margin: '4px 0 0',
              lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {report.summary}
            </p>
          )}

          <p style={{ fontSize: 10, color: '#2a5a6a', margin: '4px 0 0' }}>
            {timeAgo(n.created_at)}
          </p>
        </div>
      </div>

      {/* Detalle expandido del reporte B5 */}
      <AnimatePresence>
        {expanded && isReport && report && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginTop: 10 }}
          >
            {/* Summary */}
            {report.summary && (
              <p style={{
                fontSize: 11, color: '#7ab8c8', lineHeight: 1.6,
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(5,102,141,0.07)',
                border: '1px solid rgba(5,102,141,0.18)',
                margin: '0 0 8px',
              }}>
                {report.summary}
              </p>
            )}

            {/* Scores */}
            {(report.code_quality || report.collaboration) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {report.code_quality && (
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Código</span>
                      <ScoreBadge score={report.code_quality.score} />
                    </div>
                    <p style={{ fontSize: 10, color: '#7ab8c8', margin: 0, lineHeight: 1.5 }}>
                      {report.code_quality.feedback}
                    </p>
                  </div>
                )}
                {report.collaboration && (
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equipo</span>
                      <ScoreBadge score={report.collaboration.score} />
                    </div>
                    <p style={{ fontSize: 10, color: '#7ab8c8', margin: 0, lineHeight: 1.5 }}>
                      {report.collaboration.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Highlights */}
            {report.highlights && report.highlights.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 9, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Puntos positivos</p>
                {report.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
                    <span style={{ color: '#02C39A', fontSize: 10, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 10, color: '#7ab8c8', margin: 0, lineHeight: 1.5 }}>{h}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions && report.suggestions.length > 0 && (
              <div>
                <p style={{ fontSize: 9, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Mejoras sugeridas</p>
                {report.suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
                    <span style={{ color: '#028090', fontSize: 10, marginTop: 1, flexShrink: 0 }}>→</span>
                    <p style={{ fontSize: 10, color: '#7ab8c8', margin: 0, lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
