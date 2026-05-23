import { useRef, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Code2, Lock, Mail, Users, Zap, Monitor } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// ── Floating code tokens ──────────────────────────────────────────────────
const TOKENS = [
  { t: '</>', x: '7%',  delay: 0,   dur: 11 },
  { t: 'def', x: '81%', delay: 1.8, dur: 13 },
  { t: '{ }', x: '54%', delay: 3.5, dur: 12 },
  { t: 'fn()', x: '91%', delay: 0.9, dur: 9.5 },
  { t: '=>',  x: '21%', delay: 2.3, dur: 14 },
  { t: '===', x: '67%', delay: 4.4, dur: 10.5 },
  { t: 'async', x: '39%', delay: 0.4, dur: 12 },
  { t: '++',  x: '75%', delay: 2.9, dur: 9 },
  { t: 'class', x: '14%', delay: 6,   dur: 13 },
  { t: 'const', x: '47%', delay: 1.6, dur: 15 },
  { t: 'while', x: '32%', delay: 7.5, dur: 10 },
  { t: '[ ]',  x: '61%', delay: 3.9, dur: 11 },
]

// ── Shared styles ─────────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(10, 26, 38, 0.72)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(5, 102, 141, 0.22)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
} as const

const NODE_SHADOW = '5px 5px 12px rgba(0,0,0,0.6), -3px -3px 7px rgba(255,255,255,0.02), inset 1px 1px 1px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.5)'
const nodeGlowOn  = '5px 5px 12px rgba(0,0,0,0.6), 0 0 24px rgba(2,195,154,0.55), inset 1px 1px 1px rgba(255,255,255,0.08)'
const nodeGlowOff = NODE_SHADOW

const nodeBase: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: '50%',
  background: '#0c1a26',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  zIndex: 3,
  transition: 'box-shadow 0.3s ease',
  boxShadow: NODE_SHADOW,
}

