import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

interface Props {
  sessionId: string
  userId: number
  userName: string
  language: string
  initialCode: string
  readOnly?: boolean
}

export default function CollaborativeEditor({ 
  sessionId, 
  userId, 
  userName, 
  language, 
  initialCode, 
  readOnly = false 
}: Props) {
  const [connected, setConnected] = useState(false)
  const [peers, setPeers] = useState<string[]>([])
  const editorRef = useRef<any>(null)
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    const wsUrl = `ws://localhost/editor/rooms`
    const provider = new WebsocketProvider(wsUrl, sessionId, doc)

    docRef.current = doc
    providerRef.current = provider

    // Awareness — nombre del usuario
    provider.awareness.setLocalStateField('user', {
      id: userId,
      name: userName,
      color: '#02C39A',
    })

    provider.on('status', ({ status }: { status: string }) => {
      setConnected(status === 'connected')
    })

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values())
      const names = states
        .map((s: any) => s.user?.name)
        .filter((n): n is string => !!n && n !== userName)
      setPeers(names)
    })

    return () => {
      bindingRef.current?.destroy()
      provider.destroy()
      doc.destroy()
    }
  }, [sessionId, userId, userName])

  // Actualiza las opciones de Monaco dinámicamente cuando cambia readOnly
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: readOnly })
    }
  }, [readOnly])

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Configuración de tema personalizado
    monaco.editor.defineTheme('micro-pair', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '3a6a7a', fontStyle: 'italic' },
        { token: 'keyword', foreground: '028090' },
        { token: 'string', foreground: 'F0F3BD' },
        { token: 'number', foreground: '02C39A' },
      ],
      colors: {
        'editor.background': '#060f18',
        'editor.foreground': '#7ab8c8',
        'editor.lineHighlightBackground': '#0a1a28',
        'editor.selectionBackground': '#028090aa',
        'editorLineNumber.foreground': '#1e3a4a',
        'editorLineNumber.activeForeground': '#3a6a7a',
        'editorCursor.foreground': '#02C39A',
        'scrollbarSlider.background': '#0a1a2844',
      },
    })
    monaco.editor.setTheme('micro-pair')

    const doc = docRef.current
    const provider = providerRef.current
    if (!doc || !provider) return

    const yText = doc.getText('monaco')

    // Insertar código inicial UNA SOLA VEZ cuando el servidor confirme sync
    // y el documento esté genuinamente vacío
    let initialized = false
    const tryInit = () => {
      if (initialized) return
      const content = yText.toString()
      if (content.length === 0) {
        initialized = true
        doc.transact(() => {
          yText.insert(0, initialCode)
        })
      } else {
        initialized = true // El documento ya tiene contenido proveniente de Redis — no re-insertar
      }
    }

    provider.on('sync', (synced: boolean) => {
      if (synced) tryInit()
    })

    // Fallback por si el evento sync ya se disparó antes de este mount
    setTimeout(tryInit, 800)

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness,
    )

    if (readOnly) {
      editor.updateOptions({ readOnly: true })
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barra de estado conexión */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 24px', background: '#0a1520', borderBottom: '1px solid rgba(5,102,141,0.18)', fontSize: 11, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#02C39A' : '#ff6b6b', boxShadow: connected ? '0 0 6px #02C39A' : 'none', transition: 'background 0.3s' }} />
          <span style={{ color: connected ? '#02C39A' : '#ff6b6b' }}>{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
        {peers.length > 0 && (
          <span style={{ color: '#3a6a7a' }}>
            {peers.join(', ')} {peers.length === 1 ? 'está' : 'están'} editando
          </span>
        )}
      </div>

      {/* Monaco Editor Container */}
      <div style={{ flex: 1, background: '#060f18' }}>
        <Editor
          height="100%"
          language={language}
          theme="micro-pair"
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
            readOnly: readOnly,
            theme: 'micro-pair',
            lineDecorationsWidth: 8,
            glyphMargin: false,
            folding: false,
            lineNumbersMinChars: 3,
          }}
        />
      </div>
    </div>
  )
}