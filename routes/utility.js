// routes/utility.js — /api/health, /api/home-stats, /api/inbox, /api/recordings,
//                     /api/scraper/*, /api/env-check, /api/ms/jobs,
//                     /api/vision, /api/document-docx, /api/document
const express  = require('express');
const https    = require('https');
const router   = express.Router();
const { sbFetch } = require('../lib/db');

const mammoth = require('mammoth');

const BOTS = {
  b1:        'https://worker-production-0c858.up.railway.app/bot1/health',
  b2:        'https://worker-production-34f9.up.railway.app/crew/health',
  b3:        'https://worker-production-035f.up.railway.app/strategy/health',
  org:       'https://web-production-77871.up.railway.app/health',
  b5:        'https://worker-production-aa53.up.railway.app/scheduler/health',
  web:       'https://agencia-ai-web-designer-production.up.railway.app/web/health',
  motion:    'https://web-production-d67bad.up.railway.app/motion/health',
  scraper:   'https://agencia-ai-scraper-production.up.railway.app/health',
  seo:       'https://agencia-ai-seo-production.up.railway.app/health',
  analytics: 'https://agencia-ai-analytics-production.up.railway.app/analytics/health',
  compositor:'https://compositorbot-production.up.railway.app/compositor/health',
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
  });
}

router.get('/health', async (req, res) => {
  const results = {};
  await Promise.all(Object.entries(BOTS).map(async ([id, url]) => {
    results[id] = await checkUrl(url);
  }));
  res.json(results);
});

const CERRADO_STATUSES = new Set(['closed', 'cerrado', 'sold', 'completed', 'cerrada']);

