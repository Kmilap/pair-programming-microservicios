const express = require('express')
const http    = require('http')
const WebSocket = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')
const { createClient } = require('redis')
const { randomUUID } = require('crypto')

const app    = express()
const server = http.createServer(app)
const wss    = new WebSocket.Server({ noServer: true })

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://redis:6379' })
redis.on('error', (err) => console.error('[editor] Redis error:', err))
redis.connect().then(() => console.log('[editor] Redis connected'))

wss.on('connection', (ws, req) => {
  const roomId = req.url?.split('/').pop() ?? 'default'
  console.log(`[editor] WS connection → room=${roomId}`)
  setupWSConnection(ws, req, { docName: roomId, gc: true })
})

server.on('upgrade', (req, socket, head) => {
  const url = req.url ?? ''
  if (url.startsWith('/editor/rooms/')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

app.post('/editor/rooms', (req, res) => {
  const roomId = randomUUID()
  res.status(201).json({
    roomId,
    editorUrl: `ws://localhost/editor/rooms/${roomId}`,
    createdAt: new Date().toISOString(),
  })
})

app.get('/editor/health', (req, res) => {
  res.json({ status: 'ok', service: 'editor', mode: 'yjs+websocket', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT ?? 3000
server.listen(PORT, '0.0.0.0', () => console.log(`[editor] listening on port ${PORT}`))