// ── Component ─────────────────────────────────────────────────────────────
export default function Login() {
  const pipelineRef = useRef<HTMLDivElement>(null)
  const leftRef     = useRef<HTMLDivElement>(null)
  const centerRef   = useRef<HTMLDivElement>(null)
  const rightRef    = useRef<HTMLDivElement>(null)
  const beamGlowRef = useRef<SVGPathElement>(null)
  const beamCoreRef = useRef<SVGPathElement>(null)
  const gradRef     = useRef<SVGLinearGradientElement>(null)
  const splashRef   = useRef<HTMLDivElement>(null)

  // ── [NUEVO] Estado del formulario ───────────────────────────────────────
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Si el usuario ya está autenticado y entra a /login, mándalo al dashboard.
  // (o al lugar de donde venía si ProtectedRoute lo había redirigido aquí)
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location.state])

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (submitting) return
    setFormError(null)

    // Validación mínima en cliente
    if (!email.trim() || !password.trim()) {
      setFormError('Ingresa tu correo y contraseña.')
      return
    }

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      // El useEffect de arriba se encarga del navigate al cambiar isAuthenticated.
    } catch (err) {
      // El error legible ya está en el AuthContext (state.error), pero también
      // lo mostramos localmente para mayor responsividad.
      setFormError(
        (err as Error)?.message?.includes('Network') || (err as { code?: string })?.code === 'ERR_NETWORK'
          ? 'No se pudo conectar con el servidor.'
          : 'Credenciales inválidas o servicio no disponible.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Animación del beam (intacto, tal cual lo dejó Noel) ─────────────────
  useEffect(() => {
    type Phase = 'idle' | 'p1' | 'splash' | 'p2'
    let phase: Phase = 'idle'
    let t0 = 0
    let raf = 0
    let sx = 0, ex = 0, midY = 0

    function recompute() {
      const pr = pipelineRef.current?.getBoundingClientRect()
      const lr = leftRef.current?.getBoundingClientRect()
      const cr = centerRef.current?.getBoundingClientRect()
      const rr = rightRef.current?.getBoundingClientRect()
      if (!pr || !lr || !cr || !rr) return
      sx   = lr.left + lr.width  / 2 - pr.left
      const sy = lr.top  + lr.height / 2 - pr.top
      const mx = cr.left + cr.width  / 2 - pr.left
      const my = cr.top  + cr.height / 2 - pr.top
      ex   = rr.left + rr.width  / 2 - pr.left
      const ey = rr.top  + rr.height / 2 - pr.top
      midY = my
      const d = `M ${sx},${sy} L ${mx},${my} L ${ex},${ey}`
      beamGlowRef.current?.setAttribute('d', d)
      beamCoreRef.current?.setAttribute('d', d)
    }

    function slide(pct: number) {
      if (!gradRef.current) return
      const hw = (ex - sx) * 0.14
      const cx = sx + pct * (ex - sx)
      gradRef.current.setAttribute('x1', String(cx - hw))
      gradRef.current.setAttribute('x2', String(cx + hw))
      gradRef.current.setAttribute('y1', String(midY))
      gradRef.current.setAttribute('y2', String(midY))
    }

    function beam(on: boolean) {
      const v = on ? '1' : '0'
      if (beamGlowRef.current) beamGlowRef.current.style.opacity = v
      if (beamCoreRef.current) beamCoreRef.current.style.opacity = v
    }

    function glow(el: HTMLDivElement | null, on: boolean) {
      if (el) el.style.boxShadow = on ? nodeGlowOn : nodeGlowOff
    }

    function doSplash() {
      const s = splashRef.current
      if (!s) return
      s.style.transition = 'none'
      s.style.opacity = '0.9'
      s.style.transform = 'scale(0.2)'
      void s.offsetHeight
      s.style.transition = 'transform 0.65s ease-out, opacity 0.65s ease-out'
      s.style.transform = 'scale(1.9)'
      s.style.opacity = '0'
    }

    function tick(ts: number) {
      if (t0 === 0) t0 = ts
      const el = ts - t0

      if (phase === 'idle' && el > 900) {
        phase = 'p1'; t0 = ts; recompute(); beam(true)
      } else if (phase === 'p1') {
        const p = Math.min(el / 800, 1)
        slide(p * 0.5)
        glow(leftRef.current, p < 0.8)
        if (p >= 1) {
          beam(false); glow(leftRef.current, false); doSplash()
          phase = 'splash'; t0 = ts
        }
      } else if (phase === 'splash' && el > 650) {
        phase = 'p2'; t0 = ts; beam(true)
      } else if (phase === 'p2') {
        const p = Math.min(el / 800, 1)
        slide(0.5 + p * 0.5)
        glow(rightRef.current, p > 0.2)
        if (p >= 1) {
          glow(rightRef.current, false)
          phase = 'idle'; t0 = ts
        }
      }

      raf = requestAnimationFrame(tick)
    }

    const tid = setTimeout(recompute, 200)
    window.addEventListener('resize', recompute)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recompute)
      clearTimeout(tid)
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

      {/* ── Animated background ──────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(2,195,154,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.045) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />
        {/* Arc glow — upper-right quadrant */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 78% -5%, rgba(2,128,144,0.55) 0%, rgba(2,128,144,0.22) 38%, transparent 65%)',
          opacity: 0.32,
        }} />
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '12%', right: '12%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,128,144,0.13), transparent 70%)', filter: 'blur(85px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '42%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,195,154,0.09), transparent 70%)', filter: 'blur(60px)' }} />
        {/* Floating code tokens */}
        {TOKENS.map((tk) => (
          <motion.span
            key={tk.t + tk.x}
            style={{ position: 'absolute', left: tk.x, bottom: -40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(2,195,154,0.17)', letterSpacing: '0.05em', userSelect: 'none' }}
            animate={{ y: [0, -920], opacity: [0, 0.95, 0.95, 0] }}
            transition={{ duration: tk.dur, repeat: Infinity, delay: tk.delay, ease: 'linear', times: [0, 0.07, 0.93, 1] }}
          >
            {tk.t}
          </motion.span>
        ))}
      </div>

      {/* ── Left panel — Form ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ flex: 1, maxWidth: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px', position: 'relative', zIndex: 10, background: 'rgba(7,16,26,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #028090, #02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Code2 size={17} strokeWidth={2.5} color="#07101a" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4f8', letterSpacing: '-0.3px' }}>Micro-Pair</div>
              <div style={{ fontSize: 9, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pair Programming</div>
            </div>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.6px', marginBottom: 10, lineHeight: 1.15 }}>Bienvenido</h1>
          <p style={{ fontSize: 14, color: '#7ab8c8', marginBottom: 38 }}>Inicia sesión para continuar</p>

          {/* [NUEVO] El contenido del formulario ahora vive dentro de <form>
              para permitir submit con Enter. NINGÚN style fue cambiado. */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Correo electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  {/* [MODIFICADO] añadidos value, onChange, disabled, autoComplete */}
                  <input
                    type="email"
                    placeholder="usuario@unab.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    autoComplete="email"
                    style={{ width: '100%', background: 'rgba(8,22,35,0.85)', border: '1px solid rgba(5,102,141,0.3)', borderRadius: 12, padding: '13px 14px 13px 42px', fontSize: 13, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} strokeWidth={2} color="#3a6a7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  {/* [MODIFICADO] añadidos value, onChange, disabled, autoComplete */}
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                    style={{ width: '100%', background: 'rgba(8,22,35,0.85)', border: '1px solid rgba(5,102,141,0.3)', borderRadius: 12, padding: '13px 14px 13px 42px', fontSize: 13, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* [NUEVO] Mensaje de error sutil, paleta del diseño de Noel */}
              {formError && (
                <div
                  role="alert"
                  style={{
                    fontSize: 12,
                    color: '#ff8aa5',
                    background: 'rgba(255,138,165,0.06)',
                    border: '1px solid rgba(255,138,165,0.25)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginTop: -4,
                  }}
                >
                  {formError}
                </div>
              )}

              {/* [MODIFICADO] añadidos type="submit", disabled, onClick (por si el form se quita en el futuro), y texto dinámico */}
              <motion.button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.02 } : undefined}
                whileTap={!submitting ? { scale: 0.98 } : undefined}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#07101a',
                  background: 'linear-gradient(135deg, #028090, #02C39A)',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                  opacity: submitting ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </motion.button>
            </div>
          </form>

          <p style={{ fontSize: 12, color: '#3a6a7a', textAlign: 'center', marginTop: 28 }}>
            ¿No tienes cuenta?{' '}
            <span style={{ color: '#00A896', cursor: 'pointer' }}>Regístrate</span>
          </p>
        </div>
      </motion.div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div style={{ width: 1, flexShrink: 0, background: 'linear-gradient(to bottom, transparent, rgba(5,102,141,0.3) 20%, rgba(5,102,141,0.3) 80%, transparent)', margin: '80px 0', zIndex: 1 }} />

      {/* ── Right panel — Showcase ───────────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px', position: 'relative', zIndex: 1 }}>

        {/* Beam pipeline */}
        <div ref={pipelineRef} style={{ position: 'relative', width: '100%', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, zIndex: 1 }}>
          {/* SVG beam overlay */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 2 }}>
            <defs>
              <filter id="mp-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient ref={gradRef} id="mp-beam" gradientUnits="userSpaceOnUse" x1="0" x2="60" y1="0" y2="0">
                <stop offset="0%"   stopColor="#028090"  stopOpacity="0" />
                <stop offset="28%"  stopColor="#00a896"  stopOpacity="0.9" />
                <stop offset="50%"  stopColor="#80ffe8"  stopOpacity="1" />
                <stop offset="72%"  stopColor="#02C39A"  stopOpacity="0.9" />
                <stop offset="100%" stopColor="#02C39A"  stopOpacity="0" />
              </linearGradient>
            </defs>
            <path ref={beamGlowRef} stroke="url(#mp-beam)" strokeWidth="3.5" fill="none" filter="url(#mp-glow)" style={{ opacity: 0 }} />
            <path ref={beamCoreRef} stroke="url(#mp-beam)" strokeWidth="1.2" fill="none" style={{ opacity: 0 }} />
          </svg>

          {/* Nodes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Left — developer (code icon) */}
            <div ref={leftRef} style={nodeBase}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>

            <div style={{ width: 86, height: 1, background: 'linear-gradient(90deg, rgba(5,102,141,0.28), rgba(5,102,141,0.12))', flexShrink: 0 }} />

            {/* Center — Micro-Pair */}
            <div style={{ position: 'relative', flexShrink: 0, zIndex: 3 }}>
              <div ref={splashRef} style={{ position: 'absolute', inset: -22, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,195,154,0.7) 0%, transparent 70%)', opacity: 0, pointerEvents: 'none', zIndex: 2 }} />
              <div ref={centerRef} style={{ width: 54, height: 54, borderRadius: '50%', background: '#0b1822', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 3, boxShadow: '8px 8px 18px rgba(0,0,0,0.7), -4px -4px 10px rgba(255,255,255,0.025), inset 1px 1px 2px rgba(255,255,255,0.05), inset 5px 5px 12px rgba(0,0,0,0.6)' }}>
                <Code2 size={22} strokeWidth={2} color="#02C39A" />
              </div>
            </div>

            <div style={{ width: 86, height: 1, background: 'linear-gradient(90deg, rgba(5,102,141,0.12), rgba(5,102,141,0.28))', flexShrink: 0 }} />

            {/* Right — partner (users icon) */}
            <div ref={rightRef} style={nodeBase}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 38, textAlign: 'center' }}>
          Conexión en tiempo real
        </p>

        {/* Feature cards */}
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <Monitor size={15} strokeWidth={2} color="#7ab8c8" />, title: 'Colaboración', desc: 'Editor sincronizado en tiempo real. Dos cursores, un mismo documento, cero fricción.' },
            { icon: <Zap size={15} strokeWidth={2} color="#7ab8c8" />, title: 'Asistente IA', desc: 'Sugerencias contextuales que entienden tu código en el momento exacto.' },
            { icon: <Users size={15} strokeWidth={2} color="#7ab8c8" />, title: 'Sesiones', desc: 'Crea y gestiona sesiones con control total sobre roles y permisos.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderRadius: 14, ...glassCard }}
            >
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(5,102,141,0.1)', border: '1px solid rgba(5,102,141,0.18)', flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 1 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e8f4f8', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#7ab8c8', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}