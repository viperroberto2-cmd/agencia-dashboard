const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();

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
app.use(express.json());

// ── PWA Icons ──────────────────────────────────────
function buildIcon(size) {
  const { createCanvas } = require('canvas');
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#7c3aed');
  g.addColorStop(1, '#4f46e5');
  ctx.fillStyle = g;
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r,0); ctx.lineTo(size-r,0);
  ctx.quadraticCurveTo(size,0,size,r);
  ctx.lineTo(size,size-r);
  ctx.quadraticCurveTo(size,size,size-r,size);
  ctx.lineTo(r,size);
  ctx.quadraticCurveTo(0,size,0,size-r);
  ctx.lineTo(0,r);
  ctx.quadraticCurveTo(0,0,r,0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(size*.38)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AI', size/2, size/2 - size*.04);
  ctx.fillStyle = '#c4b5fd';
  ctx.font = `${Math.floor(size*.12)}px Arial`;
  ctx.fillText('AGENCIA', size/2, size/2 + size*.28);
  return c.toBuffer('image/png');
}

app.get('/icon-192.png', (_,res) => {
  try { res.type('image/png').set('Cache-Control','public,max-age=86400').send(buildIcon(192)); }
  catch(e) { res.status(500).end(); }
});
app.get('/icon-512.png', (_,res) => {
  try { res.type('image/png').set('Cache-Control','public,max-age=86400').send(buildIcon(512)); }
  catch(e) { res.status(500).end(); }
});
// ── End PWA Icons ───────────────────────────────────

function serveIndex(res) {
  const html = fs.readFileSync(path.join(__dirname, 'index-v2.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || '');
  console.log('Serving index with SUPABASE_URL:', html.includes('__SUPABASE_URL__') ? 'PLACEHOLDER NOT REPLACED!' : 'REPLACED OK');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
}

app.get('/', (req, res) => serveIndex(res));

app.get('/onboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'onboard.html'));
});

app.get('/v2', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'index-v2.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || '');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
});

