// routes/clientes.js — /api/clientes/* routes
const express = require('express');
const router = express.Router();
const { sbFetch, _mergeDataCol } = require('../lib/db');

function sanitizeCliente(cliente) {
  if (!cliente || typeof cliente !== 'object') return cliente;

  const clean = JSON.parse(JSON.stringify(cliente));

  // Nunca exponer secretos directos
  delete clean.password_hash;
  delete clean.facebook_token;
  delete clean.long_token;
  delete clean.token;
  delete clean.respond_io_key;
  delete clean.youtube_refresh_token;
  delete clean.tiktok_token;
  delete clean.linkedin_token;
  delete clean.pinterest_token;
  delete clean.twitter_token;

  if (clean.data && typeof clean.data === 'object') {
    delete clean.data.password_hash;
    delete clean.data.facebook_token;
    delete clean.data.long_token;
    delete clean.data.token;
    delete clean.data.respond_io_key;
    delete clean.data.youtube_refresh_token;
    delete clean.data.tiktok_token;
    delete clean.data.linkedin_token;
    delete clean.data.pinterest_token;
    delete clean.data.twitter_token;

    if (Array.isArray(clean.data.facebook_pages)) {
      clean.data.facebook_pages = clean.data.facebook_pages.map(page => ({
        id: page?.id || null,
        name: page?.name || null
      }));
    }

    if (Array.isArray(clean.data.instagram_accounts)) {
      clean.data.instagram_accounts = clean.data.instagram_accounts.map(account => ({
        id: account?.id || null,
        username: account?.username || account?.name || null
      }));
    }
  }

  if (Array.isArray(clean.facebook_pages)) {
    clean.facebook_pages = clean.facebook_pages.map(page => ({
      id: page?.id || null,
      name: page?.name || null
    }));
  }

  return clean;
}


router.get('/', async (req, res) => {
  try {
    const r = await sbFetch('/clientes?select=*&order=nombre.asc');
    const data = await r.json();
    const rows = Array.isArray(data) ? data.filter(c => c.user_id !== 'ms_jobs_dashboard' && c.user_id !== 'dashboard' && c.nombre) : [];
    res.json({ ok: true, clientes: rows.map(c => sanitizeCliente(_mergeDataCol(c))) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.post('/crear', async (req, res) => {
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

router.get('/:user_id', async (req, res) => {
  try {
    const r = await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(req.params.user_id)}&select=*`);
    const data = await r.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return res.json({ ok: false, error: 'Cliente no encontrado' });
    res.json({ ok: true, cliente: sanitizeCliente(_mergeDataCol(row)) });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.patch('/:user_id', async (req, res) => {
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

router.delete('/:user_id', async (req, res) => {
  try {
    await sbFetch(`/clientes?user_id=eq.${req.params.user_id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

module.exports = router;
