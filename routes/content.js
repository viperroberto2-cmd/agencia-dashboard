// routes/content.js — /api/content/* routes
const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const { sbFetch } = require('../lib/db');
const { publishToFacebook } = require('../lib/facebook');

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

router.post('/queue', async (req, res) => {
  const { user_id, platform, text, image_url, page_id } = req.body || {};
  if (!user_id || !text) return res.status(400).json({ ok: false, error: 'user_id y text requeridos' });
  try {
    const d = await getClientData(user_id);
    const queue = Array.isArray(d.content_queue) ? d.content_queue : [];
    const requires_approval = d.configuracion?.requires_approval !== false;
    const item = {
      id: randomUUID(), platform: platform || 'facebook', text, image_url: image_url || null,
      page_id: page_id || (d.facebook_pages?.[0]?.id) || null,
      status: requires_approval ? 'pending' : 'auto',
      created_at: new Date().toISOString()
    };
    queue.unshift(item);
    await patchClientData(user_id, { ...d, content_queue: queue.slice(0, 100) });
    if (!requires_approval && d.facebook_pages?.length) {
      await publishToFacebook(item, d);
    }
    res.json({ ok: true, item });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/queue/:user_id', async (req, res) => {
  try {
    const d = await getClientData(req.params.user_id);
    res.json({ ok: true, queue: d.content_queue || [], requires_approval: d.configuracion?.requires_approval !== false });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/approve/:user_id/:item_id', async (req, res) => {
  try {
    const d = await getClientData(req.params.user_id);
    const queue = Array.isArray(d.content_queue) ? d.content_queue : [];
    const item  = queue.find(i => i.id === req.params.item_id);
    if (!item) return res.status(404).json({ ok: false, error: 'Item no encontrado' });
    item.status = 'approved';
    const result = await publishToFacebook(item, d);
    if (result.ok) { item.status = 'published'; item.published_at = new Date().toISOString(); item.post_id = result.post_id; }
    await patchClientData(req.params.user_id, { ...d, content_queue: queue });
    res.json({ ok: true, published: result.ok, item });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/reject/:user_id/:item_id', async (req, res) => {
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

module.exports = router;