app.post('/api/onboard-cliente', async (req, res) => {
  const data = req.body;
  const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  try {
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?user_id=eq.roberto_agencia&select=data`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }}
    ).then(r => r.json());
    const crm = existing[0]?.data || { cliente_activo: null, clientes: {} };
    crm.clientes[data.nombre] = {
      owner: data.owner, email: data.email, telefono: data.telefono,
      industria: data.industria, ciudad: data.ciudad,
      objetivos: data.objetivos, presupuesto: data.presupuesto,
      notas: data.notas, redes_sociales: data.redes,
      onboarding_completo: true,
      fecha_onboarding: new Date().toISOString(),
      fuente: 'RG Production self-onboarding'
    };
    await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
                 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: 'roberto_agencia', data: crm })
    });
    const TG = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (TG && CHAT) {
      await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT,
          text: `🎉 New client via RG Production onboarding!\n\n🏢 ${data.nombre}\n👤 ${data.owner}\n📧 ${data.email}\n📱 ${data.telefono}\n🏥 ${data.industria}\n🎯 ${(data.objetivos||[]).join(', ')}` })
      });
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/index.html', (req, res) => serveIndex(res));

// ── Listar clientes onboarded (para el dashboard de Roberto) ──────────────
app.get('/api/clientes', async (req, res) => {
  try {
    const r = await sbFetch('/clientes?user_id=eq.roberto_agencia&select=data');
    const rows = await r.json();
    const data = rows[0]?.data || {};
    const clientes = data.clientes || {};
    const lista = Object.entries(clientes).map(([nombre, info]) => ({
      nombre, email: info.email, owner: info.owner, industria: info.industria,
      ciudad: info.ciudad, telefono: info.telefono, objetivos: info.objetivos,
      presupuesto: info.presupuesto, redes_sociales: info.redes_sociales,
      onboarding_completo: info.onboarding_completo,
      fecha_onboarding: info.fecha_onboarding, notas: info.notas,
      fuente: info.fuente
    }));
    res.json({ ok: true, clientes: lista });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Client login por email — para portal del cliente ──────────────────────
app.post('/api/cliente-login', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'email requerido' });
  try {
    const r = await sbFetch('/clientes?user_id=eq.roberto_agencia&select=data');
    const rows = await r.json();
    const clientes = rows[0]?.data?.clientes || {};
    const match = Object.entries(clientes).find(
      ([, info]) => (info.email || '').toLowerCase() === email.toLowerCase()
    );
    if (!match) return res.status(404).json({ ok: false, error: 'No encontramos tu email. Verifica o contacta a tu agencia.' });
    const [nombre, info] = match;
    res.json({ ok: true, nombre, ...info });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Portal del cliente ─────────────────────────────────────────────────────
app.get('/portal', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'rg-production-client-portal.html'));
});
app.get('/client-portal', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'rg-production-client-portal.html'));
});

// ── Supabase helper (server-side, uses secret key) ───────────────────────────
async function sbFetch(path, opts = {}) {
  const url = `${process.env.SUPABASE_PROJECT_URL}/rest/v1${path}`;
  const key  = process.env.SUPABASE_SECRET_KEY;
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
app.get('/api/clientes', async (req, res) => {
  try {
    const r = await sbFetch('/clientes?select=*&order=nombre.asc');
    const data = await r.json();
    res.json({ ok: true, clientes: Array.isArray(data) ? data.filter(c => c.user_id !== 'ms_jobs_dashboard') : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/clientes/crear', async (req, res) => {
  try {
    const { nombre, industria, email, telefono, precio_producto, whatsapp_option,
            respond_io_key, whatsapp_number, inbox_channel_id,
            tiktok_token, linkedin_token, youtube_token, pinterest_token, twitter_token } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'nombre requerido' });
    const user_id = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const r = await sbFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        user_id, nombre, industria, email, telefono,
        precio_producto: precio_producto || 197,
        whatsapp_option, respond_io_key, whatsapp_number, inbox_channel_id,
        tiktok_token, linkedin_token, youtube_token, pinterest_token, twitter_token
      }),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, cliente: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.patch('/api/clientes/:user_id', async (req, res) => {
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${req.params.user_id}`, {
      method: 'PATCH',
      body: JSON.stringify(req.body),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, cliente: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── PORTAL USERS ─────────────────────────────────────────────────
app.get('/api/portal-users', async (req, res) => {
  try {
    const r = await sbFetch('/portal_users?select=*&order=created_at.desc');
    const data = await r.json();
    res.json({ ok: true, users: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/portal-users/crear', async (req, res) => {
  try {
    const { nombre, email, cliente_id, rol } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'email requerido' });
    const r = await sbFetch('/portal_users', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, cliente_id, rol: rol || 'staff', estado: 'pendiente' }),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, user: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.patch('/api/portal-users/:id', async (req, res) => {
  try {
    const r = await sbFetch(`/portal_users?id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(req.body),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, user: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.delete('/api/portal-users/:id', async (req, res) => {
  try {
    await sbFetch(`/portal_users?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── RECORDINGS ───────────────────────────────────────────────────
app.get('/api/recordings', async (req, res) => {
  try {
    const cliente = req.query.cliente ? `&cliente=eq.${req.query.cliente}` : '';
    const r = await sbFetch(`/voice_leads?select=call_sid,recording_url,agent,cliente,call_status,ts_inicio&recording_url=not.is.null${cliente}&order=ts_inicio.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

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

app.post('/api/scheduler/publicar', (req, res) => {
  proxyPost('https://worker-production-aa53.up.railway.app/scheduler/publicar', req, res);
});

// ── Lista posts de Supabase (todos o filtrados por estado) ────────────────────
app.get('/api/scheduler/posts', async (req, res) => {
  try {
    const { estado } = req.query;
    let path = '/contenidos_programados?order=fecha_publicacion.asc,hora_publicacion.asc&limit=100';
    if (estado) path += `&estado=eq.${encodeURIComponent(estado)}`;
    const r = await sbFetch(path);
    const d = await r.json();
    res.json(Array.isArray(d) ? d : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Borrar post por post_id ───────────────────────────────────────────────────
app.delete('/api/scheduler/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    await sbFetch(`/contenidos_programados?post_id=eq.${encodeURIComponent(postId)}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Programar post manual (inyecta secret server-side) ───────────────────────
app.post('/api/scheduler/post', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      secret: process.env.SCHEDULER_SECRET || 'agencia-scheduler-2025'
    };
    const r = await fetch('https://worker-production-aa53.up.railway.app/scheduler/post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    res.status(r.status).json(d);
  } catch(e) { res.status(500).json({ error: e.message }); }
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

app.post('/api/chat/:agentId', (req, res) => {
  const target = CHAT_TARGETS[req.params.agentId];
  if (!target) return res.status(404).json({ response: 'Agente no encontrado.' });
  // Send both message and mensaje so bots using either field name work
  const payload = Object.assign({}, req.body);
  if (payload.message && !payload.mensaje) payload.mensaje = payload.message;
  if (payload.client && !payload.cliente) payload.cliente = payload.client;
  const body = JSON.stringify(payload);
  const u = new URL(target);
  const opts = {
    hostname: u.hostname, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    timeout: 15000,
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

// ── Google Drive ─────────────────────────────────────────────────────
async function getGoogleAccessToken() {
    const body = JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
          grant_type: 'refresh_token'
    });
    return new Promise((resolve, reject) => {
          const req = https.request({
                  hostname: 'oauth2.googleapis.com',
                  path: '/token',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
          }, res => {
                  let d = '';
                  res.on('data', c => d += c);
                  res.on('end', () => {
                            try { resolve(JSON.parse(d).access_token); } catch(e) { reject(e); }
                  });
          });
          req.on('error', reject);
          req.write(body); req.end();
    });
}

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
