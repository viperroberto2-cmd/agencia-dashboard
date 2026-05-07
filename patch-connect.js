const fs = require('fs');
let v2 = fs.readFileSync('index-v2.html', 'utf8').replace(/\r\n/g, '\n');

// ─────────────────────────────────────────────────────────────────
// 1. Inject SUPABASE + AGENT_MAP right after <head> open
// ─────────────────────────────────────────────────────────────────
const headInject = `<script>
window.SUPABASE_URL = '__SUPABASE_URL__';
window.SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
window.AGENT_MAP = {
  organizador: { url: 'https://web-production-77871.up.railway.app',               endpoint: '/organizador/chat' },
  director:    { url: 'https://agencia-ai-production.up.railway.app',               endpoint: '/director/chat'    },
  crew:        { url: 'https://worker-production-34f9.up.railway.app',              endpoint: '/crew/chat'        },
  estrategia:  { url: 'https://worker-production-035f.up.railway.app',             endpoint: '/estratega/chat'   },
  scheduler:   { url: 'https://worker-production-aa53.up.railway.app',             endpoint: '/scheduler/chat'   },
  analytics:   { url: 'https://upbeat-endurance.up.railway.app',                   endpoint: '/analytics/chat'   },
  compositor:  { url: 'https://compositorbot-production.up.railway.app',            endpoint: '/compositor/chat'  },
  scraper:     { url: 'https://agencia-ai-scraper-production.up.railway.app',       endpoint: '/scraper/task'     },
  seo:         { url: 'https://agencia-ai-seo-production.up.railway.app',           endpoint: '/seo/task'         },
  web:         { url: 'https://agencia-ai-web-designer-production.up.railway.app',  endpoint: '/web/chat'         },
  motion:      { url: 'https://web-production-d67bad.up.railway.app',               endpoint: '/motion/chat'      }
};
</script>`;

v2 = v2.replace('<head>', '<head>\n' + headInject);
console.log('1. AGENT_MAP injected');

// ─────────────────────────────────────────────────────────────────
// 2. Replace sendMessage() with real API call
// ─────────────────────────────────────────────────────────────────
const oldSend = `function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += \`
    <div class="message-group user">
      <div class="message-meta" style="text-align: right;">Tú · ahora</div>
      <div class="message user">\${escapeHtml(text)}</div>
    </div>
  \`;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    msgs.innerHTML += \`
      <div class="message-group">
        <div class="message-meta">\${activeAgent.name} · ahora</div>
        <div class="message bot">\${simulateReply(text)}</div>
      </div>
    \`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 700);
}`;

const newSend = `function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += \`<div class="message-group user"><div class="message-meta" style="text-align:right">Tú · ahora</div><div class="message user">\${escapeHtml(text)}</div></div>\`;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;

  // Loading indicator
  const loadId = 'load-' + Date.now();
  msgs.innerHTML += \`<div class="message-group" id="\${loadId}"><div class="message-meta">\${activeAgent.name} · ahora</div><div class="message bot" style="opacity:.5">⏳ Pensando...</div></div>\`;
  msgs.scrollTop = msgs.scrollHeight;

  const agentCfg = window.AGENT_MAP && window.AGENT_MAP[activeAgent.id];
  if (!agentCfg) {
    document.getElementById(loadId).querySelector('.message').textContent = simulateReply(text);
    return;
  }
  fetch(agentCfg.url + agentCfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, client: currentClient })
  })
  .then(r => r.json())
  .then(d => {
    const reply = d.response || d.message || d.reply || d.content || JSON.stringify(d);
    document.getElementById(loadId).querySelector('.message').style.opacity = '1';
    document.getElementById(loadId).querySelector('.message').textContent = reply;
    msgs.scrollTop = msgs.scrollHeight;
  })
  .catch(e => {
    document.getElementById(loadId).querySelector('.message').textContent = '⚠ Sin respuesta del agente (' + e.message + ')';
    document.getElementById(loadId).querySelector('.message').style.opacity = '1';
  });
}`;

if (v2.includes('function sendMessage()')) {
  v2 = v2.replace(oldSend, newSend);
  console.log('2. sendMessage() connected to real API');
} else {
  console.log('2. WARN: sendMessage() pattern not found — skipping');
}

