const express = require('express');
const router = express.Router();

// Simple proxy to local Hermes on port 8888
router.post('/stream/organizador', async (req, res) => {
  const { mensaje, message } = req.body;
  const msg = mensaje || message || '';

  // Get Hermes proxy URL from env or use default (VPS proxy)
  const hermes_proxy_url = process.env.HERMES_PROXY_URL || 'http://168.231.66.172:8890/api/hermes/chat';
  
  try {
    const response = await fetch(hermes_proxy_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: msg
      })
    });

    if (!response.ok) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
      res.write(`data: ${JSON.stringify({ error: 'Hermes proxy returned ' + response.status })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Set SSE headers and pipe response from Hermes
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    response.body.pipe(res);
  } catch(err) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    res.write(`data: ${JSON.stringify({ error: 'Error connecting to Hermes: ' + err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// GET chat history (compatibility endpoint)
router.get('/chat/history', (req, res) => {
  res.json({ mensajes: [] });
});

// POST chat history (compatibility endpoint)
router.post('/chat/history', (req, res) => {
  res.json({ ok: true });
});

// DELETE chat history (compatibility endpoint)
router.delete('/chat/history', (req, res) => {
  res.json({ ok: true });
});

// GET history for client
router.get('/mensajes/organizador', (req, res) => {
  res.json({ mensajes: [] });
});

module.exports = router;
