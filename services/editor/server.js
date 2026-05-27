const express   = require('express')
const http      = require('http')
const WebSocket = require('ws')
const { setupWSConnection, docs } = require('y-websocket/bin/utils')
const Y         = require('yjs')
const { createClient } = require('redis')
const { randomUUID }   = require('crypto')

const app    = express()
const server = http.createServer(app)
const wss    = new WebSocket.Server({ noServer: true })

app.use(express.json())

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://redis:6379' })
redis.on('error', (err) => console.error('[editor] Redis error:', err))
redis.connect().then(() => console.log('[editor] Redis connected'))

const SNAPSHOT_KEY = (id) => `editor:room:${id}:snapshot`
const UPDATES_KEY  = (id) => `editor:room:${id}:updates`
const SNAPSHOT_INTERVAL_MS = 30_000

// Rooms que ya tienen el listener de Event Sourcing registrado
const listenersRegistered = new Set()

async function restoreSnapshot(doc, roomId) {
  try {
    const encoded = await redis.get(SNAPSHOT_KEY(roomId))
    if (encoded) {
      Y.applyUpdate(doc, Buffer.from(encoded, 'base64'))
      console.log(`[editor] snapshot restored room=${roomId}`)
    }
  } catch (e) {
    console.warn(`[editor] no snapshot for room=${roomId}:`, e.message)
  }
}

// Registra Event Sourcing + snapshot periódico en el doc real de y-websocket
function registerListeners(doc, roomId) {
  if (listenersRegistered.has(roomId)) return
  listenersRegistered.add(roomId)

  // DTD-002: cada update va a Redis
  doc.on('update', (update) => {
    const entry = JSON.stringify({
      timestamp: Date.now(),
      update: Buffer.from(update).toString('base64'),
    })
    redis.lPush(UPDATES_KEY(roomId), entry).catch(() => {})
  })

  // DTD-001: snapshot periódico cada 30s
  setInterval(() => {
    const state = Y.encodeStateAsUpdate(doc)
    redis.set(SNAPSHOT_KEY(roomId), Buffer.from(state).toString('base64')).catch(() => {})
  }, SNAPSHOT_INTERVAL_MS)

  console.log(`[editor] listeners registered room=${roomId}`)
}

wss.on('connection', async (ws, req) => {
  const url    = req.url ?? ''
  const match  = url.match(/\/rooms\/([^/?]+)/)
  const roomId = match ? match[1] : 'default'
  console.log(`[editor] WS connection → room=${roomId}`)

  // 1. setupWSConnection crea/obtiene el doc en su mapa interno (docs)
  setupWSConnection(ws, req, { docName: roomId, gc: true })

  // 2. Obtener el doc que setupWSConnection realmente usa
  const doc = docs.get(roomId)
  if (!doc) {
    console.error(`[editor] doc not found after setupWSConnection room=${roomId}`)
    return
  }

  // 3. Restaurar snapshot si es la primera conexión a esta sala
  if (!listenersRegistered.has(roomId)) {
    await restoreSnapshot(doc, roomId)
  }

  // 4. Registrar Event Sourcing en el doc real
  registerListeners(doc, roomId)
})

server.on('upgrade', (req, socket, head) => {
  const url   = req.url ?? ''
  const match = url.match(/\/rooms\/([^/?]+)/)
  if (!match) { socket.destroy(); return }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
})

app.post('/editor/rooms', (req, res) => {
  const roomId = req.body?.sessionId ?? randomUUID()
  res.status(201).json({
    roomId,
    editorUrl: `ws://localhost/editor/rooms/${roomId}`,
    createdAt: new Date().toISOString(),
  })
})

app.get('/editor/rooms/:roomId/replay', async (req, res) => {
  const { roomId } = req.params
  try {
    const raw     = await redis.lRange(UPDATES_KEY(roomId), 0, -1)
    const updates = raw.map((r) => JSON.parse(r)).reverse()
    res.json({ roomId, updates, total: updates.length })
  } catch (e) {
    res.status(500).json({ error: 'replay_unavailable', message: e.message })
  }
})

/**
 * GET /editor/rooms/:roomId/state
 *
 * Reconstruye el documento Yjs desde snapshot Redis (o log de updates)
 * y devuelve el código actual como string plano. Usado por B5 (Notifications).
 */
app.get('/editor/rooms/:roomId/state', async (req, res) => {
  const { roomId } = req.params

  try {
    const snapshotEncoded = await redis.get(SNAPSHOT_KEY(roomId))
    const tempDoc = new Y.Doc()

    if (snapshotEncoded) {
      Y.applyUpdate(tempDoc, Buffer.from(snapshotEncoded, 'base64'))
    } else {
      const raw = await redis.lRange(UPDATES_KEY(roomId), 0, -1)
      if (raw && raw.length > 0) {
        for (const entry of raw) {
          try {
            const parsed = JSON.parse(entry)
            if (parsed.update) {
              Y.applyUpdate(tempDoc, Buffer.from(parsed.update, 'base64'))
            }
          } catch (e) {
            console.error(`[editor] failed to apply update for ${roomId}:`, e.message)
          }
        }
      }
    }

    const yText = tempDoc.getText('monaco')
    const code  = yText.toString()
    tempDoc.destroy()

    res.json({
      roomId,
      code,
      length:      code.length,
      hasSnapshot: !!snapshotEncoded,
      timestamp:   new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[editor] /state error for room ${roomId}:`, err)
    res.status(500).json({ error: 'failed to reconstruct state', message: err.message })
  }
})

app.get('/editor/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'editor',
    mode:      'yjs+websocket+redis',
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT ?? 3000
server.listen(PORT, '0.0.0.0', () => console.log(`[editor] listening on port ${PORT}`))