router.get('/home-stats', async (req, res) => {
  try {
    const clienteFilter = req.query.cliente || null;
    const leadsPath = '/voice_leads?select=call_sid,call_status,status,ts_inicio&order=ts_inicio.desc&limit=200'
      + (clienteFilter ? `&cliente=eq.${encodeURIComponent(clienteFilter)}` : '');
    const [leadsR, clientesR, actividadR] = await Promise.all([
      sbFetch(leadsPath),
      sbFetch('/clientes?select=user_id,nombre,precio_producto&limit=100'),
      sbFetch('/inbox_organizador?select=bot_destino,tipo,contenido,ts_creado&order=ts_creado.desc&limit=10'),
    ]);
    const leads     = await leadsR.json();
    const clientes  = await clientesR.json();
    const actividad = await actividadR.json();

    const hace7d = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const leads7d = Array.isArray(leads)
      ? leads.filter(l => l.ts_inicio && new Date(l.ts_inicio * 1000) > hace7d)
      : [];
    const cerrados = Array.isArray(leads)
      ? leads.filter(l => CERRADO_STATUSES.has((l.status || '').toLowerCase().trim()) ||
                          CERRADO_STATUSES.has((l.call_status || '').toLowerCase().trim()))
      : [];

    let precioUnitario = 197;
    if (clienteFilter && Array.isArray(clientes)) {
      const cli = clientes.find(c => c.user_id === clienteFilter || c.nombre === clienteFilter);
      if (cli && cli.precio_producto) precioUnitario = Number(cli.precio_producto);
    }

    res.json({
      ok: true,
      leads_7d:        leads7d.length,
      leads_total:     Array.isArray(leads) ? leads.length : 0,
      clientes:        Array.isArray(clientes) ? clientes.filter(c => c.user_id !== 'ms_jobs_dashboard').length : 0,
      clientes_names:  Array.isArray(clientes) ? clientes.filter(c => c.nombre).map(c => c.nombre).slice(0, 3) : [],
      cerrados:        cerrados.length,
      revenue_est:     cerrados.length * precioUnitario,
      precio_unitario: precioUnitario,
      actividad:       Array.isArray(actividad) ? actividad : [],
    });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.get('/inbox', async (req, res) => {
  const client = req.query.client || 'roberto_agencia';
  const limit  = parseInt(req.query.limit) || 50;
  try {
    const r = await sbFetch(
      `/inbox_organizador?user_id=eq.${encodeURIComponent(client)}&order=ts_creado.desc&limit=${limit}`
    );
    const data = await r.json();
    res.json({ ok: true, items: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, items: [], error: e.message }); }
});

router.patch('/inbox/:id', async (req, res) => {
  const { id } = req.params;
  const allowed = ['ts_procesado', 'prioridad'];
  const patch = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  if (!Object.keys(patch).length) return res.status(400).json({ ok: false, error: 'Nada que actualizar' });
  try {
    await sbFetch(`/inbox_organizador?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.get('/recordings', async (req, res) => {
  try {
    const cliente = req.query.cliente ? `&cliente=eq.${req.query.cliente}` : '';
    const r = await sbFetch(`/voice_leads?select=call_sid,recording_url,agent,cliente,call_status,ts_inicio,telefono,duration,transcript,created_at&recording_url=not.is.null${cliente}&order=ts_inicio.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.get('/scraper/logs', async (req, res) => {
  try {
    const r = await sbFetch('/scraper_logs?select=*&order=ts.desc&limit=50');
    const data = await r.json();
    res.json({ ok: true, logs: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.get('/scraper/stats', async (req, res) => {
  try {
    const r = await sbFetch('/scraper_logs?select=status,ms&limit=500');
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.json({ ok: true, total: 0, success_rate: 0, avg_ms: 0 });
    const total  = data.length;
    const okCount = data.filter(d => d.status >= 200 && d.status < 400).length;
    const avg_ms = Math.round(data.reduce((s, d) => s + (d.ms || 0), 0) / total);
    res.json({ ok: true, total, success_rate: Math.round(okCount / total * 100), avg_ms });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.post('/scraper/log', async (req, res) => {
  try {
    await sbFetch('/scraper_logs', { method: 'POST', body: JSON.stringify(req.body) });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.get('/ms/jobs', async (req, res) => {
  const uid = 'ms_jobs_dashboard';
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${uid}&select=data`);
    const rows = await r.json();
    const jobs = rows[0]?.data?.jobs || [];
    res.json({ ok: true, jobs });
  } catch(e) { res.json({ ok: false, jobs: [], error: e.message }); }
});

router.post('/ms/jobs', async (req, res) => {
  const uid = 'ms_jobs_dashboard';
  const job = req.body;
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${uid}&select=data`);
    const rows = await r.json();
    const current = rows[0]?.data || { jobs: [] };
    current.jobs = [job, ...(current.jobs || [])].slice(0, 50);
    await sbFetch('/clientes', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: JSON.stringify({ user_id: uid, data: current }),
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/env-check', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized — set X-Admin-Secret header' });
  }
  const vars = [
    'SUPABASE_URL','SUPABASE_PROJECT_URL','NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SERVICE_KEY',
  ];
  const result = {};
  vars.forEach(v => {
    const val = process.env[v];
    result[v] = val ? `SET (${val.slice(0,30)}...)` : 'NOT SET';
  });
  res.json(result);
});

router.post('/vision', async (req, res) => {
  const { imagen_b64, caption, media_type } = req.body;
  if (!imagen_b64) return res.json({ response: 'No se recibió imagen.' });
  try {
    const r = await fetch('https://web-production-77871.up.railway.app/organizador/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen_b64, caption: caption || 'Analiza esta imagen.', user_id: '8534665260', media_type: media_type || 'image/jpeg' })
    });
    const d = await r.json();
    res.json({ response: d.respuesta || d.response || 'Sin respuesta' });
  } catch(e) { res.json({ response: 'Error: ' + e.message }); }
});

router.post('/document-docx', async (req, res) => {
  const { doc_b64, caption, filename } = req.body;
  if (!doc_b64) return res.json({ response: 'No se recibió documento.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.json({ response: 'ANTHROPIC_API_KEY no configurada.' });
  try {
    const buf = Buffer.from(doc_b64, 'base64');
    const { value: text } = await mammoth.extractRawText({ buffer: buf });
    if (!text.trim()) return res.json({ response: 'No se pudo extraer texto del documento.' });
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 2000,
      messages: [{ role: 'user', content: `${caption || 'Analiza este documento'} (${filename || 'archivo.docx'}):\n\n${text.slice(0, 30000)}` }]
    });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body
    });
    const d = await r.json();
    res.json({ response: d.content?.[0]?.text || 'Sin respuesta', texto: text.slice(0, 12000) });
  } catch(e) { res.json({ response: 'Error procesando DOCX: ' + e.message }); }
});

router.post('/document', async (req, res) => {
  const { doc_b64, caption, filename } = req.body;
  if (!doc_b64) return res.json({ response: 'No se recibió documento.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.json({ response: 'ANTHROPIC_API_KEY no configurada en Railway.' });
  try {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc_b64 } },
        { type: 'text', text: caption || ('Analiza este documento: ' + (filename || 'archivo.pdf')) }
      ]}]
    });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body) },
      body
    });
    const d = await r.json();
    res.json({ response: d.content?.[0]?.text || 'Sin respuesta' });
  } catch(e) { res.json({ response: 'Error procesando documento: ' + e.message }); }
});

module.exports = router;
