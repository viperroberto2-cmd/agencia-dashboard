// routes/portal.js — /api/portal/* and /api/portal-users/* routes
const express = require('express');
const { sbFetch, _mergeDataCol } = require('../lib/db');
const { hashPassword, _sessions } = require('../lib/auth-helpers');

// ── /api/portal/* ────────────────────────────────────────────────
const portalRouter = express.Router();

// Verifica que el token de sesión pertenezca al user_id solicitado (evita IDOR).
function requireOwnership(req, res, next) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const session = token ? _sessions.get(token) : null;
  if (!session || session.expires < Date.now()) {
    if (token) _sessions.delete(token);
    return res.status(401).json({ ok: false, error: 'Sesión inválida' });
  }
  if (session.user_id !== user_id) {
    return res.status(403).json({ ok: false, error: 'No autorizado' });
  }
  next();
}

portalRouter.get('/leads', requireOwnership, async (req, res) => {
  const { user_id } = req.query;
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

portalRouter.get('/recordings', requireOwnership, async (req, res) => {
  const { user_id } = req.query;
  try {
    const r = await sbFetch(`/voice_leads?cliente=eq.${user_id}&recording_url=not.is.null&select=call_sid,recording_url,agent,call_status,created_at&order=created_at.desc&limit=50`);
    const data = await r.json();
    res.json({ ok: true, recordings: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

portalRouter.get('/stats', requireOwnership, async (req, res) => {
  const { user_id } = req.query;
  try {
    const r = await sbFetch(`/voice_leads?cliente=eq.${user_id}&select=status,created_at`);
    const raw = await r.json();
    const data = Array.isArray(raw) ? raw : [];
    const total = data.length;
    const closed = data.filter(l => l.status === 'closed').length;
    res.json({ ok: true, total_leads: total, cerrados: closed, revenue: closed * 197 });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

portalRouter.post('/onboarding-new', async (req, res) => {
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
      const updR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(existing.user_id)}&select=*`);
      const updRows = await updR.json();
      const row = (Array.isArray(updRows) && updRows[0]) || { user_id: existing.user_id, email };
      return res.json({ ok: true, user_id: row.user_id, cliente: _mergeDataCol(row) });
    }
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

portalRouter.post('/onboarding-submit', async (req, res) => {
  const { user_id, whatsapp, asistente, idioma, tono, horario, wa_status,
          facebook, instagram, youtube, tiktok, website, google_business,
          goals, presupuesto, notas, ciudad,
          negocio, nombre, email, telefono } = req.body;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' });
  try {
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
    const updR = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(user_id)}&select=*`);
    const updRows = await updR.json();
    const row = (Array.isArray(updRows) && updRows[0]) || { user_id };
    res.json({ ok: true, cliente: _mergeDataCol(row) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── /api/portal-users/* ──────────────────────────────────────────
const portalUsersRouter = express.Router();

portalUsersRouter.get('/', async (req, res) => {
  try {
    const r = await sbFetch('/portal_users?select=*&order=created_at.desc');
    const data = await r.json();
    res.json({ ok: true, users: Array.isArray(data) ? data : [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

portalUsersRouter.post('/crear', async (req, res) => {
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

portalUsersRouter.patch('/:id', async (req, res) => {
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

portalUsersRouter.delete('/:id', async (req, res) => {
  try {
    await sbFetch(`/portal_users?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

module.exports = { portalRouter, portalUsersRouter };
