// routes/media.js — /api/media-library, /api/heygen/*, /api/portal/create-avatar|upload-photo, /gdrive/*
const express = require('express');
const https   = require('https');
const { sbFetch } = require('../lib/db');
const { getGoogleAccessToken } = require('../lib/media');
const { requireClientSession } = require('../lib/auth-helpers');

// ── API router (/api prefix provided by server.js) ──────────────────────────
const apiRouter = express.Router();

apiRouter.get('/media-library', async (req, res) => {
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

apiRouter.get('/heygen/avatares', async (req, res) => {
  const heygenKey = process.env.HEYGEN_API_KEY;
  if (!heygenKey) return res.json({ ok: false, error: 'HEYGEN_API_KEY no configurada' });
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': heygenKey, 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    res.json({ ok: true, avatares: d?.data?.avatars || [] });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

apiRouter.get('/heygen/voces', async (req, res) => {
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

apiRouter.post('/portal/create-avatar', requireClientSession, async (req, res) => {
  try {
    const { image_url, user_id, avatar_name } = req.body;
    // Identidad confiable: solo desde la sesión, nunca desde el body del navegador.
    const sessionUserId = req.clientSession.user_id;
    if (user_id && user_id !== sessionUserId) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }
    const heygenKey = process.env.HEYGEN_API_KEY;
    if (!heygenKey) return res.json({ ok: false, error: 'HEYGEN_API_KEY no configurada' });
    if (!image_url) return res.status(400).json({ ok: false, error: 'image_url requerida' });
    const heyRes = await fetch('https://api.heygen.com/v2/photo_avatar', {
      method: 'POST',
      headers: { 'X-Api-Key': heygenKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: avatar_name || 'Asistente', image_url })
    });
    const heyData = await heyRes.json();
    if (!heyData.data?.photo_avatar_id) {
      return res.json({ ok: false, error: heyData.message || 'Error al crear avatar', raw: heyData });
    }
    const avatar_id = heyData.data.photo_avatar_id;
    // Actualiza únicamente el cliente de la sesión.
    await sbFetch(`/clientes?user_id=eq.${encodeURIComponent(sessionUserId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ heygen_avatar_id: avatar_id }),
      headers: { 'Prefer': 'return=minimal' }
    });
    res.json({ ok: true, avatar_id });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

apiRouter.post('/portal/upload-photo', requireClientSession, async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ ok: false, error: 'Supabase no configurado' });
    const { base64, filename, user_id } = req.body;
    // Identidad confiable: solo desde la sesión, nunca desde el body del navegador.
    const sessionUserId = req.clientSession.user_id;
    if (user_id && user_id !== sessionUserId) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }
    if (!base64) return res.status(400).json({ ok: false, error: 'base64 requerido' });
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const ext    = (filename || 'photo.jpg').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'jpg';
    const fpath  = `avatars/${encodeURIComponent(sessionUserId)}_${Date.now()}.${ext}`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${fpath}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': `image/${ext}`, 'x-upsert': 'true' },
      body: buffer
    });
    if (!uploadRes.ok) { const err = await uploadRes.text(); return res.json({ ok: false, error: err }); }
    res.json({ ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/media/${fpath}` });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

// ── GDrive router (/gdrive prefix provided by server.js) ────────────────────
const gdriveRouter = express.Router();

gdriveRouter.get('/listar', async (req, res) => {
  try {
    const token = await getGoogleAccessToken();
    const folder = process.env.GDRIVE_ROOT_FOLDER || 'root';
    const tipo   = req.query.tipo || 'all';
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

gdriveRouter.get('/referencias', async (req, res) => {
  try {
    const token  = await getGoogleAccessToken();
    const folder = process.env.GDRIVE_REF_FOLDER || process.env.GDRIVE_ROOT_FOLDER || 'root';
    const q      = `'${folder}' in parents and trashed=false`;
    const params = new URLSearchParams({ q, fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink)', pageSize: '100', orderBy: 'name asc' });
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

module.exports = { apiRouter, gdriveRouter };
