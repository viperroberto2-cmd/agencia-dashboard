// routes/scheduler.js — /api/scheduler/* routes
const express = require('express');
const router = express.Router();
const { sbFetch } = require('../lib/db');
const { proxyPost } = require('../lib/proxy');

const SCHEDULER_URL = 'https://worker-production-aa53.up.railway.app';

router.post('/publicar', (req, res) => {
  proxyPost(`${SCHEDULER_URL}/scheduler/publicar`, req, res);
});

router.get('/posts', async (req, res) => {
  try {
    const { estado, cliente } = req.query;
    let path = '/contenidos_programados?order=fecha_publicacion.asc,hora_publicacion.asc&limit=100';
    if (estado)  path += `&estado=eq.${encodeURIComponent(estado)}`;
    if (cliente) path += `&cliente=eq.${encodeURIComponent(cliente)}`;
    const r = await sbFetch(path);
    const d = await r.json();
    res.json(Array.isArray(d) ? d : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/posts/:postId', async (req, res) => {
  try {
    await sbFetch(`/contenidos_programados?post_id=eq.${encodeURIComponent(req.params.postId)}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/post', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      secret: process.env.SCHEDULER_SECRET || 'agencia-scheduler-2025'
    };
    const r = await fetch(`${SCHEDULER_URL}/scheduler/post`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    res.status(r.status).json(d);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
