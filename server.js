const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const chatRouter = require('./routes/chat');
const pagesRouter = require('./routes/pages');

app.use(express.static(path.join(__dirname), { index: false }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Debug endpoint to verify code version
app.get('/api/debug/version', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    commit: 'hermes-proxy enabled',
    proxy_port: 8888,
    message: 'This is the Hermes-unified dashboard code'
  });
});

// ── Pages router (HTML, PWA icons, portal, onboarding) ───────────────────
app.use('/', pagesRouter);

// ── Auth router ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));


// ── Content + Scheduler routers ──────────────────────────────────────────────
app.use('/api/content', require('./routes/content'));
app.use('/api/scheduler', require('./routes/scheduler'));


// ── Portal router ─────────────────────────────────────────────────────────
const { portalRouter, portalUsersRouter } = require('./routes/portal');
app.use('/api/portal', portalRouter);
app.use('/api/portal-users', portalUsersRouter);



// ── SUPERCOMPUTER (Central Brain of RG Production) ──────────────────
app.use('/api/supercomputer', require('./routes/supercomputer'));

// ── CONNECTORS (WhatsApp, Web Form, Email, Telegram) ─────────────────
app.use('/api/connectors', require('./routes/connectors'));

// ── CLIENTES ─────────────────────────────────────────────────────
app.use('/api/clientes', require('./routes/clientes'));

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
// force rebuild 1779855856
