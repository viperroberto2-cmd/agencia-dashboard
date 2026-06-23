// routes/crew.js — /api/crew/*, /api/call/*, /api/generar-bot, /api/setup/higgsfield-agent
const express = require('express');
const https   = require('https');
const router  = express.Router();
const { _generarImagenHiggsfieldMCP } = require('../lib/tools');


router.post('/call/iniciar', async (req, res) => {
  const { to, cliente } = req.body;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber)
    return res.json({ ok: false, error: 'Twilio no configurado en Railway' });
  try {
    const body = new URLSearchParams({ To: to, From: fromNumber, Url: `https://${req.hostname}/voice` });
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await resp.json();
    if (data.sid) res.json({ ok: true, sid: data.sid });
    else res.json({ ok: false, error: data.message || 'Error Twilio' });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.post('/generar-bot', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Railway' });
  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body) }
  };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch(e) { res.status(500).json({ error: 'Parse error', raw: data.slice(0, 500) }); }
    });
  });
  proxyReq.on('error', e => res.status(500).json({ error: e.message }));
  proxyReq.write(body);
  proxyReq.end();
});

router.post('/setup/higgsfield-agent', async (req, res) => {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'No ANTHROPIC_API_KEY' });
  if (!HF_KEY) return res.status(500).json({ error: 'No HIGGSFIELD_API_KEY' });

  const results = {};

  try {
    const mcpRes = await fetch('https://mcp.higgsfield.ai/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HF_KEY}` },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agencia-ai', version: '1.0' } }, id: 1 }),
      signal: AbortSignal.timeout(10000)
    });
    const mcpText = await mcpRes.text();
    results.mcp_direct = { status: mcpRes.status, body: mcpText.slice(0, 400) };
  } catch(e) { results.mcp_direct = { error: e.message }; }

  try {
    const testUrl = await _generarImagenHiggsfieldMCP('professional financial education photo, Hispanic family, warm lighting, studio quality');
    results.mcp_generate_image = { ok: true, url: testUrl };
  } catch(e) { results.mcp_generate_image = { error: e.message }; }

  return res.json(results);
});

module.exports = router;
