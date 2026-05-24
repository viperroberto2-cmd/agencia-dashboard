// routes/pages.js — HTML pages, PWA icons, onboarding legacy endpoint
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const ROOT = path.join(__dirname, '..');

function buildIcon(size) {
  const { createCanvas } = require('canvas');
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#7c3aed');
  g.addColorStop(1, '#4f46e5');
  ctx.fillStyle = g;
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r,0); ctx.lineTo(size-r,0);
  ctx.quadraticCurveTo(size,0,size,r);
  ctx.lineTo(size,size-r);
  ctx.quadraticCurveTo(size,size,size-r,size);
  ctx.lineTo(r,size);
  ctx.quadraticCurveTo(0,size,0,size-r);
  ctx.lineTo(0,r);
  ctx.quadraticCurveTo(0,0,r,0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(size*.38)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AI', size/2, size/2 - size*.04);
  ctx.fillStyle = '#c4b5fd';
  ctx.font = `${Math.floor(size*.12)}px Arial`;
  ctx.fillText('AGENCIA', size/2, size/2 + size*.28);
  return c.toBuffer('image/png');
}

function serveIndex(res) {
  const html = fs.readFileSync(path.join(ROOT, 'index-v2.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || '');
  console.log('Serving index with SUPABASE_URL:', html.includes('__SUPABASE_URL__') ? 'PLACEHOLDER NOT REPLACED!' : 'REPLACED OK');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
}

function servePortal(res) {
  const html = fs.readFileSync(path.join(ROOT, 'rg-production-client-portal.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
}

// ── PWA icons ─────────────────────────────────────────────────────────────
router.get('/icon-192.png', (_, res) => {
  try { res.type('image/png').set('Cache-Control', 'public,max-age=86400').send(buildIcon(192)); }
  catch(e) { res.status(500).end(); }
});

router.get('/icon-512.png', (_, res) => {
  try { res.type('image/png').set('Cache-Control', 'public,max-age=86400').send(buildIcon(512)); }
  catch(e) { res.status(500).end(); }
});

// ── Admin dashboard ───────────────────────────────────────────────────────
router.get('/',          (_, res) => serveIndex(res));
router.get('/v2',        (_, res) => serveIndex(res));
router.get('/index.html',(_, res) => serveIndex(res));

// ── Client portal ─────────────────────────────────────────────────────────
router.get('/portal',        (_, res) => servePortal(res));
router.get('/client-portal', (_, res) => servePortal(res));

// ── Static pages ──────────────────────────────────────────────────────────
router.get('/onboard', (_, res) => res.sendFile(path.join(ROOT, 'onboard.html')));
router.get('/privacy', (_, res) => res.sendFile(path.join(ROOT, 'privacy.html')));

// ── Legacy self-onboarding (onboard.html form → saves to Supabase) ────────
router.post('/api/onboard-cliente', async (req, res) => {
  const data = req.body;
  const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?user_id=eq.roberto_agencia&select=data`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }}
    ).then(r => r.json());
    const crm = existing[0]?.data || { cliente_activo: null, clientes: {} };
    crm.clientes[data.nombre] = {
      owner: data.owner, email: data.email, telefono: data.telefono,
      industria: data.industria, ciudad: data.ciudad,
      objetivos: data.objetivos, presupuesto: data.presupuesto,
      notas: data.notas, redes_sociales: data.redes,
      onboarding_completo: true,
      fecha_onboarding: new Date().toISOString(),
      fuente: 'RG Production self-onboarding'
    };
    await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
                 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: 'roberto_agencia', data: crm })
    });
    const TG   = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (TG && CHAT) {
      await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT,
          text: `🎉 New client via RG Production onboarding!\n\n🏢 ${data.nombre}\n👤 ${data.owner}\n📧 ${data.email}\n📱 ${data.telefono}\n🏥 ${data.industria}\n🎯 ${(data.objetivos||[]).join(', ')}` })
      });
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
