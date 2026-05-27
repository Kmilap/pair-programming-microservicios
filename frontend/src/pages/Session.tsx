import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Bug, BookOpen, ChevronLeft, Users, Send, X, Loader, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import type { SessionData } from '../services/sessionService'
import type { ReviewComment } from '../services/aiService'
import type { ReviewDecoration, ConnectionStatus } from '../components/CollaborativeEditor'
import { aiService } from '../services/aiService'
import { api } from '../lib/api'
import CollaborativeEditor from '../components/CollaborativeEditor'
import SessionReplay from '../components/SessionReplay'
import { useAuth } from '../hooks/useAuth'

type AiMode = 'suggest' | 'review' | 'explain' | null

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; text: string }> = {
  connecting:   { color: '#ffc107', text: 'Conectando…' },
  connected:    { color: '#02C39A', text: 'En vivo'     },
  disconnected: { color: '#ff6b6b', text: 'Desconectado' },
}

export default function Session() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { id }    = useParams()
  const { user }  = useAuth()

  // ── Datos de sesión ──────────────────────────────────────────
  const sessionData = (location.state as { sessionData: SessionData } | null)?.sessionData ?? (() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('recent_sessions') ?? '[]') as SessionData[]
      return (sessions as Array<{ id: string } & SessionData>).find((s) => s.id === id) ?? null
    } catch { return null }
  })()
  const exercise = sessionData?.exercise

  const readOnly = (location.state as { readOnly?: boolean } | null)?.readOnly
    ?? new URLSearchParams(location.search).get('readonly') === 'true'
    ?? false

  // ── UI State ─────────────────────────────────────────────────
  const [enunciadoCollapsed, setEnunciadoCollapsed] = useState(false)
  const [connectionStatus, setConnectionStatus]     = useState<ConnectionStatus>('connecting')
  const [showReplay, setShowReplay]                 = useState(false)

  // ── Estado del panel de IA ───────────────────────────────────
  const [aiMode, setAiMode]         = useState<AiMode>(null)
  const [question, setQuestion]     = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiSource, setAiSource]     = useState<'ai' | 'fallback' | null>(null)

  // BUG-001: persistencia del historial de IA en localStorage
  const AI_KEY = `ai_last_${id ?? 'session'}`
  const [aiResponse, setAiResponse] = useState<string | null>(() => {
    try { return (JSON.parse(localStorage.getItem(AI_KEY) ?? 'null') as { response: string } | null)?.response ?? null }
    catch { return null }
  })
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>(() => {
    try { return (JSON.parse(localStorage.getItem(AI_KEY) ?? 'null') as { comments?: ReviewComment[] } | null)?.comments ?? [] }
    catch { return [] }
  })

  // B2: decoraciones Monaco para Code Review
  const [reviewDecorations, setReviewDecorations] = useState<ReviewDecoration[]>([])

  // Sincronizar respuesta IA → localStorage
  useEffect(() => {
    if (!aiResponse && reviewComments.length === 0) return
    try {
      localStorage.setItem(AI_KEY, JSON.stringify({ response: aiResponse, comments: reviewComments, mode: aiMode }))
    } catch {}
  }, [aiResponse, reviewComments]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentCodeRef = useRef<string>(exercise?.initial_code ?? '')
  const handleCodeChange = useCallback((code: string) => { currentCodeRef.current = code }, [])

  // ── Acciones IA ──────────────────────────────────────────────
  const handleSuggest = async () => {
    if (!question.trim()) return
    setAiLoading(true); setAiResponse(null); setReviewComments([]); setReviewDecorations([])
    try {
      const res = await aiService.suggest(id ?? 'session', currentCodeRef.current, question)
      setAiResponse(res.suggestion); setAiSource(res.source)
    } catch {
      setAiResponse('No se pudo conectar con el Motor de IA.'); setAiSource('fallback')
    } finally { setAiLoading(false) }
  }

  const handleReview = async () => {
    setAiMode('review'); setAiLoading(true); setAiResponse(null); setReviewComments([]); setReviewDecorations([])
    try {
      const res = await aiService.review(id ?? 'session', currentCodeRef.current)
      setReviewComments(res.comments)
      setReviewDecorations(res.comments.map((c) => ({ line: c.line, comment: c.comment })))
      setAiSource(res.source)
      if (res.message) setAiResponse(res.message)
    } catch {
      setAiResponse('No se pudo conectar con el Motor de IA.'); setAiSource('fallback')
    } finally { setAiLoading(false) }
  }

  const handleExplain = async () => {
    setAiMode('explain'); setAiLoading(true); setAiResponse(null); setReviewComments([]); setReviewDecorations([])
    try {
      const res = await aiService.explain(id ?? 'session', currentCodeRef.current)
      setAiResponse(res.suggestion); setAiSource(res.source)
    } catch {
      setAiResponse('No se pudo conectar con el Motor de IA.'); setAiSource('fallback')
    } finally { setAiLoading(false) }
  }

  const resetAiPanel = () => {
    setAiMode(null); setAiResponse(null); setReviewComments([])
    setReviewDecorations([]); setQuestion(''); setAiSource(null)
    try { localStorage.removeItem(AI_KEY) } catch {}
  }

  const status = STATUS_CONFIG[connectionStatus]

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07101a', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#081623', borderBottom: '1px solid rgba(5,102,141,0.18)', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3a6a7a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={14} strokeWidth={2} /> Dashboard
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(5,102,141,0.3)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8' }}>{exercise?.title ?? 'Cargando…'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: '#3a6a7a', marginTop: 2 }}>
              {/* BUG-002: badge de conexión con estado real */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: status.color }}>
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, display: 'inline-block' }}
                />
                {status.text}
              </span>
              {readOnly && (
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b' }}>Solo lectura</span>
              )}
              <span>Sala: {id?.slice(0, 8) ?? '…'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} strokeWidth={2} /> 2 participantes</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* B4: Botón Replay (solo si readOnly — sesión finalizada) */}
          {readOnly && exercise && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowReplay(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(2,195,154,0.35)', color: '#02C39A', background: 'rgba(2,195,154,0.06)', cursor: 'pointer', fontWeight: 500 }}
            >
              <Play size={12} strokeWidth={2} /> Ver Replay
            </motion.button>
          )}
          <button
            onClick={async () => {
              try {
                await api.post(`/sessions/${id}/end`)
              } catch (e) {
                console.warn('Error terminando sesión en backend:', e)
              }
              try {
                const sessions = JSON.parse(localStorage.getItem('recent_sessions') ?? '[]')
                localStorage.setItem('recent_sessions', JSON.stringify(
                  sessions.map((s: { id: string }) => s.id === id ? { ...s, status: 'ended' } : s)
                ))
              } catch {}
              navigate('/dashboard')
            }}
            style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(220,60,60,0.35)', color: '#ff6b6b', background: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Terminar sesión
          </button>
        </div>
      </motion.header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Editor — 7 partes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ flex: 7, display: 'flex', flexDirection: 'column', background: '#060f18', borderRight: '1px solid rgba(5,102,141,0.18)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(2,195,154,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(2,195,154,0.025) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          {!showReplay && (
            <CollaborativeEditor
              sessionId={id ?? 'default'}
              userId={user?.id ?? 0}
              userName={user?.name ?? 'Usuario'}
              language={exercise?.language ?? 'javascript'}
              initialCode={exercise?.initial_code ?? '// Cargando…'}
              readOnly={readOnly}
              onCodeChange={handleCodeChange}
              onConnectionChange={setConnectionStatus}
              reviewDecorations={reviewDecorations}
            />
          )}
        </motion.div>

        {/* Sidebar — 3 partes */}
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
          style={{ flex: 3, display: 'flex', flexDirection: 'column', minWidth: 280, background: '#081623', overflow: 'hidden' }}
        >
          {/* Pareja */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(5,102,141,0.18)', flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Pareja</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#028090', flexShrink: 0 }}>CP</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4f8' }}>Camila P.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#02C39A', marginTop: 2 }}>
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#02C39A', display: 'inline-block' }} />
                  En línea · editando
                </div>
              </div>
            </div>
          </div>

          {/* Enunciado — colapsable */}
          <div style={{ borderBottom: '1px solid rgba(5,102,141,0.18)', flexShrink: 0 }}>
            <button onClick={() => setEnunciadoCollapsed((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Enunciado</span>
                {exercise && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(5,102,141,0.25)', color: '#3a6a7a' }}>{exercise.difficulty}</span>}
              </div>
              <span style={{ color: '#3a6a7a', display: 'flex', alignItems: 'center' }}>
                {enunciadoCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {!enunciadoCollapsed && (
                <motion.div key="enunciado" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '0 24px 16px', maxHeight: 200, overflowY: 'auto' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#e8f4f8', marginBottom: 10 }}>{exercise?.title ?? '—'}</p>
                    <div style={{ fontSize: 12, color: '#7ab8c8', lineHeight: 1.7, padding: '12px 14px', borderRadius: 10, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.18)', whiteSpace: 'pre-wrap' }}>
                      {exercise?.statement ?? '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(5,102,141,0.25)', color: '#3a6a7a' }}>{exercise?.language ?? '—'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Copilot IA ─────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', background: 'rgba(5,102,141,0.04)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
              <p style={{ fontSize: 10, color: '#3a6a7a', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Copilot IA</p>
              {(aiMode || aiResponse || reviewComments.length > 0) && (
                <button onClick={resetAiPanel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a6a7a', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setAiMode('suggest'); setAiResponse(null); setReviewComments([]) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, fontSize: 12, textAlign: 'left', cursor: 'pointer', background: aiMode === 'suggest' ? 'linear-gradient(135deg, #028090, #02C39A)' : 'linear-gradient(135deg, rgba(2,128,144,0.15), rgba(2,195,154,0.1))', color: aiMode === 'suggest' ? '#07101a' : '#02C39A', fontWeight: 700, border: aiMode === 'suggest' ? 'none' : '1px solid rgba(2,195,154,0.25)' }}
              >
                <Zap size={14} strokeWidth={2} /> Pedir sugerencia
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleReview} disabled={aiLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, fontSize: 12, textAlign: 'left', cursor: aiLoading ? 'not-allowed' : 'pointer', background: 'rgba(5,102,141,0.07)', color: '#7ab8c8', border: '1px solid rgba(5,102,141,0.2)', opacity: aiLoading ? 0.6 : 1 }}
              >
                <Bug size={14} strokeWidth={2} /> Analizar errores
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleExplain} disabled={aiLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, fontSize: 12, textAlign: 'left', cursor: aiLoading ? 'not-allowed' : 'pointer', background: 'rgba(5,102,141,0.07)', color: '#7ab8c8', border: '1px solid rgba(5,102,141,0.2)', opacity: aiLoading ? 0.6 : 1 }}
              >
                <BookOpen size={14} strokeWidth={2} /> Explicar código
              </motion.button>
            </div>

            {/* Input de pregunta */}
            <AnimatePresence>
              {aiMode === 'suggest' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={question} onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSuggest()}
                      placeholder="¿Qué quieres saber?" autoFocus
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, background: 'rgba(5,102,141,0.1)', border: '1px solid rgba(5,102,141,0.3)', color: '#e8f4f8', outline: 'none' }}
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleSuggest}
                      disabled={aiLoading || !question.trim()}
                      style={{ padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #028090, #02C39A)', color: '#07101a', display: 'flex', alignItems: 'center', opacity: aiLoading || !question.trim() ? 0.5 : 1 }}
                    >
                      <Send size={13} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Área de respuesta — con scroll propio */}
            <div style={{ flex: 1, marginTop: 14, overflowY: 'auto', minHeight: 0 }}>
              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3a6a7a', fontSize: 12 }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Consultando IA…
                </div>
              )}
              <AnimatePresence mode="wait">
                {/* Respuesta de texto */}
                {!aiLoading && aiResponse && aiMode !== 'review' && (
                  <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {aiSource === 'fallback' && (
                      <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)', fontSize: 10, color: '#ffc107' }}>
                        Circuit Breaker activo — respuesta de fallback
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#7ab8c8', lineHeight: 1.75, padding: '14px 16px', borderRadius: 12, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.18)', whiteSpace: 'pre-wrap' }}>
                      {aiResponse}
                    </div>
                  </motion.div>
                )}
                {/* Revisión de código */}
                {!aiLoading && aiMode === 'review' && (
                  <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {aiSource === 'fallback' && (
                      <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)', fontSize: 10, color: '#ffc107' }}>Circuit Breaker activo</div>
                    )}
                    {reviewComments.length === 0 && !aiResponse && (
                      <div style={{ fontSize: 12, color: '#3a6a7a' }}>No se encontraron observaciones.</div>
                    )}
                    {reviewComments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {reviewComments.map((c, i) => (
                          <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(5,102,141,0.07)', border: '1px solid rgba(5,102,141,0.2)' }}>
                            {c.line > 0 && <span style={{ fontSize: 10, color: '#028090', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 4 }}>Línea {c.line}</span>}
                            <p style={{ fontSize: 12, color: '#7ab8c8', lineHeight: 1.6, margin: 0 }}>{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiResponse && <p style={{ fontSize: 12, color: '#3a6a7a', marginTop: 8 }}>{aiResponse}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* B4: Modal de Replay */}
      {showReplay && sessionData?.session.editor_url && (
        <SessionReplay
          roomId={id ?? ''}
          onClose={() => setShowReplay(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
