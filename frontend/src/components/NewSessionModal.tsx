import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code2, Zap } from 'lucide-react'

const EXERCISES = [
  { id: 1, title: 'Two Sum', difficulty: 'easy', language: 'javascript', desc: 'Encuentra los dos números que suman el target.' },
  { id: 2, title: 'Fibonacci', difficulty: 'medium', language: 'javascript', desc: 'Implementa Fibonacci optimizado en O(n).' },
  { id: 3, title: 'Valid Palindrome', difficulty: 'hard', language: 'javascript', desc: 'Verifica si una cadena es palíndromo.' },
]

const DIFF_COLOR: Record<string, string> = {
  easy: '#02C39A',
  medium: '#f0a500',
  hard: '#ff6b6b',
}

interface Props {
  open: boolean
  onClose: () => void
  onStart: (exerciseId: number | null) => Promise<void>
  loading: boolean
}

export default function NewSessionModal({ open, onClose, onStart, loading }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleStart = async () => {
    await onStart(selected)
    setSelected(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
            position: 'fixed', top: '50%', left: '50%',
            marginTop: '-280px',  // mitad aprox de la altura del modal
            marginLeft: '-240px', // mitad del maxWidth (480/2)
            width: '100%', maxWidth: 480, zIndex: 101,
            background: 'rgba(8, 18, 32, 0.97)',
            border: '1px solid rgba(5,102,141,0.3)',
            borderRadius: 20,
            padding: '32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.3px' }}>Nueva sesión</div>
                <div style={{ fontSize: 12, color: '#3a6a7a', marginTop: 3 }}>Elige un ejercicio o déjalo al azar</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a6a7a', padding: 4 }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Ejercicios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {/* Opción aleatoria */}
              <motion.div
                onClick={() => setSelected(null)}
                whileHover={{ borderColor: 'rgba(2,195,154,0.4)' }}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: selected === null ? '1px solid rgba(2,195,154,0.6)' : '1px solid rgba(5,102,141,0.2)',
                  background: selected === null ? 'rgba(2,195,154,0.06)' : 'rgba(5,102,141,0.04)',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.2s',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(2,195,154,0.1)', border: '1px solid rgba(2,195,154,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={15} strokeWidth={2} color="#02C39A" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>Aleatorio</div>
                  <div style={{ fontSize: 11, color: '#3a6a7a', marginTop: 2 }}>El sistema elige el ejercicio</div>
                </div>
                {selected === null && <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#02C39A' }} />}
              </motion.div>

              {/* Ejercicios fijos */}
              {EXERCISES.map((ex) => (
                <motion.div
                  key={ex.id}
                  onClick={() => setSelected(ex.id)}
                  whileHover={{ borderColor: 'rgba(2,128,144,0.4)' }}
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: selected === ex.id ? '1px solid rgba(2,195,154,0.6)' : '1px solid rgba(5,102,141,0.2)',
                    background: selected === ex.id ? 'rgba(2,195,154,0.06)' : 'rgba(5,102,141,0.04)',
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(5,102,141,0.1)', border: '1px solid rgba(5,102,141,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Code2 size={15} strokeWidth={2} color="#3a6a7a" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{ex.title}</div>
                    <div style={{ fontSize: 11, color: '#3a6a7a', marginTop: 2 }}>{ex.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, color: DIFF_COLOR[ex.difficulty], border: `1px solid ${DIFF_COLOR[ex.difficulty]}40`, background: `${DIFF_COLOR[ex.difficulty]}10` }}>
                      {ex.difficulty}
                    </span>
                    {selected === ex.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#02C39A' }} />}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <motion.button
              onClick={handleStart}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: '#07101a', background: 'linear-gradient(135deg, #028090, #02C39A)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}