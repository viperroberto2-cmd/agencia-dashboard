// routes/leads.js — /api/leads/* routes
const express = require('express');
const router = express.Router();
const { sbFetch } = require('../lib/db');

router.get('/', async (req, res) => {
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

router.post('/import', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    await sbFetch(`/voice_leads?id=eq.${req.params.id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
      headers: { 'Prefer': 'return=minimal' }
    });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['nombre', 'telefono', 'email', 'notas', 'fuente'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (!Object.keys(patch).length) return res.status(400).json({ ok: false, error: 'Nada que actualizar' });
    await sbFetch(`/voice_leads?id=eq.${req.params.id}`, {
      method: 'PATCH', body: JSON.stringify(patch),
      headers: { 'Prefer': 'return=minimal' }
    });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await sbFetch(`/voice_leads?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

module.exports = router;