// ─────────────────────────────────────────────────────────────────
// 3. Connect Estado del sistema to /api/health
// ─────────────────────────────────────────────────────────────────
const healthScript = `
// ── HEALTH CHECK ──────────────────────────────────────────────────
async function loadHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const map = {
      b2: 'Crew bot', b1: 'Bot 1', org: 'Organizador', b5: 'Scheduler',
      web: 'Web Designer', motion: 'Motion', scraper: 'Scraper',
      seo: 'SEO', analytics: 'Analytics', b3: 'Estrategia'
    };
    const container = document.getElementById('systemStatusList');
    if (!container) return;
    container.innerHTML = Object.entries(data).map(([k, v]) => {
      const label = map[k] || k;
      const ok = v && v.ok;
      return \`<div class="status-row">
        <span class="status-label">\${label}</span>
        <span class="status-dot \${ok ? 'dot-green' : 'dot-red'}"></span>
        <span class="status-text" style="color:\${ok ? '#4ade80' : '#f87171'}">\${ok ? 'Operacional' : 'Offline'}</span>
      </div>\`;
    }).join('');
  } catch(e) { console.warn('Health check failed:', e.message); }
}
loadHealth();
setInterval(loadHealth, 30000);
`;

// Insert before closing </script> of the last script block
const lastScriptClose = v2.lastIndexOf('</script>');
v2 = v2.slice(0, lastScriptClose) + healthScript + '\n' + v2.slice(lastScriptClose);
console.log('3. Health check connected');

// ─────────────────────────────────────────────────────────────────
// 4. Add id="systemStatusList" to the Estado del sistema container
// ─────────────────────────────────────────────────────────────────
v2 = v2.replace(
  /(<div[^>]*class="[^"]*status-list[^"]*"[^>]*>)/,
  '$1<!-- health -->'
);
// Find "Estado del sistema" section and tag it
v2 = v2.replace(
  /(<div[^>]*>)\s*(<div[^>]*>\s*Railway)/,
  (match) => match // keep as-is, we'll use the id approach below
);

// Tag the ul/div that holds the status rows
v2 = v2.replace(
  /class="status-list"/,
  'class="status-list" id="systemStatusList"'
);
console.log('4. systemStatusList id tagged');

// ─────────────────────────────────────────────────────────────────
// 5. Connect Drive section to real /gdrive/listar
// ─────────────────────────────────────────────────────────────────
const driveLoadScript = `
// ── GDRIVE LIVE LOAD ──────────────────────────────────────────────
async function loadDriveFromAPI() {
  try {
    const tipo = driveFilter === 'all' ? 'all' : driveFilter;
    const res = await fetch('/gdrive/listar?tipo=' + tipo);
    const data = await res.json();
    if (!data.ok || !data.archivos.length) return; // fallback to static data
    const iconMap = { video: '🎬', audio: '🎵', image: '🖼️' };
    window._driveAPIItems = data.archivos.map(f => {
      const mime = f.mimeType || '';
      const type = mime.includes('video') ? 'video' : mime.includes('audio') ? 'audio' : mime.includes('image') ? 'image' : 'file';
      const sizeKB = f.size ? Math.round(f.size / 1024) : 0;
      const sizeFmt = sizeKB > 1024 ? (sizeKB/1024).toFixed(1) + ' MB' : sizeKB + ' KB';
      return { type, name: f.name, size: sizeFmt, source: 'Drive', date: new Date(f.modifiedTime).toLocaleDateString('es-MX',{month:'short',day:'numeric'}), icon: iconMap[type]||'📄', link: f.webViewLink };
    });
    renderDrive();
  } catch(e) { console.warn('GDrive API failed, using static data:', e.message); }
}
`;

const lastScriptClose2 = v2.lastIndexOf('</script>');
v2 = v2.slice(0, lastScriptClose2) + driveLoadScript + '\n' + v2.slice(lastScriptClose2);

