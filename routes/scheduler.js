// routes/scheduler.js — calendario y publicaciones programadas
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { sbFetch } = require('../lib/db');

router.get('/posts', async (req, res) => {
  try {
    const { estado, cliente } = req.query;

    let path =
      '/contenidos_programados' +
      '?order=fecha_publicacion.asc,hora_publicacion.asc' +
      '&limit=100';

    if (estado) {
      path += `&estado=eq.${encodeURIComponent(estado)}`;
    }

    if (cliente) {
      path += `&cliente=eq.${encodeURIComponent(cliente)}`;
    }

    const r = await sbFetch(path);
    const d = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: d?.message || d?.error || 'Error consultando publicaciones'
      });
    }

    res.json(Array.isArray(d) ? d : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/post', async (req, res) => {
  try {
    const {
      contenido,
      plataforma,
      cliente,
      fecha_publicacion,
      hora_publicacion,
      imagen_url
    } = req.body || {};

    if (!contenido || !String(contenido).trim()) {
      return res.status(400).json({
        error: 'El contenido no puede estar vacío.'
      });
    }

    if (!cliente || !String(cliente).trim()) {
      return res.status(400).json({
        error: 'Debes seleccionar un cliente.'
      });
    }

    if (!plataforma || !String(plataforma).trim()) {
      return res.status(400).json({
        error: 'Debes seleccionar una plataforma.'
      });
    }

    if (!fecha_publicacion) {
      return res.status(400).json({
        error: 'Debes seleccionar una fecha.'
      });
    }

    if (!hora_publicacion) {
      return res.status(400).json({
        error: 'Debes seleccionar una hora.'
      });
    }

    const postId = crypto.randomUUID();

    const record = {
      post_id: postId,
      cliente: String(cliente).trim(),
      plataforma: String(plataforma).trim(),
      contenido: String(contenido).trim(),
      imagen_url: imagen_url ? String(imagen_url).trim() : '',
      fecha_publicacion,
      hora_publicacion,
      estado: 'pendiente',
      fb_page_id: '',
      fb_access_token: '',
      aprobado_por: null,
      ts_publicado: null
    };

    const r = await sbFetch('/contenidos_programados', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify(record)
    });

    const d = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: d?.message || d?.error || 'No se pudo guardar la publicación'
      });
    }

    const saved = Array.isArray(d) ? d[0] : d;

    res.status(201).json({
      status: 'ok',
      post_id: saved?.post_id || postId,
      post: saved || record
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/posts/:postId', async (req, res) => {
  try {
    const postId = encodeURIComponent(req.params.postId);

    const r = await sbFetch(
      `/contenidos_programados?post_id=eq.${postId}`,
      {
        method: 'DELETE',
        prefer: 'return=representation'
      }
    );

    const d = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: d?.message || d?.error || 'No se pudo eliminar la publicación'
      });
    }

    res.json({
      ok: true,
      deleted: Array.isArray(d) ? d.length : 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ruta heredada. Ya no depende del antiguo servicio Railway.
router.post('/publicar', (req, res) => {
  res.status(410).json({
    error: 'La publicación automática heredada fue retirada. Usa /api/scheduler/post para agregar contenido al calendario.'
  });
});

module.exports = router;
