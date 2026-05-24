// routes/auth.js — /api/auth/* routes
const express = require('express');
const router = express.Router();
const { sbFetch, _mergeDataCol } = require('../lib/db');
const { hashPassword, _sessions, crypto } = require('../lib/auth-helpers');

const FB_APP_ID     = process.env.FB_APP_ID     || '1981039516112644';
const FB_APP_SECRET = process.env.FB_APP_SECRET || '';
const SITE_URL      = process.env.SITE_URL      || 'https://web-production-3d2c.up.railway.app';
const FB_CALLBACK   = `${SITE_URL}/api/auth/facebook/callback`;
const FB_SCOPES     = 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_content_publish';

router.get('/facebook', (req, res) => {
  const { user_id, return_to } = req.query;
  if (!user_id) return res.status(400).send('user_id requerido');
  const state = encodeURIComponent(JSON.stringify({ user_id, return_to: return_to || '' }));
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_CALLBACK)}&scope=${FB_SCOPES}&state=${state}`;
  res.redirect(url);
});

router.get('/facebook/callback', async (req, res) => {
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

router.get('/facebook/disconnect', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

router.post('/set-password', async (req, res) => {
  const { user_id, password } = req.body || {};
  if (!user_id || !password) return res.status(400).json({ ok: false, error: 'user_id y contraseña requeridos' });
  // Verificar que la sesión activa pertenece al mismo user_id
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const session = token ? _sessions.get(token) : null;
  if (!session || session.expires < Date.now() || session.user_id !== user_id) {
    _sessions.delete(token);
    return res.status(401).json({ ok: false, error: 'Sesión inválida o no autorizada' });
  }
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' });
  try {
    const r = await sbFetch(`/clientes?email=eq.${encodeURIComponent(email)}&select=*`);
    const rows = await r.json();
    if (!rows || rows.length === 0) return res.json({ ok: true });
    const row = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
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

router.post('/reset-password', async (req, res) => {
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

router.post('/session/create', (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ ok: false });
  const token = crypto.randomBytes(32).toString('hex');
  _sessions.set(token, { user_id, expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.json({ ok: true, token });
});

router.post('/session/verify', async (req, res) => {
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

router.post('/session/destroy', (req, res) => {
  const { token } = req.body || {};
  if (token) _sessions.delete(token);
  res.json({ ok: true });
});

module.exports = router;
