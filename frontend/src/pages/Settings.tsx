import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, LogOut, Bell, Palette, ChevronRight, Edit3, Check, X as XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import Sidebar from '../components/Sidebar'

type Tab = 'profile' | 'preferences'

const glass = {
  background: 'rgba(10,26,38,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(5,102,141,0.2)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
} as const

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile',     label: 'Perfil',       icon: User    },
  { id: 'preferences', label: 'Preferencias', icon: Palette },
]

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // ── Edición de nombre ───────────────────────────────────────────
  const [editingName, setEditingName]   = useState(false)
  const [nameInput,   setNameInput]     = useState(user?.name ?? '')
  const [saving,      setSaving]        = useState(false)
  const [saveError,   setSaveError]     = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess]   = useState(false)

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (trimmed.length < 2 || trimmed.length > 100) {
      setSaveError('El nombre debe tener entre 2 y 100 caracteres')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const response = await api.put('/auth/me', { name: trimmed })
      const updatedUser = response.data.user
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setSaveSuccess(true)
      setEditingName(false)
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo guardar el nombre'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNameInput(user?.name ?? '')
    setEditingName(false)
    setSaveError(null)
  }

  const initials = user?.name
    ? (user.name.split(' ')[0][0] + (user.name.split(' ')[2]?.[0] ?? user.name.split(' ')[1]?.[0] ?? '')).toUpperCase()
    : 'US'

  const roleLabel: Record<string, string> = {
    teacher: 'Profesor',
    student: 'Estudiante',
    admin:   'Administrador',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.025) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ maxWidth: 640, width: '100%' }}>

          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.4px', margin: 0 }}>Ajustes</h1>
            <p style={{ fontSize: 13, color: '#3a6a7a', marginTop: 6 }}>Gestiona tu cuenta y preferencias de la plataforma</p>
          </div>

          {/* Profile hero card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ ...glass, borderRadius: 20, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(2,128,144,0.35), rgba(2,195,154,0.25))',
                border: '2px solid rgba(2,195,154,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#02C39A', letterSpacing: '0.04em',
                boxShadow: '0 0 20px rgba(2,195,154,0.15)',
              }}>
                {initials}
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#02C39A', border: '2px solid #07101a', boxShadow: '0 0 8px rgba(2,195,154,0.5)' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={saving}
                    autoFocus
                    style={{
                      fontSize: 20, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.3px',
                      background: 'rgba(5,102,141,0.15)',
                      border: '1px solid rgba(2,195,154,0.4)',
                      borderRadius: 10, padding: '6px 12px', outline: 'none', width: '100%',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSaveName} disabled={saving} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, color: '#02C39A', background: 'rgba(2,195,154,0.1)',
                      border: '1px solid rgba(2,195,154,0.3)', borderRadius: 8, padding: '5px 12px',
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                    }}>
                      <Check size={12} /> {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={handleCancelEdit} disabled={saving} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, color: '#3a6a7a', background: 'transparent',
                      border: '1px solid rgba(58,106,122,0.3)', borderRadius: 8, padding: '5px 12px',
                      cursor: 'pointer',
                    }}>
                      <XIcon size={12} /> Cancelar
                    </button>
                  </div>
                  {saveError && <span style={{ fontSize: 12, color: '#ff6b6b' }}>{saveError}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.3px' }}>
                    {user?.name ?? '—'}
                  </div>
                  <button onClick={() => { setNameInput(user?.name ?? ''); setEditingName(true) }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: '#02C39A', background: 'transparent',
                    border: '1px solid rgba(2,195,154,0.3)', borderRadius: 6, padding: '3px 8px',
                    cursor: 'pointer',
                  }} title="Editar nombre">
                    <Edit3 size={11} /> Editar
                  </button>
                  {saveSuccess && <span style={{ fontSize: 11, color: '#02C39A' }}>✓ Guardado</span>}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#3a6a7a' }}>{user?.email ?? '—'}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#2a5a6a', display: 'inline-block' }} />
                <span style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                  color: user?.role === 'teacher' ? '#02C39A' : '#7ab8c8',
                  background: user?.role === 'teacher' ? 'rgba(2,195,154,0.1)' : 'rgba(5,102,141,0.12)',
                  border: user?.role === 'teacher' ? '1px solid rgba(2,195,154,0.35)' : '1px solid rgba(5,102,141,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {roleLabel[user?.role ?? ''] ?? user?.role ?? '—'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', borderRadius: 12, background: 'rgba(5,102,141,0.08)', width: 'fit-content' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? '#02C39A' : '#3a6a7a',
                    background: active ? 'rgba(2,195,154,0.1)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

              {/* Account info section */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, padding: '0 4px' }}>
                  Información de cuenta
                </p>
                <div style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
                  {[
                    { icon: User,   label: 'Nombre completo', value: user?.name  ?? '—' },
                    { icon: Mail,   label: 'Correo electrónico', value: user?.email ?? '—' },
                    { icon: Shield, label: 'Rol en la plataforma', value: roleLabel[user?.role ?? ''] ?? user?.role ?? '—' },
                  ].map((field, i, arr) => {
                    const Icon = field.icon
                    return (
                      <motion.div
                        key={field.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px',
                          borderBottom: i < arr.length - 1 ? '1px solid rgba(5,102,141,0.12)' : 'none',
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(5,102,141,0.1)', border: '1px solid rgba(5,102,141,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} color="#3a6a7a" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{field.label}</div>
                          <div style={{ fontSize: 14, color: '#e8f4f8', fontWeight: 500 }}>{field.value}</div>
                        </div>
                        <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(5,102,141,0.08)', color: '#2a5a6a', border: '1px solid rgba(5,102,141,0.15)' }}>
                          Solo lectura
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Notifications quick-toggle */}
              <div style={{ marginTop: 24, marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, padding: '0 4px' }}>
                  Notificaciones
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ ...glass, borderRadius: 16, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(5,102,141,0.1)', border: '1px solid rgba(5,102,141,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={15} color="#3a6a7a" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e8f4f8', fontWeight: 500, marginBottom: 2 }}>Alertas de sesión</div>
                    <div style={{ fontSize: 11, color: '#3a6a7a' }}>Próximamente disponible</div>
                  </div>
                  <ChevronRight size={14} color="#2a5a6a" />
                </motion.div>
              </div>

              {/* Danger zone */}
              <div style={{ marginTop: 36 }}>
                <p style={{ fontSize: 10, color: 'rgba(220,60,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, padding: '0 4px' }}>
                  Zona de peligro
                </p>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={async () => { await logout(); navigate('/login', { replace: true }) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px', borderRadius: 14,
                    border: '1px solid rgba(220,60,60,0.3)',
                    color: '#ff6b6b', background: 'rgba(220,60,60,0.05)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  <LogOut size={15} strokeWidth={2} /> Cerrar sesión
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div key="prefs" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <p style={{ fontSize: 10, color: '#2a5a6a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, padding: '0 4px' }}>
                Apariencia
              </p>
              {[
                { label: 'Tema de la interfaz',   desc: 'Oscuro — optimizado para sesiones largas de código', badge: 'Activo' },
                { label: 'Fuente del editor',     desc: 'JetBrains Mono — ideal para código',                 badge: 'Activo' },
                { label: 'Animaciones',            desc: 'Transiciones suaves habilitadas',                   badge: 'Activo' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.07 }}
                  style={{ ...glass, borderRadius: 14, padding: '16px 22px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e8f4f8', fontWeight: 500, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#3a6a7a' }}>{item.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, color: '#02C39A', background: 'rgba(2,195,154,0.07)', border: '1px solid rgba(2,195,154,0.25)', fontWeight: 500 }}>
                    {item.badge}
                  </span>
                </motion.div>
              ))}
              <p style={{ fontSize: 11, color: '#2a5a6a', marginTop: 20, padding: '0 4px' }}>
                Las preferencias de editor y tema se configurarán en una próxima actualización.
              </p>
            </motion.div>
          )}

        </motion.div>
      </main>
    </div>
  )
}
