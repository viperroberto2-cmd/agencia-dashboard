const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const path = require('path');

// Import the intelligent model router
let selectModel;
try {
  selectModel = require('../lib/model-router.js').selectModel || (msg => ({ model: 'anthropic/claude-haiku-4-5-20251001', complexity: 'SIMPLE' }));
} catch (err) {
  console.warn('[CHAT] Model router not found, using default Haiku');
  selectModel = (msg) => ({ model: 'anthropic/claude-haiku-4-5-20251001', complexity: 'SIMPLE' });
}

/**
 * POST /api/stream/organizador
 * Main chat endpoint with intelligent model routing
 */
router.post('/stream/organizador', async (req, res) => {
  const { mensaje, message, cliente_id } = req.body;
  const msg = mensaje || message || '';

  if (!msg || msg.trim().length === 0) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    res.write(`data: ${JSON.stringify({ error: 'Empty message' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Use intelligent model selection
  const modelSelection = selectModel(msg);
  const { model: selectedModel, complexity } = modelSelection;

  console.log(`[CHAT] Mensaje: "${msg.substring(0, 50)}..."`);
  console.log(`[ROUTER] ${complexity} → ${selectedModel.split('/').pop()}`);

  // Get Hermes proxy URL from env or use default (VPS proxy)
  const hermes_proxy_url = process.env.HERMES_PROXY_URL || 'http://168.231.66.172:8890/api/hermes/chat';
  
  try {
    // Update Hermes config.yaml with selected model
    try {
      execSync(`sed -i 's/default:.*/default: ${selectedModel}/' /opt/data/config.yaml`, {
        timeout: 2000,
        stdio: 'pipe'
      });
    } catch (configErr) {
      console.warn('[CHAT] Could not update config.yaml:', configErr.message);
    }

    // Call Hermes proxy with the selected model
    const response = await fetch(hermes_proxy_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: msg,
        model: selectedModel,
        complexity: complexity,
        cliente_id: cliente_id
      })
    });

    if (!response.ok) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
      res.write(`data: ${JSON.stringify({ 
        error: 'Hermes proxy returned ' + response.status,
        complexity: complexity,
        model: selectedModel.split('/').pop()
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Set SSE headers and pipe response from Hermes
    res.writeHead(200, { 
      'Content-Type': 'text/event-stream', 
      'Cache-Control': 'no-cache', 
      'X-Accel-Buffering': 'no', 
      'Connection': 'keep-alive'
    });
    
    // Log the routing decision in the stream
    res.write(`data: ${JSON.stringify({ 
      _meta: {
        routing_complexity: complexity,
        routing_model: selectedModel.split('/').pop(),
        router_active: true
      }
    })}\n\n`);

    // Pipe response from Hermes
    response.body.pipe(res);
  } catch(err) {
    console.error('[CHAT] Error:', err.message);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    res.write(`data: ${JSON.stringify({ 
      error: 'Error connecting to Hermes: ' + err.message,
      complexity: complexity,
      model: selectedModel.split('/').pop()
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * GET /api/chat/health
 * Check health of model router
 */
router.get('/chat/health', (req, res) => {
  res.json({
    status: 'ok',
    router_active: true,
    models_available: [
      'anthropic/claude-haiku-4-5-20251001',
      'anthropic/claude-sonnet-4-6-20250514'
    ]
  });
});

/**
 * POST /api/chat/router-test
 * Test the model router with a message
 */
router.post('/chat/router-test', (req, res) => {
  const { mensaje } = req.body;
  
  if (!mensaje) {
    return res.json({ error: 'Missing mensaje parameter' });
  }

  const selection = selectModel(mensaje);
  res.json({
    mensaje: mensaje,
    ...selection
  });
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
