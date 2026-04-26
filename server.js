const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();

const BOTS = {
  b1:  'https://worker-production-0c858.up.railway.app/bot1/health',
  b2:  'https://worker-production-34f9.up.railway.app/crew/health',
  b3: 'https://worker-production-035f.up.railway.app/strategy/health',
  org: 'https://web-production-77871.up.railway.app/health',
  b5: 'https://worker-production-aa53.up.railway.app/scheduler/health',
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
  });
}

app.use(express.static(path.join(__dirname), { index: false }));

function serveIndex(res) {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
    .replace(/__SUPABASE_URL__/g, process.env.SUPABASE_URL || '')
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.SUPABASE_ANON_KEY || '');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

app.get('/', (req, res) => serveIndex(res));
app.get('/index.html', (req, res) => serveIndex(res));

app.get('/api/health', async (req, res) => {
  const results = {};
  await Promise.all(
    Object.entries(BOTS).map(async ([id, url]) => {
      results[id] = await checkUrl(url);
    })
  );
  res.json(results);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));

