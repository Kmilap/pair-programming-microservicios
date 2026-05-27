import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
const EDITOR_BASE = 'http://localhost'

interface ReplayEvent {
  timestamp: number
  update: string
}

interface Props {
  roomId: string
  onClose: () => void
}


export default function SessionReplay({ roomId, onClose }: Props) {
  const [events,     setEvents]     = useState<ReplayEvent[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [playing,    setPlaying]    = useState(false)
  const [speed,      setSpeed]      = useState(1)
  const [loading,    setLoading]    = useState(true)

  // 1. Cargar eventos desde Redis
  useEffect(() => {
    fetch(`${EDITOR_BASE}/editor/rooms/${roomId}/replay`)
      .then((r) => r.json())
      .then((data) => {
        const raw = (data.updates ?? []) as ReplayEvent[]
        // El servidor ya entrega los updates en orden cronológico (oldest-first)
        // porque hace LRANGE → reverse() internamente. NO invertir aquí.
        setEvents(raw)
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [roomId])

  const [snapshots,  setSnapshots]  = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  // 2. Pre-procesar updates → snapshots, fuera del hilo de render vía setTimeout 0
  useEffect(() => {
    if (events.length === 0) return
    setProcessing(true)
    setTimeout(() => {
      const doc   = new Y.Doc()
      const yText = doc.getText('monaco')
      const result: string[] = []
      for (let i = 0; i < events.length; i++) {
        const evt = events[i]
        try {
          const bytes = Uint8Array.from(atob(evt.update), (c) => c.charCodeAt(0))
          Y.applyUpdate(doc, bytes)
          result.push(yText.toString())
        } catch (err) {
          console.error(`[replay] applyUpdate failed at index ${i}:`, err)
          result.push(result[result.length - 1] ?? '')
        }
      }
      doc.destroy()
      setSnapshots(result)
      setProcessing(false)
    }, 0)
  }, [events])

  // 3. Motor del reproductor — solo incrementa el índice; Editor re-renderiza via value prop
  useEffect(() => {
    if (!playing || snapshots.length === 0 || currentIdx >= snapshots.length) {
      if (currentIdx >= snapshots.length && snapshots.length > 0) setPlaying(false)
      return
    }

    const idx      = currentIdx
    const evt      = events[idx]
    const prevEvt  = events[idx - 1]
    const rawDelay = prevEvt ? (evt.timestamp - prevEvt.timestamp) / speed : 0
    const delay    = Math.min(Math.max(rawDelay, 50), 500)

    const timer = setTimeout(() => {
      setCurrentIdx(idx + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [playing, currentIdx, snapshots, events, speed])

  const handleReset = () => {
    setPlaying(false)
    setCurrentIdx(0)
  }

  const total     = snapshots.length || events.length
  const progress  = total ? (currentIdx / total) * 100 : 0
  const totalSecs = events.length > 1
    ? Math.round((events[events.length - 1].timestamp - events[0].timestamp) / 1000)
    : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100,
      display: 'flex', flexDirection: 'column', padding: 24, fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8f4f8', margin: 0 }}>Replay de sesión</h2>
          <p style={{ fontSize: 11, color: '#3a6a7a', margin: '4px 0 0' }}>
            {events.length} eventos · {totalSecs}s de sesión grabada
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a6a7a', display: 'flex', alignItems: 'center' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Editor */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a6a7a' }}>
          Cargando eventos del replay…
        </div>
      ) : processing ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a6a7a', fontSize: 13 }}>
          Procesando replay…
        </div>
      ) : events.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#3a6a7a' }}>
          <p style={{ fontSize: 14 }}>No hay eventos grabados para esta sala.</p>
          <p style={{ fontSize: 11 }}>Los eventos se generan mientras los estudiantes editan código.</p>
        </div>
      ) : (
        <textarea
          value={snapshots[currentIdx] ?? ''}
          readOnly
          spellCheck={false}
          onChange={() => {}}
          style={{
            flex: 1,
            width: '100%',
            resize: 'none',
            background: '#060f18',
            color: '#7ab8c8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            padding: '20px 24px',
            border: '1px solid rgba(5,102,141,0.3)',
            borderRadius: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* Controles */}
      {events.length > 0 && (
        <div style={{ flexShrink: 0, marginTop: 16 }}>
          <div
            style={{ width: '100%', height: 4, background: 'rgba(5,102,141,0.3)', borderRadius: 2, marginBottom: 14, cursor: 'pointer' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct  = (e.clientX - rect.left) / rect.width
              setCurrentIdx(Math.floor(pct * total))
            }}
          >
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #028090, #02C39A)', borderRadius: 2, transition: 'width 0.1s' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={processing || snapshots.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: processing || snapshots.length === 0 ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #028090, #02C39A)', color: '#07101a', fontWeight: 700, fontSize: 13, opacity: processing || snapshots.length === 0 ? 0.5 : 1 }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pausar' : 'Reproducir'}
            </button>

            <button
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(5,102,141,0.3)', background: 'none', color: '#3a6a7a', cursor: 'pointer', fontSize: 12 }}
            >
              <RotateCcw size={13} /> Reiniciar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3a6a7a' }}>
              <span>Velocidad:</span>
              {[0.5, 1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{ padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, background: speed === s ? 'rgba(2,195,154,0.15)' : 'transparent', color: speed === s ? '#02C39A' : '#3a6a7a', fontWeight: speed === s ? 700 : 400 }}
                >
                  {s}×
                </button>
              ))}
            </div>

            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#1e3a4a', fontFamily: 'JetBrains Mono, monospace' }}>
              {currentIdx} / {total}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
