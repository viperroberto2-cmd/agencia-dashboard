// routes/tasks.js — /api/tasks/* routes
const express = require('express');
const router = express.Router();
const { sbFetch } = require('../lib/db');

function cleanTaskPayload(body = {}) {
  const allowed = [
    'cliente_id',
    'title',
    'description',
    'status',
    'priority',
    'assigned_to',
    'source',
    'metadata',
    'due_at'
  ];

  const payload = {};

  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  if (payload.metadata && typeof payload.metadata !== 'object') {
    payload.metadata = { raw: payload.metadata };
  }

  return payload;
}

router.get('/', async (req, res) => {
  try {
    const {
      cliente_id,
      status,
      assigned_to,
      limit = 100
    } = req.query;

    const params = new URLSearchParams();
    params.set('select', '*');
    params.set('order', 'created_at.desc');
    params.set('limit', String(Math.min(Number(limit) || 100, 500)));

    if (cliente_id) params.set('cliente_id', `eq.${cliente_id}`);
    if (status) params.set('status', `eq.${status}`);
    if (assigned_to) params.set('assigned_to', `eq.${assigned_to}`);

    const r = await sbFetch(`/tasks?${params.toString()}`);
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: data?.message || data?.error || `Supabase error ${r.status}`
      });
    }

    res.json({
      ok: true,
      tasks: Array.isArray(data) ? data : []
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = cleanTaskPayload(req.body);

    if (!payload.title) {
      return res.status(400).json({
        ok: false,
        error: 'title requerido'
      });
    }

    payload.status = payload.status || 'open';
    payload.priority = payload.priority || 'normal';
    payload.source = payload.source || 'manual';
    payload.metadata = payload.metadata || {};

    const r = await sbFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=representation' }
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: data?.message || data?.error || `Supabase error ${r.status}`
      });
    }

    res.json({
      ok: true,
      task: Array.isArray(data) ? data[0] : data
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const payload = cleanTaskPayload(req.body);

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        ok: false,
        error: 'No hay campos válidos para actualizar'
      });
    }

    const r = await sbFetch(`/tasks?id=eq.${encodeURIComponent(req.params.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=representation' }
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: data?.message || data?.error || `Supabase error ${r.status}`
      });
    }

    res.json({
      ok: true,
      task: Array.isArray(data) ? data[0] : data
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await sbFetch(`/tasks?id=eq.${encodeURIComponent(req.params.id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: data?.message || data?.error || `Supabase error ${r.status}`
      });
    }

    res.json({
      ok: true,
      deleted: Array.isArray(data) ? data : []
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
