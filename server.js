const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();

const { hashPassword, _sessions, crypto } = require('./lib/auth-helpers');

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

app.get('/privacy', (_,res) => res.sendFile(path.join(__dirname, 'privacy.html')));

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
  const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

// (ruta /api/clientes movida abajo — sección CLIENTES)

// ── Portal del cliente ─────────────────────────────────────────────────────
function servePortal(res) {
  const html = fs.readFileSync(path.join(__dirname, 'rg-production-client-portal.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
}
app.get('/portal', (req, res) => servePortal(res));
app.get('/client-portal', (req, res) => servePortal(res));

// ── Auth router ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// ── Facebook / Instagram OAuth (inline — mantenidas como referencia, desactivadas por el router) ──
/* MOVIDO A routes/auth.js
const FB_APP_ID     = process.env.FB_APP_ID     || '1981039516112644';
const FB_APP_SECRET = process.env.FB_APP_SECRET || '';
const SITE_URL      = process.env.SITE_URL      || 'https://web-production-3d2c.up.railway.app';
const FB_CALLBACK   = `${SITE_URL}/api/auth/facebook/callback`;
const FB_SCOPES     = 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_content_publish';

app.get('/api/auth/facebook', (req, res) => {
  const { user_id, return_to } = req.query;
  if (!user_id) return res.status(400).send('user_id requerido');
  const state = encodeURIComponent(JSON.stringify({ user_id, return_to: return_to || '' }));
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_CALLBACK)}&scope=${FB_SCOPES}&state=${state}`;
  res.redirect(url);
});

app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code, state, error } = req.query;
  let user_id = '', return_to = '';
  try {
    const parsed = JSON.parse(decodeURIComponent(state || '{}'));
    user_id = parsed.user_id || '';
    return_to = parsed.return_to || '';
  } catch { user_id = decodeURIComponent(state || ''); }
  const errorBase = return_to || `${SITE_URL}/portal`;
  if (error || !code || !user_id) return res.redirect(`${errorBase}?fb_error=cancelled`);
  try {
    // Short-lived token
    const t1 = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_CALLBACK)}&client_secret=${FB_APP_SECRET}&code=${code}`).then(r=>r.json());
    console.log('[fb-cb] t1:', t1.access_token ? 'ok('+t1.access_token.length+'chars)' : JSON.stringify(t1));
    if (!t1.access_token) return res.redirect(`${errorBase}?fb_error=token`);
    // Long-lived token exchange (60 days)
    const t2 = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${t1.access_token}`).then(r=>r.json());
    console.log('[fb-cb] t2 long-lived:', t2.access_token ? 'ok(expires_in='+t2.expires_in+')' : JSON.stringify(t2));
    if (!t2.access_token) {
      console.error('[fb-cb] Long-lived exchange failed — check FB_APP_SECRET env var');
      return res.redirect(`${errorBase}?fb_error=longtoken`);
    }
    const longToken = t2.access_token;
    // Pages — fetch with long-lived user token so page tokens are also permanent
    const pagesData = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${longToken}`).then(r=>r.json());
    console.log('[fb-cb] pages found:', pagesData.data?.length ?? 0, pagesData.error || '');
    const pages = (pagesData.data || []).map(p => ({ id: p.id, name: p.name, token: p.access_token }));
    // Instagram accounts linked to pages
    const igAccounts = [];
    for (const page of pages) {
      const igData = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.token}`).then(r=>r.json());
      if (igData.instagram_business_account?.id) {
        const igInfo = await fetch(`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=username&access_token=${page.token}`).then(r=>r.json());
        igAccounts.push({ id: igData.instagram_business_account.id, username: igInfo.username || '', page_id: page.id });
      }
    }
    // Merge into data column
    const curRows = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=data,nombre`).then(r=>r.json());
    const curData = (Array.isArray(curRows) && curRows[0]?.data) || {};
    const clientNombre = (Array.isArray(curRows) && curRows[0]?.nombre) || '';
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: { ...curData, facebook_token: longToken, facebook_pages: pages, instagram_accounts: igAccounts, facebook_connected_at: new Date().toISOString() } }),
      headers: { 'Prefer': 'return=minimal' }
    });
    // Sync token into dashboard CRM so Organizador/Crew can publish
    const pageName = pages[0]?.name || pages[0]?.id || 'conectado';
    const igUser = igAccounts[0]?.username ? '@' + igAccounts[0].username : null;
    try {
      const dashRows = await sbFetch(`/clientes?user_id=eq.dashboard&select=data`).then(r=>r.json());
      const dashData = (Array.isArray(dashRows) && dashRows[0]?.data) || { cliente_activo: null, clientes: {} };
      if (!dashData.clientes) dashData.clientes = {};
      if (!dashData.clientes[clientNombre]) dashData.clientes[clientNombre] = {};
      dashData.clientes[clientNombre].conexiones = {
        facebook_token: pages[0]?.token || longToken,
        facebook_page_id: pages[0]?.id || null,
        instagram_account_id: igAccounts[0]?.id || '',
      };
      dashData.cliente_activo = dashData.cliente_activo || clientNombre;
      await sbFetch(`/clientes?user_id=eq.dashboard`, {
        method: dashRows?.length ? 'PATCH' : 'POST',
        body: JSON.stringify(dashRows?.length ? { data: dashData } : { user_id: 'dashboard', data: dashData }),
        headers: { 'Prefer': 'return=minimal' }
      });
      console.log('[fb-cb] Dashboard CRM synced for', clientNombre);
    } catch(ce) { console.warn('[fb-cb] CRM sync error:', ce.message); }

    // Sync Facebook status into memoria_clientes so bots can read it
    try {
      const memKey = encodeURIComponent(clientNombre || user_id);
      const memoriaRows = await sbFetch(`/memoria_clientes?cliente=eq.${memKey}&select=cliente,datos`).then(r=>r.json());
      if (Array.isArray(memoriaRows) && memoriaRows.length > 0) {
        const mem = memoriaRows[0];
        const datosObj = mem.datos || {};
        const conexiones = datosObj.conexiones || {};
        conexiones.facebook_token_activo = true;
        conexiones.facebook_page_id = pages[0]?.id || null;
        conexiones.nota = 'Facebook conectado via OAuth. Token activo.';
        if (igUser) conexiones.instagram_cuenta = igUser;
        datosObj.conexiones = conexiones;
        await sbFetch(`/memoria_clientes?cliente=eq.${memKey}`, {
          method: 'PATCH',
          body: JSON.stringify({ datos: datosObj }),
          headers: { 'Prefer': 'return=minimal' }
        });
      }
    } catch(me) { console.warn('[fb-memoria-sync]', me.message); }
    const successBase = return_to || `${SITE_URL}/portal`;
    res.redirect(`${successBase}?fb_connected=1&page=${encodeURIComponent(pageName)}`);
  } catch(e) {
    console.error('[fb-callback]', e.message);
    const errBase = return_to || `${SITE_URL}/portal`;
    res.redirect(`${errBase}?fb_error=server`);
  }
});

app.get('/api/auth/facebook/disconnect', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ ok: false });
  try {
    const curRows = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=data,nombre`).then(r=>r.json());
    const curData = (Array.isArray(curRows) && curRows[0]?.data) || {};
    const clientNombre = (Array.isArray(curRows) && curRows[0]?.nombre) || '';
    const { facebook_token, facebook_pages, instagram_accounts, facebook_connected_at, ...rest } = curData;
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}`, {
      method: 'PATCH', body: JSON.stringify({ data: rest }), headers: { 'Prefer': 'return=minimal' }
    });
    // Sync disconnect into memoria_clientes
    try {
      const memKey = encodeURIComponent(clientNombre || user_id);
      const memoriaRows = await sbFetch(`/memoria_clientes?cliente=eq.${memKey}&select=cliente,datos`).then(r=>r.json());
      if (Array.isArray(memoriaRows) && memoriaRows.length > 0) {
        const mem = memoriaRows[0];
        const datosObj = mem.datos || {};
        const conexiones = datosObj.conexiones || {};
        conexiones.facebook_token_activo = false;
        conexiones.nota = 'Facebook desconectado. Conectar desde Integraciones.';
        delete conexiones.instagram_cuenta;
        datosObj.conexiones = conexiones;
        await sbFetch(`/memoria_clientes?cliente=eq.${memKey}`, {
          method: 'PATCH',
          body: JSON.stringify({ datos: datosObj }),
          headers: { 'Prefer': 'return=minimal' }
        });
      }
    } catch(me) { console.warn('[fb-memoria-disconnect]', me.message); }
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── Password Auth (replaces magic link) ───────────────────────────────────
const crypto = require('crypto');
function hashPassword(pw) {
  const salt = process.env.PW_SALT || 'rg_production_2026';
  return crypto.createHmac('sha256', salt).update(pw).digest('hex');
}

// In-memory session store — evita guardar contraseñas en el cliente.
// Tokens expiran en 8h. Se pierden al reiniciar el servidor (Railway), lo cual
// es aceptable; el usuario simplemente vuelve a hacer login.
const _sessions = new Map();

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });
  try {
    const r = await sbFetch(`/clientes?email=eq.${encodeURIComponent(email)}&select=*`);
    const rows = await r.json();
    if (!rows || rows.length === 0)
      return res.status(404).json({ ok: false, error: 'No encontramos tu cuenta. Verifica tu email.' });
    const row = rows[0];
    const stored = (row.data || {}).password_hash;
    if (!stored) return res.status(401).json({ ok: false, error: 'Esta cuenta no tiene contraseña. Usa el onboarding para configurarla.' });
    if (stored !== hashPassword(password))
      return res.status(401).json({ ok: false, error: 'Contraseña incorrecta.' });
    const _clientData = _mergeDataCol(row);
    if (_clientData.data) delete _clientData.data.password_hash;
    res.json({ ok: true, ..._clientData });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/auth/set-password', async (req, res) => {
  const { user_id, password } = req.body || {};
  if (!user_id || !password) return res.status(400).json({ ok: false, error: 'user_id y contraseña requeridos' });
  try {
    const curR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=data`);
    const curRows = await curR.json();
    const curData = (Array.isArray(curRows) && curRows[0]?.data) || {};
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: { ...curData, password_hash: hashPassword(password) } }),
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' });
  try {
    const r = await sbFetch(`/clientes?email=eq.${encodeURIComponent(email)}&select=*`);
    const rows = await r.json();
    // Siempre responder "ok" para no revelar si el email existe
    if (!rows || rows.length === 0) return res.json({ ok: true });
    const row = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora
    const curData = row.data || {};
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(row.user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: { ...curData, reset_token: token, reset_token_expires: expires } }),
    });
    const resetLink = `${SITE_URL}/portal?reset=${token}`;
    const nombre = row.nombre || email;
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      console.warn('[forgot-password] RESEND_API_KEY no configurado. Link:', resetLink);
      return res.json({ ok: true, _debug_link: resetLink });
    }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RG Production <onboarding@resend.dev>',
        to: [email],
        subject: 'Restablecer tu contraseña — RG Production',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <div style="font-size:28px;font-weight:700;margin-bottom:8px;">RG Production</div>
          <h2 style="margin:0 0 16px;">Restablece tu contraseña</h2>
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu portal. Haz clic en el botón de abajo — el enlace expira en 1 hora.</p>
          <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Restablecer contraseña →</a>
          <p style="font-size:12px;color:#6b7280;">Si no solicitaste este cambio, puedes ignorar este email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="font-size:12px;color:#9ca3af;">RG Production — Sistema de gestión de marketing</p>
        </div>`
      })
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ ok: false, error: 'Token y contraseña requeridos' });
  if (password.length < 6) return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const r = await sbFetch(`/clientes?data->>reset_token=eq.${encodeURIComponent(token)}&select=*`);
    const rows = await r.json();
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Token inválido o ya utilizado.' });
    const row = rows[0];
    const expires = (row.data || {}).reset_token_expires;
    if (!expires || new Date() > new Date(expires))
      return res.status(400).json({ ok: false, error: 'Este enlace expiró. Solicita uno nuevo.' });
    const curData = row.data || {};
    delete curData.reset_token;
    delete curData.reset_token_expires;
    curData.password_hash = hashPassword(password);
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(row.user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: curData }),
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Session tokens — alternativa segura a guardar password en el cliente ──────
app.post('/api/auth/session/create', (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ ok: false });
  const token = crypto.randomBytes(32).toString('hex');
  _sessions.set(token, { user_id, expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.json({ ok: true, token });
});

app.post('/api/auth/session/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ ok: false });
  const session = _sessions.get(token);
  if (!session || session.expires < Date.now()) {
    _sessions.delete(token);
    return res.status(401).json({ ok: false, error: 'Sesión expirada' });
  }
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(session.user_id)}&select=*`);
    const rows = await r.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return res.status(404).json({ ok: false });
    const clientData = _mergeDataCol(row);
    if (clientData.data) delete clientData.data.password_hash;
    res.json({ ok: true, ...clientData });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/auth/session/destroy', (req, res) => {
  const { token } = req.body || {};
  if (token) _sessions.delete(token);
  res.json({ ok: true });
});
END_OF_INLINE_AUTH */

// ── CONTENT QUEUE ─────────────────────────────────────────────────────────────
const { randomUUID } = require('crypto');

async function getClientData(user_id) {
  const r = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=data`);
  const rows = await r.json();
  return (Array.isArray(rows) && rows[0]?.data) || {};
}
async function patchClientData(user_id, newData) {
  await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: newData }),
    headers: { 'Prefer': 'return=minimal' }
  });
}

// POST /api/content/queue — bot adds content item to client queue
app.post('/api/content/queue', async (req, res) => {
  const { user_id, platform, text, image_url, page_id } = req.body || {};
  if (!user_id || !text) return res.status(400).json({ ok: false, error: 'user_id y text requeridos' });
  try {
    const d = await getClientData(user_id);
    const queue = Array.isArray(d.content_queue) ? d.content_queue : [];
    const requires_approval = d.configuracion?.requires_approval !== false; // default: requires approval
    const item = {
      id: randomUUID(), platform: platform || 'facebook', text, image_url: image_url || null,
      page_id: page_id || (d.facebook_pages?.[0]?.id) || null,
      status: requires_approval ? 'pending' : 'auto',
      created_at: new Date().toISOString()
    };
    queue.unshift(item);
    await patchClientData(user_id, { ...d, content_queue: queue.slice(0, 100) });
    // Auto-publish if not requires approval and token exists
    if (!requires_approval && d.facebook_pages?.length) {
      await publishToFacebook(item, d);
    }
    res.json({ ok: true, item });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// GET /api/content/queue/:user_id — get queue for portal/dashboard
app.get('/api/content/queue/:user_id', async (req, res) => {
  try {
    const d = await getClientData(req.params.user_id);
    res.json({ ok: true, queue: d.content_queue || [], requires_approval: d.configuracion?.requires_approval !== false });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// POST /api/content/approve/:user_id/:item_id — client approves, auto-publishes
app.post('/api/content/approve/:user_id/:item_id', async (req, res) => {
  try {
    const d = await getClientData(req.params.user_id);
    const queue = Array.isArray(d.content_queue) ? d.content_queue : [];
    const item  = queue.find(i => i.id === req.params.item_id);
    if (!item) return res.status(404).json({ ok: false, error: 'Item no encontrado' });
    item.status = 'approved';
    // Try to publish
    const result = await publishToFacebook(item, d);
    if (result.ok) { item.status = 'published'; item.published_at = new Date().toISOString(); item.post_id = result.post_id; }
    await patchClientData(req.params.user_id, { ...d, content_queue: queue });
    res.json({ ok: true, published: result.ok, item });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// POST /api/content/reject/:user_id/:item_id
app.post('/api/content/reject/:user_id/:item_id', async (req, res) => {
  const { reason } = req.body || {};
  try {
    const d = await getClientData(req.params.user_id);
    const queue = Array.isArray(d.content_queue) ? d.content_queue : [];
    const item  = queue.find(i => i.id === req.params.item_id);
    if (!item) return res.status(404).json({ ok: false, error: 'Item no encontrado' });
    item.status = 'rejected'; item.reject_reason = reason || '';
    await patchClientData(req.params.user_id, { ...d, content_queue: queue });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

async function publishToFacebook(item, clientData) {
  const pages = clientData.facebook_pages || [];
  let page = pages.find(p => p.id === item.page_id) || pages[0];
  // Fall back to global FB_USER_TOKEN + stored fb_page_id (manual token setup)
  if (!page?.token && clientData.fb_page_id && process.env.FB_USER_TOKEN) {
    page = { id: clientData.fb_page_id, token: process.env.FB_USER_TOKEN };
  }
  if (!page?.token) return { ok: false, error: 'No hay página de Facebook conectada' };
  try {
    const endpoint = item.platform === 'instagram' && clientData.instagram_accounts?.length
      ? `https://graph.facebook.com/v19.0/${clientData.instagram_accounts[0].id}/media`
      : `https://graph.facebook.com/v19.0/${page.id}/feed`;
    const body = item.platform === 'instagram'
      ? { caption: item.text, ...(item.image_url ? { image_url: item.image_url, media_type: 'IMAGE' } : {}), access_token: page.token }
      : { message: item.text, ...(item.image_url ? { link: item.image_url } : {}), access_token: page.token };
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (data.error) return { ok: false, error: data.error.message };
    // For Instagram, need a second call to publish
    if (item.platform === 'instagram' && data.id) {
      const pub = await fetch(`https://graph.facebook.com/v19.0/${clientData.instagram_accounts[0].id}/media_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: data.id, access_token: page.token })
      });
      const pubData = await pub.json();
      return { ok: !pubData.error, post_id: pubData.id };
    }
    return { ok: true, post_id: data.id };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ── Portal cliente — datos reales filtrados por user_id ──────────────────────
app.get('/api/portal/leads', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  try {
    const r = await sbFetch(`/voice_leads?cliente=eq.${user_id}&select=*&order=created_at.desc&limit=100`);
    const data = await r.json();
    const rows = Array.isArray(data) ? data : [];
    const cols = { new: [], contacted: [], interested: [], closed: [] };
    rows.forEach(l => {
      const col = ['new','contacted','interested','closed'].includes(l.status) ? l.status : 'new';
      cols[col].push({ id: l.id, name: l.nombre || l.from_number || 'Lead',
        phone: l.from_number || '', source: l.fuente || 'Llamada',
        meta: l.created_at ? new Date(l.created_at).toLocaleDateString('es-MX') : '',
        notes: l.notas || '', status: col });
    });
    res.json({ ok: true, leads: cols, total: rows.length });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/portal/recordings', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  try {
    const r = await sbFetch(`/voice_leads?cliente=eq.${user_id}&recording_url=not.is.null&select=call_sid,recording_url,agent,call_status,created_at&order=created_at.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── PORTAL ONBOARDING NUEVO CLIENTE (sin auth previa) ────────────
app.post('/api/portal/onboarding-new', async (req, res) => {
  const { nombre, industria, email, telefono, ciudad,
          whatsapp, asistente, idioma, tono, horario, wa_status,
          facebook, instagram, youtube, tiktok, website, google_business,
          goals, presupuesto, notas, password,
          q_descripcion, q_cliente_ideal, q_servicio, q_precio,
          q_diferenciador, q_resultados, q_objecion, q_proceso_venta } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'email requerido' });
  try {
    const newData = {
      ...(password ? { password_hash: hashPassword(password) } : {}),
      ciudad: ciudad || null,
      redes_sociales: { facebook: facebook||null, instagram: instagram||null, youtube: youtube||null, tiktok: tiktok||null, website: website||null, google_business: google_business||null },
      configuracion: {
        asistente_nombre: asistente || null,
        idioma: idioma || 'bilingue',
        tono: tono || 'calido',
        horario: horario || '24/7',
        wa_status: wa_status || 'nuevo',
        goals: goals || [],
        presupuesto: presupuesto || '',
        notas: notas || ''
      },
      cuestionario: {
        descripcion:   q_descripcion   || '',
        cliente_ideal: q_cliente_ideal || '',
        servicio:      q_servicio      || '',
        precio:        q_precio        || '',
        diferenciador: q_diferenciador || '',
        resultados:    q_resultados    || '',
        objecion:      q_objecion      || '',
        proceso_venta: q_proceso_venta || ''
      }
    };
    // Check if email already exists → update instead of creating duplicate
    const existingR = await sbFetch(`/clientes?email=eq.${encodeURIComponent(email)}&select=user_id,data`);
    const existingRows = await existingR.json();
    if (Array.isArray(existingRows) && existingRows[0]) {
      const existing = existingRows[0];
      const mergedData = { ...(existing.data || {}), ...newData };
      const mergedData2 = { ...mergedData, onboarding_completado: true };
      const update = {
        nombre: nombre || email,
        industria: industria || null,
        telefono: telefono || null,
        whatsapp_number: whatsapp || null,
        data: mergedData2,
      };
      await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(existing.user_id)}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
      });
      // Fetch updated row
      const updR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(existing.user_id)}&select=*`);
      const updRows = await updR.json();
      const row = (Array.isArray(updRows) && updRows[0]) || { user_id: existing.user_id, email };
      return res.json({ ok: true, user_id: row.user_id, cliente: _mergeDataCol(row) });
    }
    // New client
    const user_id = (nombre || email).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_@.]/g, '').slice(0, 40) + '_' + Date.now().toString(36);
    const record = {
      user_id,
      nombre: nombre || email,
      industria: industria || null,
      email,
      telefono: telefono || null,
      whatsapp_number: whatsapp || null,
      data: { ...newData, onboarding_completado: true },
    };
    const r = await sbFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify(record),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    if (Array.isArray(data) && data[0]) {
      res.json({ ok: true, user_id: data[0].user_id, cliente: _mergeDataCol(data[0]) });
    } else {
      res.json({ ok: false, error: data.message || 'No se pudo crear el cliente', raw: data });
    }
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── PORTAL ONBOARDING SUBMIT ─────────────────────────────────────
app.post('/api/portal/onboarding-submit', async (req, res) => {
  const { user_id, whatsapp, asistente, idioma, tono, horario, wa_status,
          facebook, instagram, youtube, tiktok, website, google_business,
          goals, presupuesto, notas, ciudad,
          negocio, nombre, email, telefono } = req.body;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  try {
    // Fetch current data column to merge (ciudad, redes_sociales, configuracion live in data JSONB)
    const curR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=data`);
    const curRows = await curR.json();
    const curData = (Array.isArray(curRows) && curRows[0]?.data) || {};

    const newData = {
      ...curData,
      ciudad: ciudad || curData.ciudad || null,
      redes_sociales: {
        ...(curData.redes_sociales || {}),
        facebook: facebook !== undefined ? (facebook || null) : (curData.redes_sociales?.facebook || null),
        instagram: instagram !== undefined ? (instagram || null) : (curData.redes_sociales?.instagram || null),
        youtube: youtube !== undefined ? (youtube || null) : (curData.redes_sociales?.youtube || null),
        tiktok: tiktok !== undefined ? (tiktok || null) : (curData.redes_sociales?.tiktok || null),
        website: website !== undefined ? (website || null) : (curData.redes_sociales?.website || null),
        google_business: google_business !== undefined ? (google_business || null) : (curData.redes_sociales?.google_business || null)
      },
      configuracion: {
        ...(curData.configuracion || {}),
        asistente_nombre: asistente || curData.configuracion?.asistente_nombre || null,
        idioma: idioma || curData.configuracion?.idioma || 'bilingue',
        tono: tono || curData.configuracion?.tono || 'calido',
        horario: horario || curData.configuracion?.horario || '24/7',
        wa_status: wa_status || curData.configuracion?.wa_status || 'activo',
        goals: goals || curData.configuracion?.goals || [],
        presupuesto: presupuesto || curData.configuracion?.presupuesto || '',
        notas: notas || curData.configuracion?.notas || ''
      }
    };

    const update = {
      whatsapp_number: whatsapp || null,
      data: { ...newData, onboarding_completado: true },
    };
    if (email)    update.email    = email;
    if (telefono) update.telefono = telefono;
    if (negocio || nombre) update.nombre = negocio || nombre;
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
    // Return updated client so portal can sync
    const updR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=*`);
    const updRows = await updR.json();
    const row = (Array.isArray(updRows) && updRows[0]) || { user_id };
    res.json({ ok: true, cliente: _mergeDataCol(row) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/portal/stats', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  try {
    const r = await sbFetch(`/voice_leads?cliente=eq.${user_id}&select=status,created_at`);
    const raw = await r.json();
    const data = Array.isArray(raw) ? raw : [];
    const total = data.length;
    const closed = data.filter(l => l.status === 'closed').length;
    res.json({ ok: true, total_leads: total, cerrados: closed, revenue: closed * 197 });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

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

/* MOVIDO A routes/clientes.js
app.get('/api/clientes', async (req, res) => {
  try {
    const r = await sbFetch('/clientes?select=*&order=nombre.asc');
    const data = await r.json();
    const rows = Array.isArray(data) ? data.filter(c => c.user_id !== 'ms_jobs_dashboard' && c.user_id !== 'dashboard' && c.nombre) : [];
    res.json({ ok: true, clientes: rows.map(_mergeDataCol) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/clientes/:user_id', async (req, res) => {
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(req.params.user_id)}&select=*`);
    const data = await r.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return res.json({ ok: false, error: 'Cliente no encontrado' });
    res.json({ ok: true, cliente: _mergeDataCol(row) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/clientes/crear', async (req, res) => {
  try {
    const { nombre, industria, email, telefono, precio_producto, whatsapp_option,
            respond_io_key, whatsapp_number, inbox_channel_id,
            fb_page_id, ig_account_id, youtube_refresh_token,
            tiktok_token, linkedin_token, pinterest_token, twitter_token,
            heygen_avatar_id, heygen_voice_id, integrations,
            objetivo, presupuesto_ads, mensaje_principal, agents } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'nombre requerido' });
    const user_id = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const clienteData = {
      ...(agents              ? { agentes_asignados: agents }    : {}),
      ...(heygen_avatar_id    ? { heygen_avatar_id }             : {}),
      ...(heygen_voice_id     ? { heygen_voice_id }              : {}),
      ...(whatsapp_option     ? { whatsapp_option }              : {}),
      ...(respond_io_key      ? { respond_io_key }               : {}),
      ...(whatsapp_number     ? { whatsapp_number }              : {}),
      ...(inbox_channel_id    ? { inbox_channel_id }             : {}),
      ...(integrations        ? { integrations }                 : {}),
      ...(objetivo            ? { objetivo }                     : {}),
      ...(presupuesto_ads     ? { presupuesto_ads }              : {}),
      ...(mensaje_principal   ? { mensaje_principal }            : {}),
      ...(fb_page_id          ? { fb_page_id }                   : {}),
      ...(ig_account_id       ? { ig_account_id }                : {}),
      ...(youtube_refresh_token ? { youtube_refresh_token }      : {}),
      ...(tiktok_token        ? { tiktok_token }                 : {}),
      ...(linkedin_token      ? { linkedin_token }               : {}),
      ...(pinterest_token     ? { pinterest_token }              : {}),
      ...(twitter_token       ? { twitter_token }                : {}),
    };
    const r = await sbFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        user_id, nombre, industria, email, telefono,
        precio_producto: precio_producto || 197,
        data: Object.keys(clienteData).length ? clienteData : null
      }),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    if (!r.ok) return res.json({ ok: false, error: data?.message || data?.error || `Supabase error ${r.status}` });
    res.json({ ok: true, cliente: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.patch('/api/clientes/:user_id', async (req, res) => {
  try {
    const { redes_sociales, configuracion, ciudad, cuestionario, facebook_pages,
            ig_account_id, youtube_refresh_token, ...directFields } = req.body;
    if (redes_sociales || configuracion || ciudad || cuestionario || facebook_pages !== undefined ||
        ig_account_id !== undefined || youtube_refresh_token !== undefined) {
      const curR = await sbFetch(`/clientes?user_id=eq.${req.params.user_id}&select=data`);
      const curRows = await curR.json();
      const curData = (Array.isArray(curRows) && curRows[0]?.data) || {};
      directFields.data = {
        ...curData,
        ...(ciudad        ? { ciudad } : {}),
        ...(redes_sociales? { redes_sociales: { ...(curData.redes_sociales||{}), ...redes_sociales } } : {}),
        ...(configuracion ? { configuracion:  { ...(curData.configuracion||{}),  ...configuracion  } } : {}),
        ...(cuestionario  ? { cuestionario:   { ...(curData.cuestionario||{}),   ...cuestionario   } } : {}),
        ...(facebook_pages !== undefined   ? { facebook_pages }      : {}),
        ...(ig_account_id !== undefined    ? { ig_account_id }       : {}),
        ...(youtube_refresh_token !== undefined ? { youtube_refresh_token } : {})
      };
    }
    const r = await sbFetch(`/clientes?user_id=eq.${req.params.user_id}`, {
      method: 'PATCH',
      body: JSON.stringify(directFields),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, cliente: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.delete('/api/clientes/:user_id', async (req, res) => {
  try {
    await sbFetch(`/clientes?user_id=eq.${req.params.user_id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});
END_CLIENTES */

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
    const r = await sbFetch(`/voice_leads?select=call_sid,recording_url,agent,cliente,call_status,ts_inicio,telefono,duration,transcript,created_at&recording_url=not.is.null${cliente}&order=ts_inicio.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── LEADS (CRM) ─────────────────────────────────────────────────
app.use('/api/leads', require('./routes/leads'));

/* MOVIDO A routes/leads.js
app.get('/api/leads', async (req, res) => {
  try {
    const cliente = req.query.cliente ? `&cliente=eq.${req.query.cliente}` : '';
    const r = await sbFetch(`/voice_leads?select=*&order=created_at.desc&limit=200${cliente}`);
    const rows = await r.json();
    const data = Array.isArray(rows) ? rows : [];
    const cols = { new: [], contacted: [], interested: [], closed: [] };
    data.forEach(l => {
      const col = ['new','contacted','interested','closed'].includes(l.status) ? l.status : 'new';
      cols[col].push({
        id: l.id, name: l.nombre || l.from_number || 'Lead',
        phone: l.from_number || l.telefono || '',
        email: l.email || '', source: l.fuente || 'Llamada',
        meta: l.created_at ? new Date(l.created_at).toLocaleDateString('es-MX') : '',
        notes: l.notas || '', cliente: l.cliente || 'arranca',
        recording_url: l.recording_url || null
      });
    });
    res.json({ ok: true, leads: cols, total: data.length });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { nombre, telefono, email, fuente, notas, status, cliente } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'nombre requerido' });
    const r = await sbFetch('/voice_leads', {
      method: 'POST',
      body: JSON.stringify({
        nombre, telefono: telefono || null, email: email || null,
        fuente: fuente || 'Manual', notas: notas || null,
        status: status || 'new',
        cliente: cliente || null,
        call_status: 'manual',
        created_at: new Date().toISOString()
      }),
      headers: { 'Prefer': 'return=representation' }
    });
    const data = await r.json();
    res.json({ ok: true, lead: Array.isArray(data) ? data[0] : data });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/leads/import', async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || !leads.length) return res.status(400).json({ ok: false, error: 'No leads' });
    const valid = leads.filter(l => l.nombre).map(l => ({
      nombre: l.nombre, telefono: l.telefono || null, email: l.email || null,
      fuente: l.fuente || 'Excel', notas: l.notas || null,
      status: l.status || 'new', cliente: l.cliente || null,
      call_status: 'manual', created_at: new Date().toISOString()
    }));
    if (!valid.length) return res.status(400).json({ ok: false, error: 'Sin leads válidos' });
    const r = await sbFetch('/voice_leads', {
      method: 'POST', body: JSON.stringify(valid),
      headers: { 'Prefer': 'return=minimal' }
    });
    if (!r.ok) { const t = await r.text(); return res.status(500).json({ ok: false, error: t }); }
    res.json({ ok: true, imported: valid.length });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.patch('/api/leads/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    await sbFetch(`/voice_leads?id=eq.${req.params.id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
      headers: { 'Prefer': 'return=minimal' }
    });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await sbFetch(`/voice_leads?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});
END_LEADS */

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

// Cargador de skills desde memoria/ (igual que _cargar_skills en cerebro.py)
const _MEMORIA_DIR = path.join(__dirname, 'memoria');
function _cargarSkill(nombre) {
  try {
    const ruta = path.join(_MEMORIA_DIR, `${nombre}.json`);
    if (!fs.existsSync(ruta)) return `[Skill '${nombre}' no encontrada]`;
    const data = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const contenido = typeof data === 'object'
      ? (data.contenido || data.content || data.conocimiento || JSON.stringify(data, null, 2))
      : String(data);
    return `[${nombre.toUpperCase().replace(/_/g,' ')}]\n${contenido}`;
  } catch(e) { return `[Error cargando skill '${nombre}': ${e.message}]`; }
}

// Catálogo de skills disponibles (lo que Claude ve en el system prompt)
const _CATALOGO_SKILLS = `EQUIPO DE ESPECIALISTAS DISPONIBLE (usa cargar_skill para activar cada uno):

ESTRATEGA — psicología humana, ventas, storytelling, persuasión:
  • psicologia_venta — diagnóstico del comprador, manejo de objeciones, cierre
  • sleight_of_mouth — 14 patrones de reencuadre para transformar objeciones
  • storytelling_master — estructura narrativa profesional, arcos emocionales
  • story_persuasion — persuasión a través de historia, conexión emocional
  • video_hypnotic_selling — venta hipnótica en video, lenguaje del inconsciente
  • storytelling_series — storytelling en serie, episodios, continuidad

DIRECTOR — dirección de cine, actores, escenas:
  • director_cine — dirección de actores, mise en scène, lenguaje cinematográfico
  • director_maestro — dirección avanzada, visión artística, toma de decisiones
  • emotional_film_director — dirección emocional, performance, autenticidad
  • storyboard_bong — storyboard estilo Bong Joon-ho, planificación visual

CINEMATÓGRAFO — imagen, luz, composición:
  • cinematografia — reglas de composición, movimientos de cámara, planos
  • master_shots — planos maestros, cobertura de escena, continuidad
  • zettl_estetica — estética visual de Zettl, color, forma, espacio
  • millerson_iluminacion — iluminación profesional de estudio y locación
  • visual_storytelling_arun — narrativa visual, metáforas visuales

COMPOSITOR — música, audio, psicoacústica:
  • film_scoring — composición musical para cine, emoción y ritmo
  • cinematic_audio_composer — audio cinematográfico, leitmotifs, mezcla
  • music_video_director — dirección de videos musicales, sincronización

ESTRATEGIA DE MARCA Y MARKETING:
  • branding_estrategia — identidad de marca, posicionamiento, diferenciación
  • canales_publicidad — selección de canales, mix de medios, presupuesto
  • diseno_publicitario — diseño de ads, jerarquía visual, CTA
  • analytics_roas — métricas, ROAS, optimización de campañas
  • web_design_conversion — landing pages, CRO, UX de conversión

VENTAS AVANZADAS:
  • sales_closer_elite — técnicas de cierre, manejo de presión, negociación

FORMATOS DE VIDEO:
  • ms_ugc — User Generated Content, autenticidad, testimoniales
  • ms_tutorial — tutoriales, educación, paso a paso
  • ms_tvspot — spots de TV/redes, 15-30-60 segundos
  • ms_hyper_motion — hiper-motion, acción, energía
  • ms_review — reviews de productos, credibilidad
  • ms_wildcard — formato experimental, creatividad libre`;

const _FB_PAGES = {
  'arranca':              '1037617602773646',
  'arranca financial':    '1037617602773646',
  'red de salud hispana': '1069131969608041',
  'salud hispana':        '1069131969608041',
  'horizon wound care':   '441343592402827',
  'rg photo':             '268664976335314',
  'rg photo & video':     '268664976335314',
};

function _resolvePageId(cliente) {
  const ck = (cliente || 'arranca').toLowerCase().trim();
  if (_FB_PAGES[ck]) return _FB_PAGES[ck];
  // partial match — "arranca financial inc" → "arranca financial"
  const key = Object.keys(_FB_PAGES).find(k => ck.includes(k) || k.includes(ck));
  return key ? _FB_PAGES[key] : null;
}

// ── Higgsfield directo via MCP protocol (Railway → mcp.higgsfield.ai, sin 522) ──
async function _generarImagenHiggsfieldMCP(prompt) {
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  if (!HF_KEY) throw new Error('HIGGSFIELD_API_KEY no configurada');
  const MCP_URL = 'https://mcp.higgsfield.ai/mcp';
  const hdrs = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': `Bearer ${HF_KEY}` };

  // 1. Initialize session
  const initRes = await fetch(MCP_URL, {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agencia-ai', version: '1.0' } }, id: 1 }),
    signal: AbortSignal.timeout(15000)
  });
  const sessionId = initRes.headers.get('Mcp-Session-Id');
  const initData = await _parseMcpResponse(initRes);
  if (initData.error) throw new Error(`MCP init: ${initData.error.message}`);

  const sh = sessionId ? { ...hdrs, 'Mcp-Session-Id': sessionId } : hdrs;

  // 2. Notify initialized
  await fetch(MCP_URL, { method: 'POST', headers: sh,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
    signal: AbortSignal.timeout(5000) }).catch(() => {});

  // 3. Call generate_image
  const callRes = await fetch(MCP_URL, {
    method: 'POST', headers: sh,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call',
      params: { name: 'generate_image', arguments: { prompt, steps: 30, task: 'text-to-image' } }, id: 2 }),
    signal: AbortSignal.timeout(180000)
  });
  const callData = await _parseMcpResponse(callRes);
  if (callData.error) throw new Error(`MCP generate: ${callData.error.message}`);

  // Extract URL from result
  const content = callData.result?.content || [];
  for (const item of content) {
    if (item.type === 'text') {
      const m = item.text.match(/https?:\/\/[^\s"'<>]+/);
      if (m) return m[0];
    }
    if (item.type === 'image' && item.url) return item.url;
  }
  const raw = JSON.stringify(callData.result || callData);
  const m = raw.match(/https?:\/\/[^\s"'\\]+/);
  if (m) return m[0];
  throw new Error(`Sin URL en MCP: ${raw.slice(0, 400)}`);
}

async function _parseMcpResponse(res) {
  const ct = res.headers.get('Content-Type') || '';
  const text = await res.text();
  if (ct.includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        try { const d = JSON.parse(line.slice(6)); if (d.result || d.error) return d; } catch(_) {}
      }
    }
    return {};
  }
  try { return JSON.parse(text); } catch(_) { return { raw: text }; }
}

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

async function _ejecutarHerramienta(name, input, onProgress = null) {
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const BL_KEY = process.env.BLOTATO_API_KEY;
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  try {
    if (name === 'buscar_web') {
      const q = encodeURIComponent(input.query || '');
      const r = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
        { headers: { 'User-Agent': 'AgenciaAI/1.0' }, signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      const parts = [];
      if (d.Abstract) parts.push(`Resumen: ${d.Abstract}`);
      (d.RelatedTopics || []).slice(0, 6).forEach(t => { if (t.Text) parts.push(`• ${t.Text}`); });
      return parts.length ? parts.join('\n') : 'Sin resultados directos. Intenta términos más específicos.';
    }
    if (name === 'fetch_url') {
      const r = await fetch(input.url,
        { headers: { 'User-Agent': 'Mozilla/5.0 AgenciaAI/1.0' }, signal: AbortSignal.timeout(15000) });
      const html = await r.text();
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim().slice(0, 3000) || 'No se pudo extraer contenido.';
    }
    if (name === 'publicar_blotato') {
      if (!BL_KEY) return '❌ BLOTATO_API_KEY no configurada en Railway (Dashboard service).';
      const pageId = _resolvePageId(input.cliente);
      if (!pageId) return `❌ Cliente '${input.cliente}' sin página Facebook. Disponibles: ${Object.keys(_FB_PAGES).join(', ')}`;
      const postBody = { post: { accountId: '32320', target: { targetType: 'facebook', pageId },
        content: { text: input.texto, platform: 'facebook', mediaUrls: input.media_url ? [input.media_url] : [] } } };
      if (input.programado_iso) postBody.post.scheduledAt = input.programado_iso;
      const r = await fetch('https://backend.blotato.com/v2/posts',
        { method: 'POST', headers: { 'blotato-api-key': BL_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(postBody) });
      const d = await r.json();
      if (!r.ok) return `❌ Blotato error: ${JSON.stringify(d).slice(0, 200)}`;
      return `✅ Publicado en Facebook (${input.cliente}). ID: ${d.postSubmissionId || d.id || '✓'}${input.media_url ? '\nImagen: ' + input.media_url : ''}`;
    }
    if (name === 'generar_video') {
      const KIE_KEY = process.env.KIE_API_KEY;
      if (!KIE_KEY) return '❌ KIE_API_KEY no configurada en Railway (Dashboard service).';
      // Forzar estilo UGC para Arranca si el prompt no lo especifica ya
      let videoPrompt = input.prompt || '';
      const isUGC = input.estilo === 'ugc' || videoPrompt.toLowerCase().includes('ugc') || videoPrompt.toLowerCase().includes('talking head');
      const isArranca = (input.cliente || 'arranca').toLowerCase().includes('arranca');
      if (!isUGC && isArranca) {
        videoPrompt = `Talking head UGC video, Latino man in his 30s, Mexican-American, looking directly at camera, casual home background, natural window light, selfie-style smartphone vertical 9:16, authentic TikTok testimonial style, ${videoPrompt}, energetic and relatable, casual clothes`;
      } else if (!isUGC && videoPrompt && !videoPrompt.toLowerCase().includes('latino') && !videoPrompt.toLowerCase().includes('hispanic')) {
        videoPrompt = `Latino man in his 30s, Mexican-American, ${videoPrompt}`;
      }
      const body = { model: 'bytedance/seedance-2-fast', input: { prompt: videoPrompt, resolution: '720p', duration: 5 } };
      if (input.imagen_url) body.input.image_url = input.imagen_url;
      const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });
      if (!createRes.ok) return `❌ kie.ai video error ${createRes.status}: ${await createRes.text()}`;
      const createData = await createRes.json();
      if (createData.code !== 200) return `❌ kie.ai: ${createData.msg || JSON.stringify(createData)}`;
      const taskId = createData.data?.taskId;
      if (!taskId) return `❌ kie.ai sin taskId: ${JSON.stringify(createData)}`;
      // Poll hasta completar — seedance-2-fast ~4 min, max 9 min
      if (onProgress) onProgress('\n⏳ Video en cola... (puede tardar 4-6 min)');
      for (let i = 0; i < 54; i++) {
        await new Promise(ok => setTimeout(ok, 10000));
        if (onProgress && i % 3 === 0) onProgress(`\n⏳ Generando video... ${Math.round((i + 1) * 10 / 60)} min`);
        const poll = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
          { headers: { 'Authorization': `Bearer ${KIE_KEY}` } });
        const pd = await poll.json();
        const state = pd.data?.state;
        if (state === 'success') {
          let videoUrl = null;
          try { videoUrl = JSON.parse(pd.data.resultJson).resultUrls?.[0]; } catch(_) {}
          if (!videoUrl) return `❌ Video generado pero sin URL. Raw: ${JSON.stringify(pd.data).slice(0,300)}`;
          await _saveToMediaLibrary(videoUrl, `Video ${new Date().toLocaleDateString('es-MX')} — ${(input.prompt||'').slice(0,40)}`, 'video', input.cliente || 'arranca');
          return `✅ Video generado con Seedance.\nURL: ${videoUrl}\n\nGuardado en Drive. Para publicar en Facebook usa publicar_blotato con esta URL como media_url.`;
        }
        if (state === 'fail') return `❌ Seedance falló: ${pd.data?.failMsg || 'error desconocido'}`;
      }
      return '❌ Timeout: Seedance tardó más de 9 minutos. Intenta de nuevo o usa generar_y_publicar para imagen primero.';
    }
    if (name === 'generar_y_publicar') {
      if (!BL_KEY)  return '❌ BLOTATO_API_KEY no configurada en Railway (Dashboard service).';
      let imageUrl = null;
      let imageSource = '';
      // Forzar personaje latino si el prompt no lo especifica
      const isArrancaImg = (input.cliente || 'arranca').toLowerCase().includes('arranca');
      if (isArrancaImg && input.prompt_imagen && !input.prompt_imagen.toLowerCase().includes('latino') && !input.prompt_imagen.toLowerCase().includes('hispanic')) {
        input.prompt_imagen = `Latino person, Mexican-American, 30s, authentic, relatable, professional — ${input.prompt_imagen}`;
      }

      // Intento 1: Higgsfield directo via MCP (usa suscripción anual, sin 522)
      if (process.env.HIGGSFIELD_API_KEY) {
        try {
          imageUrl = await _generarImagenHiggsfieldMCP(input.prompt_imagen);
          imageSource = 'Higgsfield';
          console.log('[generar_y_publicar] Higgsfield MCP OK:', imageUrl);
        } catch(e) {
          console.error('[generar_y_publicar] Higgsfield MCP falló:', e.message);
          imageUrl = null;
        }
      }

      // Intento 2: kie.ai Nano Banana 2 (fallback)
      if (!imageUrl) {
        const KIE_KEY = process.env.KIE_API_KEY;
        if (!KIE_KEY) return '❌ Sin imagen: HIGGSFIELD_AGENT_ID no configurado y KIE_API_KEY tampoco está.';
        const kieRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nano-banana-2', input: { prompt: input.prompt_imagen, aspect_ratio: '16:9', resolution: '1K' } }),
          signal: AbortSignal.timeout(30000)
        });
        if (!kieRes.ok) return `❌ kie.ai error ${kieRes.status}: ${await kieRes.text()}`;
        const kieData = await kieRes.json();
        if (kieData.code !== 200) return `❌ kie.ai: ${kieData.msg || JSON.stringify(kieData)}`;
        const taskId = kieData.data?.taskId;
        if (!taskId) return `❌ kie.ai sin taskId: ${JSON.stringify(kieData)}`;
        for (let i = 0; i < 30; i++) {
          await new Promise(ok => setTimeout(ok, 5000));
          const poll = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
            { headers: { 'Authorization': `Bearer ${KIE_KEY}` } });
          const pd = await poll.json();
          const state = pd.data?.state;
          if (state === 'success') {
            try { imageUrl = JSON.parse(pd.data.resultJson).resultUrls?.[0]; } catch(_) {}
            break;
          }
          if (state === 'fail') return `❌ kie.ai falló: ${pd.data?.failMsg || 'error desconocido'}`;
        }
        if (!imageUrl) return '❌ Timeout: kie.ai tardó más de 150 segundos.';
        imageSource = 'kie.ai';
      }

      const pageId = _resolvePageId(input.cliente);
      console.log('[generar_y_publicar] cliente:', input.cliente, '→ pageId:', pageId, '→ imageUrl:', imageUrl?.slice(0,80));
      if (!pageId) return `✅ Imagen (${imageSource}): ${imageUrl}\n❌ Cliente '${input.cliente}' no reconocido. Usa exactamente: arranca, arranca financial, red de salud hispana, horizon wound care, rg photo`;
      const pubRes = await fetch('https://backend.blotato.com/v2/posts',
        { method: 'POST', headers: { 'blotato-api-key': BL_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ post: { accountId: '32320', target: { targetType: 'facebook', pageId },
            content: { text: input.copy_post, platform: 'facebook', mediaUrls: [imageUrl] } } }) });
      const pubData = await pubRes.json();
      console.log('[blotato] status:', pubRes.status, JSON.stringify(pubData).slice(0, 300));
      if (!pubRes.ok) return `✅ Imagen (${imageSource}): ${imageUrl}\n❌ Blotato ${pubRes.status}: ${JSON.stringify(pubData).slice(0, 300)}`;
      // Auto-guardar en memoria para que la próxima sesión sepa qué se publicó
      if (SB_URL && SB_KEY) {
        const ck = (input.cliente || 'arranca').toLowerCase().trim();
        const firstWord = ck.split(/\s+/)[0];
        const memR = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }).catch(() => null);
        if (memR) {
          const memRows = await memR.json().catch(() => []);
          const clienteKey = memRows?.[0]?.cliente || ck;
          const datos = memRows?.[0]?.datos || {};
          const posts = datos.posts_publicados || [];
          posts.unshift({ fecha: new Date().toISOString(), copy: input.copy_post?.slice(0,200), imagen: imageUrl, post_id: pubData.postSubmissionId || pubData.id, fuente: imageSource });
          datos.posts_publicados = posts.slice(0, 20);
          datos.ultimo_post = new Date().toISOString();
          const method = memRows?.[0] ? 'PATCH' : 'POST';
          const url = memRows?.[0] ? `${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}` : `${SB_URL}/rest/v1/memoria_clientes`;
          const body = memRows?.[0] ? { datos } : { cliente: ck, datos };
          await fetch(url, { method, headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(() => {});
        }
      }
      await _saveToMediaLibrary(imageUrl, `Imagen ${new Date().toLocaleDateString('es-MX')} — ${(input.prompt_imagen||'').slice(0,40)}`, 'image', input.cliente || 'arranca');
      return `✅ Imagen generada (${imageSource}) y publicada en Facebook (${input.cliente}).\nPost ID: ${pubData.postSubmissionId || pubData.id || '✓'}\nImagen: ${imageUrl}`;
    }
    if (name === 'leer_memoria_cliente') {
      if (!SB_URL || !SB_KEY) return 'Supabase no configurado.';
      const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
      const ck = (input.cliente || '').toLowerCase().trim();
      // 1. Exact match
      let r = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(ck)}&select=cliente,datos`, { headers: sbHdr });
      let d = await r.json();
      // 2. ilike partial match (ej: "arranca financial" → "arranca")
      if (!Array.isArray(d) || !d[0]) {
        const firstWord = ck.split(/\s+/)[0];
        r = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos`, { headers: sbHdr });
        d = await r.json();
      }
      if (!Array.isArray(d) || !d[0]) return `Sin memoria para '${input.cliente}'. Comparte la estrategia aquí para que pueda usarla.`;
      return `[Memoria de "${d[0].cliente}"]\n` + JSON.stringify(d[0].datos, null, 2).slice(0, 2000);
    }
    if (name === 'guardar_memoria') {
      if (!SB_URL || !SB_KEY) return 'Supabase no configurado.';
      const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
      const ck = (input.cliente || '').toLowerCase().trim();
      // Leer memoria existente
      const existing = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(ck.split(/\s+/)[0])}*&select=cliente,datos`, { headers: sbHdr });
      const rows = await existing.json();
      const clienteKey = rows?.[0]?.cliente || ck;
      const datosPrev = rows?.[0]?.datos || {};
      const datosNew = { ...datosPrev, ...input.datos, _actualizado: new Date().toISOString() };
      if (rows?.[0]) {
        await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}`,
          { method: 'PATCH', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ datos: datosNew }) });
      } else {
        await fetch(`${SB_URL}/rest/v1/memoria_clientes`,
          { method: 'POST', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ cliente: ck, datos: datosNew }) });
      }
      return `✅ Memoria de "${clienteKey}" actualizada. Campos guardados: ${Object.keys(input.datos).join(', ')}`;
    }
    if (name === 'cargar_skill') {
      const nombres = Array.isArray(input.nombres) ? input.nombres : [input.nombre || input.nombres];
      const resultados = nombres.filter(Boolean).map(n => _cargarSkill(n));
      return resultados.join('\n\n---\n\n') || 'No se especificó ninguna skill.';
    }
    return `Herramienta '${name}' no implementada.`;
  } catch (e) { return `❌ Error en ${name}: ${e.message}`; }
}

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

