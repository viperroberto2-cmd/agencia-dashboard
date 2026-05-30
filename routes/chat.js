// routes/chat.js — Conectado al Hermes Proxy v0.1.0 en VPS
const express = require('express');
const router = express.Router();

const HERMES_PROXY_URL = (process.env.HERMES_PROXY_URL || 'http://168.231.66.172:8000').replace(/\/$/, '');
const HERMES_PROXY_KEY = process.env.HERMES_PROXY_KEY || '';

/**
 * POST /api/stream/organizador
 * Chat del Cerebro — proxy a Hermes Agent vía hermes-proxy en VPS.
 * Mantiene formato SSE para compatibilidad con el frontend actual.
 */
router.post('/stream/organizador', async (req, res) => {
  const { mensaje, message, cliente_id, session_id } = req.body || {};
  const msg = (mensaje || message || '').trim();

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    'Connection': 'keep-alive',
  });

  const sseSend = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const sseEnd = () => { res.write('data: [DONE]\n\n'); res.end(); };

  if (!msg) {
    sseSend({ error: 'Empty message' });
    return sseEnd();
  }

  if (!HERMES_PROXY_KEY) {
    console.error('[CHAT] HERMES_PROXY_KEY env var missing');
    sseSend({ error: 'Hermes proxy key not configured. Set HERMES_PROXY_KEY in Railway env.' });
    return sseEnd();
  }

  console.log(`[CHAT] msg="${msg.substring(0, 60)}..." sid=${session_id || 'NEW'} cliente=${cliente_id || '-'}`);

  try {
    const startedAt = Date.now();
    const response = await fetch(`${HERMES_PROXY_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': HERMES_PROXY_KEY,
      },
      body: JSON.stringify({
        message: msg,
        session_id: session_id || undefined,
        source: 'dashboard',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown error');
      console.error(`[CHAT] Proxy ${response.status}: ${errText.substring(0, 200)}`);
      sseSend({ error: `Hermes proxy returned ${response.status}`, detail: errText.substring(0, 200) });
      return sseEnd();
    }

    const data = await response.json();
    const elapsed = Date.now() - startedAt;
    console.log(`[CHAT] sid=${data.session_id} duration=${data.duration_ms}ms total=${elapsed}ms`);

    // Emit metadata first
    sseSend({
      _meta: {
        session_id: data.session_id,
        duration_ms: data.duration_ms,
      },
    });

    // Emit response content (fake-stream: one chunk for now)
    sseSend({ content: data.response });

    sseEnd();
  } catch (err) {
    console.error('[CHAT] Fetch error:', err.message);
    sseSend({ error: `Connection to Hermes proxy failed: ${err.message}` });
    sseEnd();
  }
});

/**
 * GET /api/chat/health
 * Verifica que el proxy esté vivo.
 */
router.get('/chat/health', async (_req, res) => {
  try {
    const r = await fetch(`${HERMES_PROXY_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    res.json({ status: 'ok', proxy: d, key_configured: !!HERMES_PROXY_KEY });
  } catch (e) {
    res.json({ status: 'error', error: e.message, proxy_url: HERMES_PROXY_URL });
  }
});

// Compatibility endpoints (Hermes maneja memoria internamente, no se necesita persistir history aquí)
router.get('/chat/history', (_req, res) => res.json({ mensajes: [] }));
router.post('/chat/history', (_req, res) => res.json({ ok: true }));
router.delete('/chat/history', (_req, res) => res.json({ ok: true }));
router.get('/mensajes/organizador', (_req, res) => res.json({ mensajes: [] }));

module.exports = router;
