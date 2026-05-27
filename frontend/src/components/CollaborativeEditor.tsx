import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { OnMount, Monaco } from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

// FIX-001: conectar directo al puerto 3000 del editor (bypass Traefik para WS)
const WS_EDITOR_URL = 'ws://localhost/editor/rooms'

interface AwarenessUser {
  id?: number
  name?: string
  color?: string
  role?: string
  mode?: string
}

export interface ReviewDecoration {
  line: number
  comment: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface Props {
  sessionId: string
  userId: number
  userName: string
  userRole?: string
  sessionStatus?: 'active' | 'ended'
  language: string
  initialCode: string
  readOnly?: boolean
  onCodeChange?: (code: string) => void
  onConnectionChange?: (status: ConnectionStatus) => void
  reviewDecorations?: ReviewDecoration[]
}

export default function CollaborativeEditor({
  sessionId,
  userId,
  userName,
  userRole,
  sessionStatus,
  language,
  initialCode,
  readOnly = false,
  onCodeChange,
  onConnectionChange,
  reviewDecorations,
}: Props) {
  const [peers, setPeers] = useState<Array<{ name: string; mode: string }>>([])
  const isEnded = sessionStatus === 'ended'
  const [isSynced, setIsSynced] = useState(false)   // FIX-003: overlay hasta sync

  const editorRef   = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef   = useRef<Monaco | null>(null)
  const docRef      = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef  = useRef<MonacoBinding | null>(null)
  const decorCollRef = useRef<ReturnType<Parameters<OnMount>[0]['createDecorationsCollection']> | null>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    docRef.current = doc

    // Si la sesión ya terminó, no instanciar WebSocket — solo cargar initialCode
    if (isEnded) {
      const yText = doc.getText('monaco')
      if (initialCode && yText.toString().length === 0) yText.insert(0, initialCode)
      onConnectionChange?.('disconnected')
      return () => { doc.destroy() }
    }

    // FIX-001: URL directa + opciones de reconexión robusta
    const provider = new WebsocketProvider(WS_EDITOR_URL, sessionId, doc, {
      connect: true,
      resyncInterval: 5_000,
      maxBackoffTime: 2_500,
    })

    providerRef.current = provider

    const isTeacherRole = userRole === 'teacher'
    provider.awareness.setLocalStateField('user', {
      id: userId,
      name: userName,
      color: isTeacherRole ? '#9d65c9' : '#02C39A',
      role: userRole,
      mode: isTeacherRole ? 'observing' : 'editing',
    })

    onConnectionChange?.('connecting')

    provider.on('status', ({ status }: { status: string }) => {
      onConnectionChange?.(status as ConnectionStatus)
    })

    // FIX-001: timeout de reconexión si sigue en connecting después de 8s
    const reconnectTimeout = setTimeout(() => {
      if (!provider.wsconnected) {
        console.warn('[Yjs] timeout conectando, reintentando…')
        provider.disconnect()
        provider.connect()
      }
    }, 8_000)

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values()) as Array<{ user?: AwarenessUser }>
      const peerList = states
        .filter((s) => s.user?.name && s.user.name !== userName)
        .map((s) => ({ name: s.user!.name!, mode: s.user?.mode ?? 'editing' }))
      setPeers(peerList)
    })

    return () => {
      clearTimeout(reconnectTimeout)
      bindingRef.current?.destroy()
      provider.destroy()
      doc.destroy()
    }
  }, [sessionId, userId, userName, userRole, isEnded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editorRef.current) editorRef.current.updateOptions({ readOnly })
  }, [readOnly])

  // B2: decoraciones de Code Review cuando cambian
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !reviewDecorations) return

    const newDecorations = reviewDecorations
      .filter((c) => c.line > 0)
      .map((c) => ({
        range: new monaco.Range(c.line, 1, c.line, 9999),
        options: {
          isWholeLine: true,
          className: 'mp-review-line',
          hoverMessage: { value: `**Copilot IA:** ${c.comment}` },
        },
      }))

    if (!decorCollRef.current) {
      decorCollRef.current = editor.createDecorationsCollection(newDecorations)
    } else {
      decorCollRef.current.set(newDecorations)
    }
  }, [reviewDecorations])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // FIX-002: desactivar validación semántica (elimina subrayados de "variables no declaradas")
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })

    monaco.editor.defineTheme('micro-pair', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '3a6a7a', fontStyle: 'italic' },
        { token: 'keyword', foreground: '028090' },
        { token: 'string',  foreground: 'F0F3BD' },
        { token: 'number',  foreground: '02C39A' },
      ],
      colors: {
        'editor.background':                '#060f18',
        'editor.foreground':                '#7ab8c8',
        'editor.lineHighlightBackground':   '#0a1a28',
        'editor.selectionBackground':       '#028090aa',
        'editorLineNumber.foreground':      '#1e3a4a',
        'editorLineNumber.activeForeground':'#3a6a7a',
        'editorCursor.foreground':          '#02C39A',
        'scrollbarSlider.background':       '#0a1a2844',
      },
    })
    monaco.editor.setTheme('micro-pair')

    const doc      = docRef.current
    const provider = providerRef.current
    if (!doc || !provider) return

    const yText = doc.getText('monaco')

    if (onCodeChange) {
      yText.observe(() => onCodeChange(yText.toString()))
    }

    // FIX-003: insertar initialCode solo si el doc está vacío tras sync
    provider.on('sync', (synced: boolean) => {
      if (synced) {
        if (yText.length === 0 && initialCode) {
          doc.transact(() => yText.insert(0, initialCode))
        }
        setIsSynced(true)
        onConnectionChange?.('connected')
      }
    })

    // Fallback: si sync no dispara en 3s, considerar inicializado
    setTimeout(() => {
      setIsSynced(true)
      if (yText.length === 0 && initialCode) {
        doc.transact(() => yText.insert(0, initialCode))
      }
    }, 3_000)

    bindingRef.current = new MonacoBinding(yText, editor.getModel()!, new Set([editor]), provider.awareness)

    if (readOnly) editor.updateOptions({ readOnly: true })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* CSS para decoraciones de Code Review */}
      <style>{`.mp-review-line { background: rgba(234,179,8,0.12); border-left: 3px solid rgba(234,179,8,0.6); }`}</style>

      {/* Barra de estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 24px', background: '#0a1520', borderBottom: '1px solid rgba(5,102,141,0.18)', fontSize: 11, flexShrink: 0 }}>
        {peers.length > 0 && (
          <span style={{ color: '#3a6a7a' }}>
            {peers.map((p, i) => (
              <span key={p.name}>
                {i > 0 && ', '}
                {p.name} está {p.mode === 'observing' ? 'observando' : 'editando'}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Editor con overlay de sincronización (FIX-003) */}
      <div style={{ flex: 1, background: '#060f18', position: 'relative' }}>
        <Editor
          height="100%"
          language={language}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            padding: { top: 24, bottom: 24 },
            automaticLayout: true,
            readOnly,
            lineDecorationsWidth: 8,
            glyphMargin: false,
            folding: false,
            lineNumbersMinChars: 3,
          }}
        />
        {/* Overlay mientras el doc Yjs se sincroniza */}
        {!isSynced && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(6,15,24,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(2,195,154,0.2)', borderTopColor: '#02C39A',
              animation: 'spin 0.9s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: '#3a6a7a' }}>Sincronizando editor…</span>
          </div>
        )}
      </div>
    </div>
  )
}