// ── Media Library (Supabase — sin tabla extra, usa memoria_clientes._media) ──
async function _saveToMediaLibrary(url, name, type, cliente) {
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY || !url) return;
  try {
    const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
    const ck = (cliente || 'arranca').toLowerCase().trim();
    const firstWord = ck.split(/\s+/)[0];
    const existing = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos&limit=1`, { headers: sbHdr });
    const rows = await existing.json();
    const clienteKey = rows?.[0]?.cliente || ck;
    const datosPrev = rows?.[0]?.datos || {};
    const media = Array.isArray(datosPrev._media) ? datosPrev._media : [];
    media.push({ url, name: name || type, type: type || 'video', created: new Date().toISOString() });
    const datosNew = { ...datosPrev, _media: media };
    if (rows?.[0]) {
      await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}`,
        { method: 'PATCH', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ datos: datosNew }) });
    } else {
      await fetch(`${SB_URL}/rest/v1/memoria_clientes`,
        { method: 'POST', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ cliente: ck, datos: datosNew }) });
    }
  } catch(_) {}
}

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

// ── MCP Server endpoint — para Hermes Agent y Claude Code ─────────────
const MCP_TOOLS = [
  { name: 'generar_y_publicar', description: 'Genera imagen con IA y publica en Facebook para un cliente. Devuelve URL de imagen y Post ID.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, prompt_imagen: { type: 'string', description: 'Descripción visual en inglés' }, copy_post: { type: 'string', description: 'Texto del post en español' } }, required: ['cliente', 'prompt_imagen', 'copy_post'] } },
  { name: 'generar_video', description: 'Genera video UGC con Seedance (kie.ai). Modelo: bytedance/seedance-2-fast. Tarda 4-6 min.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, cliente: { type: 'string' }, imagen_url: { type: 'string' } }, required: ['prompt'] } },
  { name: 'publicar_blotato', description: 'Publica texto y/o media en Facebook via Blotato.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, texto: { type: 'string' }, media_url: { type: 'string' } }, required: ['cliente', 'texto'] } },
  { name: 'leer_memoria_cliente', description: 'Lee perfil y memoria operativa del cliente desde Supabase.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
  { name: 'guardar_memoria', description: 'Guarda o actualiza datos del cliente en Supabase.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, datos: { type: 'object' } }, required: ['cliente', 'datos'] } },
  { name: 'listar_media', description: 'Lista videos e imágenes generadas recientemente para un cliente.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
];

// MCP initialize / list tools
app.post('/mcp', async (req, res) => {
  const { method, id, params } = req.body || {};
  res.setHeader('Content-Type', 'application/json');
  if (method === 'initialize') {
    return res.json({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'agencia-dashboard', version: '1.0.0' } } });
  }
  if (method === 'tools/list') {
    return res.json({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } });
  }
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const result = await _ejecutarHerramienta(name, args || {});
      return res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: result }] } });
    } catch(e) {
      return res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: e.message } });
    }
  }
  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

// MCP GET — capability discovery
app.get('/mcp', (req, res) => {
  res.json({ name: 'agencia-dashboard', version: '1.0.0', tools: MCP_TOOLS.map(t => t.name) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
