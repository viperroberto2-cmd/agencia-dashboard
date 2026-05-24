// lib/media.js — _saveToMediaLibrary + getGoogleAccessToken
const https = require('https');

async function _saveToMediaLibrary(url, name, type, cliente) {
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY || !url) return;
  try {
    const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
    const ck = (cliente || 'arranca').toLowerCase().trim();
    const firstWord = ck.split(/\s+/)[0];
    const existing = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos&limit=1`, { headers: sbHdr });
    const rows = await existing.json();
    const clienteKey = rows?.[0]?.cliente || ck;
    const datosPrev = rows?.[0]?.datos || {};
    const media = Array.isArray(datosPrev._media) ? datosPrev._media : [];
    media.push({ url, name: name || type, type: type || 'video', created: new Date().toISOString() });
    const datosNew = { ...datosPrev, _media: media };
    if (rows?.[0]) {
      await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}`,
        { method: 'PATCH', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ datos: datosNew }) });
    } else {
      await fetch(`${SB_URL}/rest/v1/memoria_clientes`,
        { method: 'POST', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ cliente: ck, datos: datosNew }) });
    }
  } catch(_) {}
}

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

module.exports = { _saveToMediaLibrary, getGoogleAccessToken };
