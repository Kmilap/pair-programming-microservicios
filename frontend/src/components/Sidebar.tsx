import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Code2, Settings, LogOut, Eye } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard',  matchExact: true  },
  { icon: Code2,           label: 'Sesiones',  path: '/sessions',   matchExact: false },
  { icon: Settings,        label: 'Ajustes',   path: '/settings',   matchExact: true  },
]

const TEACHER_ITEM = { icon: Eye, label: 'Vista Profesor', path: '/teacher', matchExact: true }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  const initials = user?.name
    ? (user.name.split(' ')[0][0] + (user.name.split(' ')[2]?.[0] ?? user.name.split(' ')[1]?.[0] ?? '')).toUpperCase()
    : 'US'

  const displayName = user?.name
    ? user.name.split(' ')[0] + (user.name.split(' ')[2] ? ' ' + user.name.split(' ')[2] : '')
    : '—'

  const items = user?.role === 'teacher' ? [...NAV, TEACHER_ITEM] : NAV

  // Smart active detection: Sesiones stays active when inside /session/:id
  const isActive = (item: typeof NAV[0]) => {
    if (item.matchExact) return location.pathname === item.path
    // /sessions matches /sessions AND /session/:id (detail view)
    return location.pathname === item.path || location.pathname.startsWith('/session/')
  }

  return (
    <aside style={{
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#081623',
      borderRight: '1px solid rgba(5,102,141,0.18)', height: '100vh',
      position: 'relative', zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(5,102,141,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #028090, #02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(2,195,154,0.25)' }}>
            <Code2 size={15} strokeWidth={2.5} color="#07101a" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.3px' }}>Micro-Pair</div>
            <div style={{ fontSize: 9, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 1 }}>Pair Programming</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 9, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '4px 8px', marginBottom: 6 }}>
          Navegación
        </div>
        {items.map((item) => {
          const active = isActive(item)
          const Icon   = item.icon
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, border: 'none', textAlign: 'left', width: '100%',
                color:      active ? '#02C39A' : '#4a7a8a',
                background: active ? 'rgba(2,195,154,0.08)' : 'transparent',
                borderLeft: active ? '2px solid #02C39A' : '2px solid transparent',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(5,102,141,0.08)'
                  e.currentTarget.style.color = '#7ab8c8'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#4a7a8a'
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
              {active && (
                <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#02C39A', boxShadow: '0 0 6px rgba(2,195,154,0.6)' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Perfil + logout */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid rgba(5,102,141,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 12, background: 'rgba(5,102,141,0.06)', marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(2,128,144,0.3), rgba(2,195,154,0.2))', border: '1px solid rgba(2,195,154,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#02C39A', flexShrink: 0, letterSpacing: '0.05em' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f4f8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: '#2a5a6a', textTransform: 'capitalize' }}>{user?.role ?? '—'}</div>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/login', { replace: true }) }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3a6a7a', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, width: '100%', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.background = 'rgba(220,60,60,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#3a6a7a'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={13} strokeWidth={2} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