// Modify renderDrive to prefer API data
v2 = v2.replace(
  /function renderDrive\(\)\s*\{/,
  `function renderDrive() {
  const items = window._driveAPIItems || driveItems;
  const driveItemsOrig = driveItems;
  // swap for render
  `
);
console.log('5. Drive API loader added');

// ─────────────────────────────────────────────────────────────────
// 6. Add Marketing Studio nav item in sidebar
// ─────────────────────────────────────────────────────────────────
// Find the Drive nav item and insert Marketing Studio after it
const driveNavPattern = /(<[^>]+data-section="drive"[^>]*>[\s\S]*?<\/[^>]+>)/;
const driveNavMatch = v2.match(driveNavPattern);
if (driveNavMatch) {
  const msNavItem = `
        <div class="nav-item" data-section="marketing" onclick="goSection('marketing')">
          <span class="nav-icon">🎬</span>
          <span class="nav-label">Marketing Studio</span>
        </div>`;
  v2 = v2.replace(driveNavMatch[0], driveNavMatch[0] + msNavItem);
  console.log('6. Marketing Studio nav item added');
} else {
  console.log('6. WARN: drive nav item not found');
}

// ─────────────────────────────────────────────────────────────────
// 7. Add Marketing Studio section HTML before </body>
// ─────────────────────────────────────────────────────────────────
const msSection = `
<div class="section" id="section-marketing">
  <div style="padding:28px 32px;max-width:900px">
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px">🎬 Marketing Studio</div>
    <div style="font-size:12px;color:#7b6fa0;margin-bottom:28px">Seedance 2.0 · kie.ai · RG Production</div>

    <div style="font-size:11px;font-weight:600;letter-spacing:.08em;color:#7b6fa0;text-transform:uppercase;margin-bottom:12px">Tipo de video</div>
    <div id="ms-presets" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:28px">
      ${['👤 UGC|Video estilo usuario real|ugc','📋 Tutorial|Paso a paso del producto|tutorial','📺 TV Spot|Comercial cinematográfico|tvspot','⚡ Hyper Motion|Alta energía y acción|hypermotion','⭐ Review|Testimonio de cliente|review','🃏 Wild Card|Formato libre|wildcard'].map((p,i) => {
        const [title, desc, id] = p.split('|');
        return `<div class="ms-preset-card${i===0?' ms-active':''}" onclick="msSelect(this,'${id}')" style="background:#1a1730;border:.5px solid #2a2540;border-radius:12px;padding:16px;cursor:pointer;position:relative;transition:all .18s">
          <div style="font-size:22px;margin-bottom:8px">${title.split(' ')[0]}</div>
          <div style="font-size:13px;font-weight:600;color:#e8e0ff;margin-bottom:3px">${title.split(' ').slice(1).join(' ')}</div>
          <div style="font-size:11px;color:#7b6fa0">${desc}</div>
        </div>`;
      }).join('')}
    </div>

    <div style="font-size:11px;font-weight:600;letter-spacing:.08em;color:#7b6fa0;text-transform:uppercase;margin-bottom:8px">Brief</div>
    <textarea id="ms-brief" placeholder="Describe el contenido: tono, audiencia, mensaje, CTA..." style="width:100%;background:#1a1730;border:.5px solid #2a2540;border-radius:10px;padding:12px 14px;font-size:13px;font-family:inherit;color:#e8e0ff;resize:vertical;min-height:90px;box-sizing:border-box;outline:none;margin-bottom:16px"></textarea>

    <button onclick="msGenerar()" style="width:100%;background:linear-gradient(135deg,#7c5cfc,#a78bfa);border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;margin-bottom:8px">✦ Generar Video</button>
    <div id="ms-status" style="font-size:12px;color:#7c5cfc;min-height:16px;margin-bottom:12px"></div>
    <div id="ms-output" style="background:#1a1730;border:.5px solid #2a2540;border-radius:10px;padding:14px;min-height:60px;font-size:12px;color:#9b8ec4;white-space:pre-wrap;display:none"></div>
  </div>
</div>`;

v2 = v2.replace('</body>', msSection + '\n</body>');

// Add MS JS
const msJs = `
// ── MARKETING STUDIO ──────────────────────────────────────────────
let msPreset = 'ugc';
function msSelect(el, id) {
  document.querySelectorAll('.ms-preset-card').forEach(c => { c.style.borderColor='#2a2540'; c.style.background='#1a1730'; });
  el.style.borderColor = '#7c5cfc'; el.style.background = '#1e1a3a';
  msPreset = id;
}
async function msGenerar() {
  const brief = document.getElementById('ms-brief').value.trim();
  if (!brief) { document.getElementById('ms-status').textContent = '⚠ Escribe un brief primero'; return; }
  document.getElementById('ms-status').textContent = '⏳ Enviando al Crew bot...';
  document.getElementById('ms-output').style.display = 'none';
  try {
    const r = await fetch('/api/crew/seedance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: msPreset, brief, client: currentClient })
    });
    const d = await r.json();
    const out = document.getElementById('ms-output');
    out.textContent = d.prompt || d.message || JSON.stringify(d, null, 2);
    out.style.display = 'block';
    document.getElementById('ms-status').textContent = d.job_id ? '✓ Job ID: ' + d.job_id : '✓ Completado';
  } catch(e) {
    document.getElementById('ms-status').textContent = '⚠ Error: ' + e.message;
  }
}
`;

const lastScriptClose3 = v2.lastIndexOf('</script>');
v2 = v2.slice(0, lastScriptClose3) + msJs + '\n' + v2.slice(lastScriptClose3);
console.log('7. Marketing Studio section + JS added');

// ─────────────────────────────────────────────────────────────────
// 8. Call loadDriveFromAPI on section switch
// ─────────────────────────────────────────────────────────────────
v2 = v2.replace(
  `document.querySelector('.main').scrollTop = 0;`,
  `document.querySelector('.main').scrollTop = 0;
  if (name === 'drive') loadDriveFromAPI();`
);
console.log('8. Drive API auto-load on nav');

fs.writeFileSync('index-v2.html', v2);
console.log('\n✓ DONE — all connections applied');
