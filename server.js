const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();

const { hashPassword, _sessions, crypto } = require('./lib/auth-helpers');
const { _FB_PAGES, _resolvePageId, publishToFacebook } = require('./lib/facebook');
const { _cargarSkill, _CATALOGO_SKILLS } = require('./lib/skills');
const { _saveToMediaLibrary, getGoogleAccessToken } = require('./lib/media');
const { _ejecutarHerramienta, _generarImagenHiggsfieldMCP, _parseMcpResponse } = require('./lib/tools');
const chatRouter = require('./routes/chat');
const pagesRouter = require('./routes/pages');

const BOTS = {
  b1:  'https://worker-production-0c858.up.railway.app/bot1/health',
  b2:  'https://worker-production-34f9.up.railway.app/crew/health',
  b3: 'https://worker-production-035f.up.railway.app/strategy/health',
  org: 'https://web-production-77871.up.railway.app/health',
  b5:     'https://worker-production-aa53.up.railway.app/scheduler/health',
  web:    'https://agencia-ai-web-designer-production.up.railway.app/web/health',
  motion:    'https://web-production-d67bad.up.railway.app/motion/health',
  scraper:   'https://agencia-ai-scraper-production.up.railway.app/health',
  seo:       'https://agencia-ai-seo-production.up.railway.app/health',
  analytics:   'https://agencia-ai-analytics-production.up.railway.app/health',
  compositor:  'https://compositorbot-production.up.railway.app/compositor/health',
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

app.use(express.static(path.join(__dirname), { index: false }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Pages router (HTML, PWA icons, portal, onboarding) ───────────────────
app.use('/', pagesRouter);

// ── Auth router ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));


// ── Content + Scheduler routers ──────────────────────────────────────────────
app.use('/api/content', require('./routes/content'));
app.use('/api/scheduler', require('./routes/scheduler'));


// publishToFacebook movido a lib/facebook.js

// ── Portal router ─────────────────────────────────────────────────────────
const { portalRouter, portalUsersRouter } = require('./routes/portal');
app.use('/api/portal', portalRouter);
app.use('/api/portal-users', portalUsersRouter);


// ── Merge data JSONB column into top-level keys for portal consumption ───────
function _mergeDataCol(row) {
  const d = row.data || {};
  return {
    ...row,
    ciudad:        row.ciudad        !== undefined ? row.ciudad        : (d.ciudad        || null),
    redes_sociales: row.redes_sociales !== undefined ? row.redes_sociales : (d.redes_sociales || null),
    configuracion:  row.configuracion  !== undefined ? row.configuracion  : (d.configuracion  || null),
  };
}

// ── Supabase helper (server-side, uses secret key) ───────────────────────────
async function sbFetch(path, opts = {}) {
  // Accept multiple Railway env var naming conventions
  const base = process.env.SUPABASE_PROJECT_URL
             || process.env.SUPABASE_URL
             || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SECRET_KEY
             || process.env.SUPABASE_SERVICE_ROLE_KEY
             || process.env.SUPABASE_SERVICE_KEY
             || process.env.SUPABASE_ANON_KEY
             || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base) throw new Error('Supabase URL not set — add SUPABASE_PROJECT_URL to Railway env vars');
  if (!key)  throw new Error('Supabase Key not set — add SUPABASE_SECRET_KEY to Railway env vars');
  const url = `${base}/rest/v1${path}`;
  const headers = {
    apikey: key, Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: opts.prefer || 'return=representation',
    ...opts.headers,
  };
  return fetch(url, { method: opts.method || 'GET', headers, body: opts.body });
}

// ── Inbox real desde Supabase ──────────────────────────────────────────────
app.get('/api/inbox', async (req, res) => {
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

// ── Marketing Studio jobs — guardar y leer desde Supabase ─────────────────
app.get('/api/ms/jobs', async (req, res) => {
  const uid = 'ms_jobs_dashboard';
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${uid}&select=data`);
    const rows = await r.json();
    const jobs = rows[0]?.data?.jobs || [];
    res.json({ ok: true, jobs });
  } catch(e) { res.json({ ok: false, jobs: [], error: e.message }); }
});

app.post('/api/ms/jobs', async (req, res) => {
  const uid  = 'ms_jobs_dashboard';
  const job  = req.body;
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${uid}&select=data`);
    const rows = await r.json();
    const current = rows[0]?.data || { jobs: [] };
    current.jobs = [job, ...(current.jobs || [])].slice(0, 50); // keep last 50
    await sbFetch('/clientes', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: JSON.stringify({ user_id: uid, data: current }),
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Endpoint diagnóstico — requiere header X-Admin-Secret si ADMIN_SECRET está seteado en env
app.get('/api/env-check', (req, res) => {
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

app.get('/api/health', async (req, res) => {
  const results = {};
  await Promise.all(
    Object.entries(BOTS).map(async ([id, url]) => {
      results[id] = await checkUrl(url);
    })
  );
  res.json(results);
});

app.get('/api/home-stats', async (req, res) => {
  try {
    const [leadsR, clientesR, actividadR] = await Promise.all([
      sbFetch('/voice_leads?select=call_sid,call_status,ts_inicio&order=ts_inicio.desc&limit=200'),
      sbFetch('/clientes?select=user_id,nombre&limit=100'),
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
      ? leads.filter(l => (l.call_status || '').toLowerCase().includes('cerr') ||
                          (l.call_status || '').toLowerCase().includes('sold') ||
                          (l.call_status || '').toLowerCase().includes('complet'))
      : [];

    res.json({
      ok: true,
      leads_7d:       leads7d.length,
      leads_total:    Array.isArray(leads) ? leads.length : 0,
      clientes:       Array.isArray(clientes) ? clientes.filter(c => c.user_id !== 'ms_jobs_dashboard').length : 0,
      clientes_names: Array.isArray(clientes) ? clientes.filter(c => c.nombre).map(c => c.nombre).slice(0, 3) : [],
      cerrados:       cerrados.length,
      revenue_est:    cerrados.length * 197,
      actividad:      Array.isArray(actividad) ? actividad : [],
    });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});


// ── CLICK-TO-CALL ────────────────────────────────────────────────
app.post('/api/call/iniciar', async (req, res) => {
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

// ── CLIENTES ─────────────────────────────────────────────────────
app.use('/api/clientes', require('./routes/clientes'));



// ── RECORDINGS ───────────────────────────────────────────────────
app.get('/api/recordings', async (req, res) => {
  try {
    const cliente = req.query.cliente ? `&cliente=eq.${req.query.cliente}` : '';
    const r = await sbFetch(`/voice_leads?select=call_sid,recording_url,agent,cliente,call_status,ts_inicio,telefono,duration,transcript,created_at&recording_url=not.is.null${cliente}&order=ts_inicio.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── LEADS (CRM) ─────────────────────────────────────────────────
app.use('/api/leads', require('./routes/leads'));
app.use('/api', chatRouter);
app.use('/api', require('./routes/crew'));
app.use('/api', require('./routes/utility'));
const { apiRouter: mediaApiRouter, gdriveRouter } = require('./routes/media');
app.use('/api', mediaApiRouter);
app.use('/gdrive', gdriveRouter);
app.use('/mcp', require('./routes/mcp'));


// ── SCRAPER LOGS ─────────────────────────────────────────────────
app.get('/api/scraper/logs', async (req, res) => {
  try {
    const r = await sbFetch('/scraper_logs?select=*&order=ts.desc&limit=50');
    const data = await r.json();
    res.json({ ok: true, logs: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/scraper/stats', async (req, res) => {
  try {
    const r = await sbFetch('/scraper_logs?select=status,ms&limit=500');
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.json({ ok: true, total: 0, success_rate: 0, avg_ms: 0 });
    const total = data.length;
    const ok    = data.filter(d => d.status >= 200 && d.status < 400).length;
    const avg_ms = Math.round(data.reduce((s, d) => s + (d.ms || 0), 0) / total);
    res.json({ ok: true, total, success_rate: Math.round(ok / total * 100), avg_ms });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/scraper/log', async (req, res) => {
  try {
    await sbFetch('/scraper_logs', { method: 'POST', body: JSON.stringify(req.body) });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/generar-bot', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Railway' }); }

  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
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

// ── Marketing Studio proxies ─────────────────────────────────────────
function proxyPost(targetUrl, req, res) {
  const body = JSON.stringify(req.body);
  const u = new URL(targetUrl);
  const options = {
    hostname: u.hostname,
    path: u.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.status(proxyRes.statusCode).json(JSON.parse(data)); }
      catch(e) { res.status(500).json({ error: 'Parse error', raw: data.slice(0, 500) }); }
    });
  });
  proxyReq.on('error', e => res.status(500).json({ error: e.message }));
  proxyReq.write(body);
  proxyReq.end();
}

function proxyGet(targetUrl, res) {
  const u = new URL(targetUrl);
  const options = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET' };
  const proxyReq = require('https').request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try { res.status(proxyRes.statusCode).json(JSON.parse(data)); }
      catch(e) { res.status(500).json({ error: 'Parse error', raw: data.slice(0, 500) }); }
    });
  });
  proxyReq.on('error', e => res.status(500).json({ error: e.message }));
  proxyReq.end();
}

const CREW_URL = 'https://worker-production-34f9.up.railway.app';

// Perfiles base: fallback cuando Supabase no tiene datos del cliente todavía
const DEFAULT_PROFILES = {
  arranca: {
    nombre: 'Arranca Financial',
    servicio: 'Educación financiera para latinos en USA. Cursos de crédito, manejo de deuda, inversión, y generación de ingresos con Turo (renta de autos).',
    publico_objetivo: 'Latinos/hispanos en USA, 25-45 años, trabajadores que buscan salir de deudas, mejorar su crédito y crear ingresos adicionales.',
    tono: 'Motivacional, cercano, en español. Empoderador. Como un mentor de la comunidad.',
    redes: { facebook_page: 'Arranca Financial', blotato_account: '32320' },
    agente_voz: 'María — bot de llamadas Twilio+ElevenLabs que cierra leads. Proyecto: C:/ArrancaVoiceAgent',
    estrategia_contenido: '1-2 posts/día educativos. Temas: crédito, Turo, inversión básica, testimonios. CTA siempre: llamar a María o agendar consulta.',
    prompt_visual_base: 'SIEMPRE incluir en prompts de imagen/video: "Latino man or woman, Mexican-American, Hispanic, 30s, relatable, professional but approachable, real person not stock photo". NUNCA usar personajes que parezcan asiáticos, europeos o del sur de Asia.',
    historia_posts_recientes: 'Consultar historial de conversación para posts ya publicados esta sesión.',
    _fuente: 'perfil_base_servidor'
  }
};

app.post('/api/crew/seedance', (req, res) => {
  proxyPost(`${CREW_URL}/crew/seedance`, req, res);
});

app.get('/api/crew/seedance/:jobId', (req, res) => {
  proxyGet(`${CREW_URL}/api/crew/seedance/${req.params.jobId}`, res);
});

app.post('/api/crew/imagen', (req, res) => {
  proxyPost(`${CREW_URL}/api/crew/imagen`, req, res);
});

app.get('/api/crew/imagen/:jobId', (req, res) => {
  proxyGet(`${CREW_URL}/api/crew/imagen/${req.params.jobId}`, res);
});


// ── Vision proxy — imagen base64 → bot organizador ───────────────────────────
app.post('/api/vision', async (req, res) => {
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

// ── DOCX → texto plano → Claude ──────────────────────────────────────────────
const mammoth = require('mammoth');
app.post('/api/document-docx', async (req, res) => {
  const { doc_b64, caption, filename } = req.body;
  if (!doc_b64) return res.json({ response: 'No se recibió documento.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.json({ response: 'ANTHROPIC_API_KEY no configurada.' });
  try {
    const buf = Buffer.from(doc_b64, 'base64');
    const { value: text } = await mammoth.extractRawText({ buffer: buf });
    if (!text.trim()) return res.json({ response: 'No se pudo extraer texto del documento.' });
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content:
        `${caption || 'Analiza este documento'} (${filename || 'archivo.docx'}):\n\n${text.slice(0, 30000)}`
      }]
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

// ── Document proxy — PDF base64 → Claude API directamente ───────────────────
app.post('/api/document', async (req, res) => {
  const { doc_b64, caption, filename } = req.body;
  if (!doc_b64) return res.json({ response: 'No se recibió documento.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.json({ response: 'ANTHROPIC_API_KEY no configurada en Railway.' });
  try {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
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

// ── Chat proxy — all agent chats go through here (avoids CORS) ───────────────
const CHAT_TARGETS = {
  organizador: 'https://web-production-77871.up.railway.app/organizador/chat',
  director:    'https://agencia-ai-production.up.railway.app/director/chat',
  crew:        'https://worker-production-34f9.up.railway.app/crew/chat',
  estrategia:  'https://worker-production-035f.up.railway.app/estratega/chat',
  scheduler:   'https://worker-production-aa53.up.railway.app/scheduler/chat',
  analytics:   'https://agencia-ai-analytics-production.up.railway.app/analytics/chat',
  compositor:  'https://compositorbot-production.up.railway.app/compositor/chat',
  scraper:     'https://agencia-ai-scraper-production.up.railway.app/scraper/task',
  seo:         'https://agencia-ai-seo-production.up.railway.app/seo/task',
  web:         'https://agencia-ai-web-designer-production.up.railway.app/web/chat',
  motion:      'https://web-production-d67bad.up.railway.app/motion/chat',
  compositor:  'https://compositorbot-production.up.railway.app/compositor/chat',
};

const ORG_BASE = 'https://web-production-77871.up.railway.app';

app.get('/api/mensajes/organizador', (req, res) => {
  const clientId = req.query.client || 'arranca';
  const u = new URL(`${ORG_BASE}/organizador/mensajes/${encodeURIComponent(clientId)}`);
  const opts = { hostname: u.hostname, path: u.pathname, method: 'GET', timeout: 8000 };
  const pr = https.request(opts, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => { try { res.json(JSON.parse(d)); } catch(e) { res.json({ mensajes: [] }); } });
  });
  pr.on('error', () => res.json({ mensajes: [] }));
  pr.on('timeout', () => { pr.destroy(); res.json({ mensajes: [] }); });
  pr.end();
});

// ── Claude Directo — herramientas reales en el dashboard ─────────────────────


// _FB_PAGES y _resolvePageId importados desde lib/facebook.js (línea 8)


// Test + setup: primero prueba conectividad directa al MCP, luego crea agente si aplica
app.post('/api/setup/higgsfield-agent', async (req, res) => {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'No ANTHROPIC_API_KEY' });
  if (!HF_KEY) return res.status(500).json({ error: 'No HIGGSFIELD_API_KEY' });

  const results = {};

  // Test 1: conectividad directa MCP (initialize)
  try {
    const mcpRes = await fetch('https://mcp.higgsfield.ai/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HF_KEY}` },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agencia-ai', version: '1.0' } },
        id: 1 }),
      signal: AbortSignal.timeout(10000)
    });
    const mcpText = await mcpRes.text();
    results.mcp_direct = { status: mcpRes.status, body: mcpText.slice(0, 400) };
  } catch(e) { results.mcp_direct = { error: e.message }; }

  // Test 2: prueba generate_image directo via MCP protocol
  try {
    const testUrl = await _generarImagenHiggsfieldMCP('professional financial education photo, Hispanic family, warm lighting, studio quality');
    results.mcp_generate_image = { ok: true, url: testUrl };
  } catch(e) { results.mcp_generate_image = { error: e.message }; }

  return res.json(results);
});


// Streaming directo — Claude con herramientas reales
app.post('/api/stream/organizador', async (req, res) => {
  const { mensaje, message, cliente, client, historial = [] } = req.body;
  const msg     = mensaje || message || '';
  const clientId = cliente || client || 'arranca';
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
  const tok  = t => res.write(`data: ${JSON.stringify({ token: t })}\n\n`);
  const done = () => { res.write('data: [DONE]\n\n'); res.end(); };

  if (!ANTHROPIC_KEY) { tok('❌ ANTHROPIC_API_KEY no configurada en Railway.'); return done(); }

  try {
    const sbHdr = SB_URL && SB_KEY ? { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } : null;
    const clientKey = clientId.toLowerCase().trim();
    const clientFirstWord = clientKey.split(/\s+/)[0];

    // Cargar memoria + historial persistido en paralelo
    let perfilCliente = '', persistedMsgs = [];
    if (sbHdr) {
      try {
        const [memRes, crmRes, histRes] = await Promise.all([
          fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(clientFirstWord)}*&select=datos&limit=1`,
            { headers: sbHdr }),
          fetch(`${SB_URL}/rest/v1/clientes?user_id=eq.roberto_agencia&select=data`,
            { headers: sbHdr }),
          // Cargar últimas 40 interacciones para contexto persistente
          fetch(`${SB_URL}/rest/v1/chat_history?agent_id=eq.organizador&order=created_at.desc&limit=40&select=role,content`,
            { headers: sbHdr })
        ]);
        const [memData, crmData, histData] = await Promise.all([memRes.json(), crmRes.json(), histRes.json()]);
        const memoria = memData?.[0]?.datos;
        const crm = crmData?.[0]?.data?.clientes?.[clientId] || crmData?.[0]?.data?.clientes?.[clientKey];
        const fallback = DEFAULT_PROFILES[clientFirstWord] || DEFAULT_PROFILES[clientKey];
        if (memoria || crm || fallback) {
          perfilCliente = '\n\nPERFIL DEL CLIENTE ACTIVO:\n';
          if (crm) perfilCliente += JSON.stringify(crm, null, 2).slice(0, 1500);
          if (memoria) perfilCliente += '\n\nMEMORIA OPERATIVA:\n' + JSON.stringify(memoria, null, 2).slice(0, 1500);
          if (!memoria && !crm && fallback) perfilCliente += JSON.stringify(fallback, null, 2);
        }
        // Historial persistido: solo usar si el frontend no mandó historial (sesión nueva)
        if (Array.isArray(histData) && histData.length > 0 && historial.length === 0) {
          persistedMsgs = histData.reverse(); // oldest first
        }
      } catch(_) {}
    }

    const hoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const systemPrompt = `Eres el CEO y Productor General de Agencia AI — vives en el dashboard. Roberto te da dirección desde aquí.
Hoy es ${hoy}.
Tienes herramientas REALES que ejecutan acciones reales. NUNCA finjas haber hecho algo sin usar la herramienta.
Responde SIEMPRE en español.

MEMORIA ENTRE SESIONES: Tu historial de conversación está cargado. Si ya publicaste algo antes, aparece en el historial — no digas que no recuerdas.

REGLAS DE EJECUCIÓN (sin excepción):
1. EJECUTA con la herramienta. Nunca pidas confirmación antes de actuar.
2. "ok", "sí", "dale" → ejecuta de inmediato usando el contexto del historial.
3. Dato menor faltante → asume y ejecuta. Solo pregunta si es CRÍTICO e imposible de asumir.
4. PROHIBIDO decir "no tengo acceso a internet". TIENES buscar_web.
5. PROHIBIDO inventar resultados. Si falla una herramienta → di exactamente qué falló.
6. Cuando Roberto comparta estrategia o corrija algo → llama guardar_memoria DE INMEDIATO, no al final.
7. Si Roberto sube un documento → extrae lo importante y llama guardar_memoria antes de responder.

CÓMO USAR TUS ESPECIALISTAS:
Tienes un equipo de especialistas disponible via cargar_skill(). Úsalos así:

- Antes de escribir copy o estrategia → carga psicologia_venta + sleight_of_mouth
- Antes de escribir un script o historia → carga storytelling_master + story_persuasion
- Antes de diseñar un video o commercial → carga director_cine + storyboard_bong
- Antes de describir planos o imagen → carga cinematografia + zettl_estetica + master_shots
- Antes de diseñar audio/música → carga film_scoring + cinematic_audio_composer
- Antes de diseñar una campaña de marca → carga branding_estrategia + canales_publicidad
- Para ventas o cierre → carga sales_closer_elite + sleight_of_mouth

PIPELINE DE PRODUCCIÓN (para comerciales o campañas completas):
Fase 1 ESTRATEGA: carga psicologia_venta + sleight_of_mouth + storytelling_master → produce brief de campaña
Fase 2 GUIONISTA: carga story_persuasion + video_hypnotic_selling → produce script completo
Fase 3 DIRECTOR: carga director_cine + emotional_film_director + storyboard_bong → produce shot list y dirección
Fase 4 CINEMATÓGRAFO: carga cinematografia + zettl_estetica + master_shots → produce prompts visuales profesionales
Fase 5 COMPOSITOR: carga film_scoring + cinematic_audio_composer → produce dirección musical
Fase 6 PRODUCCIÓN: genera imágenes reales con generar_y_publicar → publica en redes

Para posts simples: escríbelo tú directamente cargando psicologia_venta + sleight_of_mouth.
NUNCA copies el mensaje del usuario como texto del post — escribe copy profesional.

REGLA DE PERSONAJES (CRÍTICA — sin excepción):
En TODOS los prompts de imagen o video para Arranca Financial: el personaje DEBE ser Latino/Hispanic/Mexican-American.
Siempre incluir: "Latino man or woman, Mexican-American, Hispanic, 30s, authentic, relatable, professional"
NUNCA generes personajes que parezcan asiáticos, del sur de Asia, europeos blancos, o de stock photo genérico.
El público de Arranca es hispano — el personaje que ven en el video/imagen debe verse como ellos.

CÓMO HACER UGC VIDEOS CON SEEDANCE:
UGC = User Generated Content. No es un clip cinematic — es alguien hablando a cámara como en TikTok/Reels.
Cuando Roberto pida "UGC video" o "video para redes", el prompt de Seedance DEBE incluir:
- "talking head video, person looking directly at camera"
- "selfie-style, smartphone camera, vertical frame 9:16"
- "casual home or office background, natural lighting"
- "UGC content, authentic testimonial style, TikTok style"
- "Latino man [o woman], Mexican-American, 30s, casual clothes"
- PLUS el mensaje que da: ej. "speaking about how he improved his credit score from 520 to 720"

Ejemplo de prompt UGC correcto para Arranca:
"Talking head UGC video, Latino man in his 30s, Mexican-American, looking directly at camera, casual living room background, natural window light, selfie-style smartphone camera, vertical 9:16, authentic testimonial, speaking about improving credit score and building wealth, TikTok style, relatable and energetic, casual clothes"

NUNCA generes un prompt genérico que salga una escena cinematic o un hombre estático sonriendo.

${_CATALOGO_SKILLS}

CICLO DE LA AGENCIA POR CLIENTE:
Tú produces el contenido → se publica → genera leads → los leads llaman al agente de voz (ej: María para Arranca Financial) → María cierra → el resultado alimenta la siguiente campaña.
Cada cliente tiene su perfil, su voz de marca, sus objetivos y su agente de voz específico.

CLIENTE ACTIVO: ${clientId}
${perfilCliente ? `El perfil ya está cargado arriba — NO pidas que Roberto lo repita. Úsalo directamente.\nSi aprendes algo nuevo sobre el cliente → llama guardar_memoria de inmediato.` : `Llama leer_memoria_cliente con cliente="${clientId}" al inicio. Si el DB regresa vacío, procede con lo que sabes del contexto — NUNCA pidas que Roberto repita el perfil del cliente.`}${perfilCliente}`;

    const tools = [
      { name: 'buscar_web', description: 'Busca en internet. Úsalo para competencia, tendencias, mercados.',
        input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'fetch_url', description: 'Lee texto plano de una URL. Sin diseño visual.',
        input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
      { name: 'publicar_blotato', description: 'Publica post en Facebook del cliente via Blotato.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string' }, texto: { type: 'string' },
          media_url: { type: 'string' }, programado_iso: { type: 'string' }
        }, required: ['cliente', 'texto'] } },
      { name: 'generar_video', description: 'Genera video con Seedance (kie.ai). Úsalo cuando pidan video, animación o UGC.',
        input_schema: { type: 'object', properties: {
          prompt: { type: 'string', description: 'Descripción del video en inglés' },
          imagen_url: { type: 'string', description: 'URL de imagen base para animar (opcional)' },
          cliente: { type: 'string' }
        }, required: ['prompt'] } },
      { name: 'generar_y_publicar', description: 'Genera imagen con kie.ai y la publica en Facebook en un paso.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string' }, prompt_imagen: { type: 'string', description: 'Descripción visual (inglés recomendado)' },
          copy_post: { type: 'string', description: 'Texto del post de Facebook' }
        }, required: ['cliente', 'prompt_imagen', 'copy_post'] } },
      { name: 'leer_memoria_cliente', description: 'Lee datos del cliente desde la base de datos.',
        input_schema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
      { name: 'guardar_memoria', description: 'Guarda o actualiza datos del cliente en la base de datos. Úsalo cuando Roberto corrija algo, comparta estrategia, o cuando aprendas algo nuevo del cliente. También úsalo para corregir tus propios errores anteriores.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string', description: 'Nombre del cliente' },
          datos: { type: 'object', description: 'Objeto con los datos a guardar/actualizar. Se mezcla con la memoria existente.' }
        }, required: ['cliente', 'datos'] } },
      { name: 'cargar_skill', description: 'Carga el conocimiento de uno o varios especialistas. Úsalo ANTES de producir contenido profesional. Puedes cargar múltiples skills a la vez pasando un array en "nombres".',
        input_schema: { type: 'object', properties: {
          nombre:  { type: 'string', description: 'Nombre de una sola skill (ej: "psicologia_venta")' },
          nombres: { type: 'array', items: { type: 'string' }, description: 'Array de skills a cargar juntas (ej: ["director_cine","storyboard_bong"])' }
        } } },
    ];

    // Construir mensajes: historial persistido (sesión nueva) + historial de frontend (sesión activa)
    // El frontend ya incluye el mensaje actual en historial — no duplicar
    const frontendMsgs = historial.map(h => ({ role: h.role, content: h.content }));
    const allMsgs = persistedMsgs.length > 0
      ? [...persistedMsgs.map(h => ({ role: h.role, content: String(h.content).slice(0, 800) })), ...frontendMsgs]
      : frontendMsgs;

    // Garantizar que el último mensaje sea del user y sea el actual
    const lastMsg = allMsgs[allMsgs.length - 1];
    const messages = (lastMsg?.role === 'user' && lastMsg?.content === msg)
      ? allMsgs
      : [...allMsgs, { role: 'user', content: msg }];

    let fullResponse = '';
    let continueLoop = true;

    while (continueLoop) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system: systemPrompt, tools, messages, stream: true })
      });
      if (!claudeRes.ok) { tok(`❌ Error Claude API: ${(await claudeRes.text()).slice(0, 200)}`); return done(); }

      const reader  = claudeRes.body.getReader();
      const decoder = new TextDecoder();
      let sseBuf = '', curTool = null, toolBlocks = [], stopReason = null, iterText = '';

      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        sseBuf += decoder.decode(value, { stream: true });
        const lines = sseBuf.split('\n'); sseBuf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let evt; try { evt = JSON.parse(line.slice(6)); } catch(_) { continue; }
          if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use')
            curTool = { id: evt.content_block.id, name: evt.content_block.name, rawInput: '' };
          else if (evt.type === 'content_block_delta') {
            if (evt.delta?.type === 'text_delta') { iterText += evt.delta.text; fullResponse += evt.delta.text; tok(evt.delta.text); }
            else if (evt.delta?.type === 'input_json_delta' && curTool) curTool.rawInput += evt.delta.partial_json;
          } else if (evt.type === 'content_block_stop' && curTool) {
            try { curTool.input = JSON.parse(curTool.rawInput); } catch(_) { curTool.input = {}; }
            toolBlocks.push(curTool); curTool = null;
          } else if (evt.type === 'message_delta') stopReason = evt.delta?.stop_reason;
        }
      }

      if (stopReason === 'tool_use' && toolBlocks.length > 0) {
        const aContent = [];
        if (iterText) aContent.push({ type: 'text', text: iterText });
        for (const tb of toolBlocks) aContent.push({ type: 'tool_use', id: tb.id, name: tb.name, input: tb.input });
        messages.push({ role: 'assistant', content: aContent });
        const toolResults = [];
        for (const tb of toolBlocks) {
          tok(`\n\n🔧 *${tb.name}*...`);
          const result = await _ejecutarHerramienta(tb.name, tb.input, tok);
          toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: result });
        }
        messages.push({ role: 'user', content: toolResults });
        toolBlocks = []; iterText = '';
      } else { continueLoop = false; }
    }

    // Persistir en Supabase (best-effort)
    if (SB_URL && SB_KEY && msg && fullResponse) {
      fetch(`${SB_URL}/rest/v1/chat_history`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify([
          { agent_id: 'organizador', user_id: 'roberto', role: 'user',      content: msg,          created_at: new Date().toISOString() },
          { agent_id: 'organizador', user_id: 'roberto', role: 'assistant', content: fullResponse, created_at: new Date().toISOString() }
        ])
      }).catch(() => {});
    }
    done();
  } catch (e) { tok(`\n❌ Error interno: ${e.message}`); done(); }
});

app.post('/api/chat/:agentId', (req, res) => {
  const target = CHAT_TARGETS[req.params.agentId];
  if (!target) return res.status(404).json({ response: 'Agente no encontrado.' });
  const payload = Object.assign({}, req.body);
  if (payload.message && !payload.mensaje) payload.mensaje = payload.message;
  if (payload.client && !payload.cliente) payload.cliente = payload.client;
  if (payload.client) payload.cliente_id = payload.client;
  const body = JSON.stringify(payload);
  const u = new URL(target);
  const opts = {
    hostname: u.hostname, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    timeout: 120000,
  };
  const pr = https.request(opts, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const json = JSON.parse(d);
        // Normalize: bots may return respuesta/reply/content instead of response
        const normalized = json.response || json.respuesta || json.reply || json.message || json.content;
        if (normalized !== undefined) json.response = normalized;
        res.status(r.statusCode < 400 ? 200 : r.statusCode).json(json);
      } catch(e) {
        if (r.statusCode === 404 || r.statusCode === 405) {
          res.json({ response: 'El agente está en línea pero aún no tiene endpoint de chat. Contáctalo vía Telegram.' });
        } else {
          res.status(500).json({ response: 'Error del agente: ' + d.slice(0, 200) });
        }
      }
    });
  });
  pr.on('error', e => res.json({ response: 'Agente no disponible: ' + e.message }));
  pr.on('timeout', () => { pr.destroy(); res.json({ response: 'El agente tardó demasiado en responder. Intenta de nuevo.' }); });
  pr.write(body);
  pr.end();
});


app.get('/api/media-library', async (req, res) => {
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const ck = (req.query.cliente || 'arranca').toLowerCase().trim();
  if (!SB_URL || !SB_KEY) return res.json({ ok: false, items: [] });
  try {
    const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
    const firstWord = ck.split(/\s+/)[0];
    const r = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=datos&limit=1`, { headers: sbHdr });
    const data = await r.json();
    const media = data?.[0]?.datos?._media || [];
    res.json({ ok: true, items: [...media].reverse() });
  } catch(e) { res.json({ ok: false, items: [], error: e.message }); }
});


app.get('/gdrive/listar', async (req, res) => {
    try {
          const token = await getGoogleAccessToken();
          const folder = process.env.GDRIVE_ROOT_FOLDER || 'root';
          const tipo = req.query.tipo || 'all';
          let q = `'${folder}' in parents and trashed=false`;
          if (tipo === 'video') q += ` and mimeType contains 'video'`;
          else if (tipo === 'audio') q += ` and mimeType contains 'audio'`;
          else if (tipo === 'image') q += ` and mimeType contains 'image'`;
          const params = new URLSearchParams({ q, fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)', pageSize: '50', orderBy: 'modifiedTime desc' });
          const driveRes = await new Promise((resolve, reject) => {
                  const r = https.get(`https://www.googleapis.com/drive/v3/files?${params}`, {
                            headers: { Authorization: `Bearer ${token}` }
                  }, response => {
                            let d = '';
                            response.on('data', c => d += c);
                            response.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
                  });
                  r.on('error', reject);
          });
          res.json({ ok: true, archivos: driveRes.files || [], total: (driveRes.files || []).length });
    } catch(e) {
          console.error('GDrive error:', e.message);
          res.status(500).json({ ok: false, error: e.message });
    }
});

// ── Google Drive — carpeta de referencias ────────────────────────────────────
app.get('/gdrive/referencias', async (req, res) => {
  try {
    const token = await getGoogleAccessToken();
    const folder = process.env.GDRIVE_REF_FOLDER || process.env.GDRIVE_ROOT_FOLDER || 'root';
    const q = `'${folder}' in parents and trashed=false`;
    const params = new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink)',
      pageSize: '100',
      orderBy: 'name asc'
    });
    const driveRes = await new Promise((resolve, reject) => {
      const r = https.get(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      }, response => {
        let d = '';
        response.on('data', c => d += c);
        response.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      });
      r.on('error', reject);
    });
    res.json({ ok: true, archivos: driveRes.files || [] });
  } catch(e) {
    console.error('GDrive referencias error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── HeyGen video — proxy al crew bot ─────────────────────────────────────────
app.post('/api/crew/heygen', (req, res) => {
  proxyPost(`${CREW_URL}/generar-avatar/heygen`, req, res);
});

// ── HeyGen: listar avatares disponibles en cuenta ────────────────────────────
app.get('/api/heygen/avatares', async (req, res) => {
  const heygenKey = process.env.HEYGEN_API_KEY;
  if (!heygenKey) return res.json({ ok: false, error: 'HEYGEN_API_KEY no configurada' });
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': heygenKey, 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    const avatares = d?.data?.avatars || [];
    res.json({ ok: true, avatares });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── HeyGen: listar voces disponibles ─────────────────────────────────────────
app.get('/api/heygen/voces', async (req, res) => {
  const heygenKey = process.env.HEYGEN_API_KEY;
  if (!heygenKey) return res.json({ ok: false, error: 'HEYGEN_API_KEY no configurada' });
  try {
    const idioma = req.query.idioma || 'es';
    const r = await fetch('https://api.heygen.com/v2/voices', {
      headers: { 'X-Api-Key': heygenKey, 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    let voces = d?.data?.voices || [];
    if (idioma) voces = voces.filter(v => (v.language || '').toLowerCase().startsWith(idioma));
    res.json({ ok: true, voces });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── Portal: crear avatar HeyGen desde foto ───────────────────────────────────
app.post('/api/portal/create-avatar', async (req, res) => {
  try {
    const { image_url, user_id, avatar_name } = req.body;
    const heygenKey = process.env.HEYGEN_API_KEY;
    if (!heygenKey) return res.json({ ok: false, error: 'HEYGEN_API_KEY no configurada' });
    if (!image_url) return res.status(400).json({ ok: false, error: 'image_url requerida' });

    // 1. Crear el Photo Avatar en HeyGen
    const heyRes = await fetch('https://api.heygen.com/v2/photo_avatar', {
      method: 'POST',
      headers: {
        'X-Api-Key': heygenKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: avatar_name || 'Asistente',
        image_url,
      })
    });
    const heyData = await heyRes.json();
    if (!heyData.data?.photo_avatar_id) {
      return res.json({ ok: false, error: heyData.message || 'Error al crear avatar', raw: heyData });
    }
    const avatar_id = heyData.data.photo_avatar_id;

    // 2. Guardar en Supabase si hay user_id
    if (user_id) {
      await sbFetch(`/clientes?user_id=eq.${user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ heygen_avatar_id: avatar_id }),
        headers: { 'Prefer': 'return=minimal' }
      });
    }

    res.json({ ok: true, avatar_id });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── Portal: subir imagen a Supabase Storage para avatar ─────────────────────
app.post('/api/portal/upload-photo', async (req, res) => {
  try {
    const SUPABASE_URL  = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ ok: false, error: 'Supabase no configurado' });

    // Recibir base64 del cliente
    const { base64, filename, user_id } = req.body;
    if (!base64) return res.status(400).json({ ok: false, error: 'base64 requerido' });

    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const ext    = (filename || 'photo.jpg').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'jpg';
    const path   = `avatars/${user_id || 'unknown'}_${Date.now()}.${ext}`;

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': `image/${ext}`,
        'x-upsert': 'true',
      },
      body: buffer
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.json({ ok: false, error: err });
    }
    const public_url = `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
    res.json({ ok: true, url: public_url });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── Dev Agent — proxy de rutas ────────────────────────────────────────────────
const DEVAGENT_URL    = process.env.DEVAGENT_URL    || '';
const DEVAGENT_SECRET = process.env.DEVAGENT_SECRET || 'agencia-dev-2025';

async function devagentProxy(path, method, body, res) {
  if (!DEVAGENT_URL) return res.json({ ok: false, error: 'DEVAGENT_URL no configurado' });
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'x-devagent-secret': DEVAGENT_SECRET },
    };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${DEVAGENT_URL}${path}`, opts);
    const d = await r.json();
    res.json(d);
  } catch(e) { res.json({ ok: false, error: e.message }); }
}

// Listar features
app.get('/api/devagent/features', async (_req, res) => {
  await devagentProxy('/devagent/features', 'GET', null, res);
});

// Agregar feature
app.post('/api/devagent/features', async (req, res) => {
  const { nombre, descripcion, repo_url, prioridad, rama } = req.body;
  if (!nombre || !repo_url) return res.status(422).json({ ok: false, error: 'nombre y repo_url son requeridos' });
  await devagentProxy('/devagent/agregar', 'POST', { nombre, descripcion, repo_url, prioridad: prioridad || 5, rama: rama || 'main' }, res);
});

// Trigger manual (feature_id opcional en body)
app.post('/api/devagent/run', async (req, res) => {
  const { feature_id } = req.body || {};
  const qs = feature_id ? `?feature_id=${feature_id}` : '';
  await devagentProxy(`/devagent/run${qs}`, 'POST', null, res);
});

// Logs de ejecuciones (lee directo de Supabase)
app.get('/api/devagent/runs', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ runs: [] });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/devagent_runs?order=ts.desc&limit=60`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });
    const runs = await r.json();
    res.json({ runs: Array.isArray(runs) ? runs : [] });
  } catch(e) { res.json({ runs: [], error: e.message }); }
});

app.get('/devagent', (_req, res) => res.redirect('/'));

// ── Chat history — Supabase persistence ──────────────────────────────────────
// GET /api/chat/history?agent_id=organizador&user_id=roberto&limit=40
app.get('/api/chat/history', async (req, res) => {
  try {
    const { agent_id, user_id = 'roberto', limit = 40 } = req.query;
    let path = `/chat_history?user_id=eq.${encodeURIComponent(user_id)}&order=created_at.asc&limit=${limit}`;
    if (agent_id) path += `&agent_id=eq.${encodeURIComponent(agent_id)}`;
    const r = await sbFetch(path, { prefer: 'return=representation' });
    const rows = await r.json();
    if (!r.ok) return res.json({ ok: false, error: rows });
    res.json({ ok: true, messages: rows });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

// POST /api/chat/history — save a batch of messages
// body: { user_id, agent_id, messages: [{role, content}] }
app.post('/api/chat/history', async (req, res) => {
  try {
    const { user_id = 'roberto', agent_id, messages = [] } = req.body;
    if (!agent_id || !messages.length) return res.json({ ok: true });
    const rows = messages.map(m => ({ user_id, agent_id, role: m.role, content: m.content }));
    const r = await sbFetch('/chat_history', {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'return=minimal',
    });
    if (!r.ok) { const e = await r.text(); return res.json({ ok: false, error: e }); }
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

// DELETE /api/chat/history?agent_id=organizador&user_id=roberto — clear chat
app.delete('/api/chat/history', async (req, res) => {
  try {
    const { agent_id, user_id = 'roberto' } = req.query;
    let path = `/chat_history?user_id=eq.${encodeURIComponent(user_id)}`;
    if (agent_id) path += `&agent_id=eq.${encodeURIComponent(agent_id)}`;
    const r = await sbFetch(path, { method: 'DELETE', prefer: 'return=minimal' });
    res.json({ ok: r.ok });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
