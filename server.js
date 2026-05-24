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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
