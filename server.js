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

// ── Facebook / Instagram OAuth ─────────────────────────────────────────────
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
    const pagesData = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`).then(r=>r.json());
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
    // Sync Facebook status into memoria_clientes so bots can read it
    const pageName = pages[0]?.name || pages[0]?.id || 'conectado';
    const igUser = igAccounts[0]?.username ? '@' + igAccounts[0].username : null;
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
    res.json({ ok: true, ..._mergeDataCol(row) });
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

// Endpoint diagnóstico — muestra qué vars de Supabase están seteadas en Railway
app.get('/api/env-check', (req, res) => {
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
app.get('/api/clientes', async (req, res) => {
  try {
    const r = await sbFetch('/clientes?select=*&order=nombre.asc');
    const data = await r.json();
    const rows = Array.isArray(data) ? data.filter(c => c.user_id !== 'ms_jobs_dashboard') : [];
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
    res.json({ response: d.content?.[0]?.text || 'Sin respuesta' });
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
    timeout: 55000,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

// force redeploy Tue May  5 10:16:38 PDT 2026
