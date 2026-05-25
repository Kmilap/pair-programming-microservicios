// ============================================================
// Editor Colaborativo — Stub Día 3
// ============================================================
// Día 3: stub que responde POST /editor/rooms con un payload fake
//        para que Pair Programming pueda completar el patrón Aggregator.
// Día 4: este mismo proyecto se amplía con Yjs + WebSocket para
//        sincronización colaborativa real (sin cambiar este endpoint).
// ============================================================

const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

// ----------------------------------------------------------
// POST /editor/rooms
// ----------------------------------------------------------
// Lo invoca Pair Programming desde el Aggregator al iniciar
// una sesión. Devuelve identificador y URL del documento.
// ----------------------------------------------------------
app.post('/editor/rooms', (req, res) => {
  const roomId = randomUUID();
  console.log(`[editor-stub] POST /editor/rooms → roomId=${roomId}`);
  res.status(201).json({
    roomId,
    editorUrl: `ws://localhost/editor/rooms/${roomId}`,
    createdAt: new Date().toISOString(),
  });
});

// ----------------------------------------------------------
// GET /editor/health
// ----------------------------------------------------------
// Patrón: Health Check (igual que el resto de microservicios)
// ----------------------------------------------------------
app.get('/editor/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'editor',
    mode: 'stub',
    timestamp: new Date().toISOString(),
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[editor-stub] listening on port ${PORT}`);
});