const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const chatRouter = require('./routes/chat');
const pagesRouter = require('./routes/pages');
const { requireAdmin } = require('./lib/admin-auth');

app.disable('x-powered-by');

// Emergency source-code exposure protection.
const BLOCKED_PUBLIC_PATHS = [
  /^\/server\.js$/i,
  /^\/package(?:-lock)?\.json$/i,
  /^\/railway\.json$/i,
  /^\/dockerfile$/i,
  /^\/docker-compose(?:\.[a-z0-9_-]+)?\.ya?ml$/i,
  /^\/\.env(?:\..*)?$/i,
  /^\/readme(?:\.[a-z0-9_-]+)?$/i,
  /^\/(?:routes|lib|supabase|memoria|_legacy|node_modules|\.git)(?:\/|$)/i,
  /^\/.*\.(?:bak|backup|sql|log|md|map)$/i,
];

app.use((req, res, next) => {
  const pathname = req.path || '/';

  if (BLOCKED_PUBLIC_PATHS.some((pattern) => pattern.test(pathname))) {
    return res.status(404).type('text/plain').send('Not found');
  }

  next();
});

app.use(express.static(path.join(__dirname), {
  index: false,
  dotfiles: 'deny',
  fallthrough: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Debug endpoint disabled by default in production.
if (process.env.ENABLE_DEBUG_VERSION === 'true') {
  app.get('/api/debug/version', (_req, res) => {
    res.json({
      timestamp: new Date().toISOString(),
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    });
  });
}

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
app.use('/api/portal-users', requireAdmin, portalUsersRouter);



// ── SUPERCOMPUTER (Central Brain of RG Production) ──────────────────
app.use('/api/supercomputer', require('./routes/supercomputer'));

// ── CONNECTORS (WhatsApp, Web Form, Email, Telegram) ─────────────────
app.use('/api/connectors', require('./routes/connectors'));

// ── CLIENTES ─────────────────────────────────────────────────────
app.use('/api/clientes', requireAdmin, require('./routes/clientes'));

// ── LEADS (CRM) ─────────────────────────────────────────────────
app.use('/api/leads', requireAdmin, require('./routes/leads'));
app.use('/api/tasks', requireAdmin, require('./routes/tasks'));
app.use('/api', chatRouter);
app.use('/api', require('./routes/crew'));
app.use('/api', require('./routes/utility'));
const { apiRouter: mediaApiRouter, gdriveRouter } = require('./routes/media');
app.use('/api', mediaApiRouter);
app.use('/gdrive', gdriveRouter);
app.use('/mcp', require('./routes/mcp'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
// force rebuild 1779855856
