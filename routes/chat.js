// routes/chat.js — Pass-through SSE al Hermes Proxy v0.1.0
const express = require('express');
const router = express.Router();

const HERMES_PROXY_URL = (process.env.HERMES_PROXY_URL || 'http://168.231.66.172:8000').replace(/\/$/, '');
const HERMES_PROXY_KEY = process.env.HERMES_PROXY_KEY || '';

router.post('/stream/organizador', async (req, res) => {
  const { mensaje, message, cliente_id, session_id } = req.body || {};
  const msg = (mensaje || message || '').trim();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    'Connection': 'keep-alive',
  });

  const sseEnd = () => { res.write('data: [DONE]\n\n'); res.end(); };

  if (!msg) {
    res.write(`data: ${JSON.stringify({ error: 'Empty message' })}\n\n`);
    return sseEnd();
  }

  if (!HERMES_PROXY_KEY) {
    console.error('[CHAT] HERMES_PROXY_KEY env var missing');
    res.write(`data: ${JSON.stringify({ error: 'Hermes proxy key not configured' })}\n\n`);
    return sseEnd();
  }

  console.log(`[CHAT] msg="${msg.substring(0, 60)}..." sid=${session_id || 'NEW'} cliente=${cliente_id || '-'}`);

  try {
    const proxyResponse = await fetch(`${HERMES_PROXY_URL}/v1/chat`, {
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

    if (!proxyResponse.ok) {
      const errText = await proxyResponse.text().catch(() => 'unknown error');
      console.error(`[CHAT] Proxy ${proxyResponse.status}: ${errText.substring(0, 200)}`);
      res.write(`data: ${JSON.stringify({ error: `Hermes proxy ${proxyResponse.status}`, detail: errText.substring(0, 200) })}\n\n`);
      return sseEnd();
    }

    // Pass-through del SSE stream del proxy al cliente
    const reader = proxyResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
    console.log('[CHAT] stream completado');

  } catch (err) {
    console.error('[CHAT] Fetch error:', err.message);
    res.write(`data: ${JSON.stringify({ error: `Connection failed: ${err.message}` })}\n\n`);
    sseEnd();
  }
});

router.get('/chat/health', async (_req, res) => {
  try {
    const r = await fetch(`${HERMES_PROXY_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    res.json({ status: 'ok', proxy: d, key_configured: !!HERMES_PROXY_KEY });
  } catch (e) {
    res.json({ status: 'error', error: e.message, proxy_url: HERMES_PROXY_URL });
  }
});

// Compat endpoints (memoria la maneja Hermes internamente)
router.get('/chat/history', (_req, res) => res.json({ mensajes: [] }));
router.post('/chat/history', (_req, res) => res.json({ ok: true }));
router.delete('/chat/history', (_req, res) => res.json({ ok: true }));
router.get('/mensajes/organizador', (_req, res) => res.json({ mensajes: [] }));

module.exports = router;
