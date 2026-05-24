const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

// Find the old panel start
const startTag = '<div class="panel content" id="panel-marketing-studio"';
const startIdx = html.indexOf(startTag);
if (startIdx === -1) { console.log('ERROR: panel not found'); process.exit(1); }

// Find matching closing </div> by counting depth
let depth = 0, i = startIdx, found = -1;
while (i < html.length) {
  if (html.slice(i, i+4) === '<div') depth++;
  else if (html.slice(i, i+6) === '</div>') { depth--; if (depth === 0) { found = i + 6; break; } }
  i++;
}
if (found === -1) { console.log('ERROR: closing div not found'); process.exit(1); }

console.log('Old panel: lines', html.slice(0, startIdx).split('\n').length, '→', html.slice(0, found).split('\n').length);

// New panel HTML (preserve the wrapper class so showPanel() still works)
const newPanel = `<div class="panel content" id="panel-marketing-studio" style="overflow-y:auto;padding:0">
<!-- ═══════════════════════════════════════════════════════════
     MARKETING STUDIO — Dark Command theme
     ═══════════════════════════════════════════════════════════ -->
<div id="ms-inner" style="padding:0">
<style>
  #panel-marketing-studio{
    --ms-gold:#E0A951;
    --ms-gold-bg:rgba(224,169,81,0.12);
    --ms-green:#34D399;
    --ms-green-bg:rgba(52,211,153,0.12);
    --ms-prim-bg:rgba(124,58,237,0.14);
    --ms-prim-border:rgba(124,58,237,0.4);
    padding:32px;
    max-width:880px;
    margin:0 auto;
    color:var(--text);
  }
  #panel-marketing-studio *{box-sizing:border-box}
  #panel-marketing-studio .ms-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  #panel-marketing-studio .ms-title-wrap{display:flex;align-items:center;gap:12px}
  #panel-marketing-studio .ms-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#A78BFA,#7C3AED);display:grid;place-items:center;color:#fff;font-size:16px;box-shadow:0 0 24px rgba(124,58,237,0.4)}
  #panel-marketing-studio .ms-title{font-size:18px;font-weight:600;margin:0;color:var(--text);letter-spacing:-.01em}
  #panel-marketing-studio .ms-sub{font-size:11px;color:var(--muted);margin-top:3px}
  #panel-marketing-studio .ms-client{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;background:var(--ms-prim-bg);border:1px solid var(--ms-prim-border);border-radius:999px;font-size:13px;font-weight:500;color:#C4B5FD;cursor:pointer;font-family:inherit;transition:all .15s}
  #panel-marketing-studio .ms-client:hover{background:rgba(124,58,237,0.22)}
  #panel-marketing-studio .ms-client::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--primary,#7C3AED);box-shadow:0 0 8px rgba(124,58,237,0.6)}
  #panel-marketing-studio .ms-client::after{content:"▾";font-size:10px;opacity:.6}
  #panel-marketing-studio .ms-section{margin-bottom:28px}
  #panel-marketing-studio .ms-label{font-size:10.5px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}
  #panel-marketing-studio .vtypes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  #panel-marketing-studio .vt{position:relative;background:var(--surface);border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:12px;padding:16px 16px 16px 42px;cursor:pointer;transition:all .15s}
  #panel-marketing-studio .vt:hover{background:var(--surface2);border-color:rgba(255,255,255,0.16)}
  #panel-marketing-studio .vt-radio{position:absolute;left:14px;top:18px;width:18px;height:18px;border:1.5px solid rgba(255,255,255,0.25);border-radius:50%;background:transparent;transition:all .15s}
  #panel-marketing-studio .vt.on{border-color:var(--primary,#7C3AED);background:var(--ms-prim-bg);box-shadow:0 0 0 1px var(--primary,#7C3AED),0 0 24px rgba(124,58,237,0.18)}
  #panel-marketing-studio .vt.on .vt-radio{border-color:var(--primary,#7C3AED);background:var(--primary,#7C3AED)}
  #panel-marketing-studio .vt.on .vt-radio::after{content:"";position:absolute;inset:4px;background:#fff;border-radius:50%}
  #panel-marketing-studio .vt-name{font-size:13.5px;font-weight:600;margin-bottom:3px;color:var(--text)}
  #panel-marketing-studio .vt-desc{font-size:11.5px;color:var(--muted);line-height:1.4}
  #panel-marketing-studio .vt-badge{position:absolute;top:11px;right:11px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;letter-spacing:.02em}
  #panel-marketing-studio .badge-pop{background:var(--ms-prim-bg);color:#C4B5FD;border:1px solid var(--ms-prim-border)}
  #panel-marketing-studio .badge-prem{background:var(--ms-gold-bg);color:var(--ms-gold);border:1px solid rgba(224,169,81,0.35)}
  #panel-marketing-studio .config-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px 36px}
  #panel-marketing-studio .pills{display:flex;flex-wrap:wrap;gap:6px}
  #panel-marketing-studio .pill{padding:7px 15px;border:1px solid var(--border,rgba(255,255,255,0.08));background:var(--surface);border-radius:999px;font-size:12.5px;font-weight:500;color:var(--text);cursor:pointer;font-family:inherit;transition:all .12s}
  #panel-marketing-studio .pill:hover{background:var(--surface2);border-color:rgba(255,255,255,0.16)}
  #panel-marketing-studio .pill.on{background:var(--ms-prim-bg);border-color:var(--primary,#7C3AED);color:#C4B5FD;font-weight:600}
  #panel-marketing-studio .pill.tier-prem{color:var(--ms-gold);border-color:rgba(224,169,81,0.25)}
  #panel-marketing-studio .pill.tier-prem.on{background:var(--ms-gold-bg);border-color:var(--ms-gold);color:var(--ms-gold)}
  #panel-marketing-studio .pill.tier-fast{color:var(--ms-green);border-color:rgba(52,211,153,0.25)}
  #panel-marketing-studio .pill.tier-fast::after{content:" ↗";font-size:11px}
  #panel-marketing-studio .pill.tier-fast.on{background:var(--ms-green-bg);border-color:var(--ms-green)}
  #panel-marketing-studio .refs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}
  #panel-marketing-studio .ref{border:1px dashed rgba(255,255,255,0.18);background:var(--surface);border-radius:12px;padding:20px 12px 18px;text-align:center;cursor:pointer;transition:all .15s}
  #panel-marketing-studio .ref:hover{border-color:var(--primary,#7C3AED);background:var(--ms-prim-bg)}
  #panel-marketing-studio .ref-ico{width:40px;height:40px;margin:0 auto 10px;border-radius:10px;background:var(--surface2);border:1px solid var(--border,rgba(255,255,255,0.08));display:grid;place-items:center;font-size:17px}
  #panel-marketing-studio .ref-name{font-size:13px;font-weight:600;margin-bottom:3px;color:var(--text)}
  #panel-marketing-studio .ref-desc{font-size:11px;color:var(--muted)}
  #panel-marketing-studio .upload{padding:16px;background:var(--surface);border:1px dashed rgba(255,255,255,0.14);border-radius:12px;text-align:center}
  #panel-marketing-studio .upload-title{font-size:13px;font-weight:500;margin-bottom:5px;color:var(--text)}
  #panel-marketing-studio .upload-title::before{content:"📎  "}
  #panel-marketing-studio .upload-path{font-size:11px;color:var(--muted);margin-bottom:11px}
  #panel-marketing-studio .upload-pills{display:flex;gap:6px;justify-content:center}
  #panel-marketing-studio .upload-pill{padding:3px 10px;background:var(--surface2);border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:999px;font-size:11px;color:var(--muted)}
  #panel-marketing-studio .prompt-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  #panel-marketing-studio .auto-badge{font-size:11px;font-weight:500;padding:4px 11px;background:var(--ms-green-bg);color:var(--ms-green);border-radius:999px;border:1px solid rgba(52,211,153,0.25)}
  #panel-marketing-studio .prompt-input{width:100%;min-height:72px;padding:13px 15px;border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:12px;background:var(--surface);font-family:inherit;font-size:13px;color:var(--text);resize:vertical;transition:all .15s}
  #panel-marketing-studio .prompt-input:focus{outline:none;border-color:var(--primary,#7C3AED);box-shadow:0 0 0 3px rgba(124,58,237,0.18)}
  #panel-marketing-studio .prompt-input::placeholder{color:var(--muted);opacity:.7}
  #panel-marketing-studio .ms-actions{display:flex;justify-content:space-between;align-items:center;margin-top:20px;gap:12px;flex-wrap:wrap}
  #panel-marketing-studio .ms-cost{font-size:12px;color:var(--muted)}
  #panel-marketing-studio .ms-cost b{color:var(--text);font-weight:600}
  #panel-marketing-studio .ms-btn{padding:11px 22px;border:none;border-radius:10px;background:linear-gradient(135deg,#A78BFA,#7C3AED);color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 0 20px rgba(124,58,237,0.35)}
  #panel-marketing-studio .ms-btn:hover{box-shadow:0 0 28px rgba(124,58,237,0.55);transform:translateY(-1px)}
  #panel-marketing-studio .ms-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
  @media(max-width:768px){
    #panel-marketing-studio{padding:20px}
    #panel-marketing-studio .vtypes{grid-template-columns:1fr 1fr}
    #panel-marketing-studio .config-grid{grid-template-columns:1fr;gap:20px}
    #panel-marketing-studio .refs{grid-template-columns:1fr}
  }
</style>

<div class="ms-head">
  <div class="ms-title-wrap">
    <div class="ms-icon">🎬</div>
    <div>
      <h1 class="ms-title">Marketing Studio</h1>
      <div class="ms-sub">Seedance 2.0 · kie.ai · powered by RG Production</div>
    </div>
  </div>
  <button class="ms-client" onclick="msNextClient()">
    <span id="ms-client-name">Arranca Financial</span>
  </button>
</div>

<div class="ms-section">
  <div class="ms-label">Tipo de video</div>
  <div class="vtypes">
    <div class="vt on" data-type="UGC" onclick="msPickType(this)">
      <div class="vt-radio"></div><span class="vt-badge badge-pop">Popular</span>
      <div class="vt-name">UGC</div><div class="vt-desc">Estilo usuario real, auténtico</div>
    </div>
    <div class="vt" data-type="Tutorial" onclick="msPickType(this)">
      <div class="vt-radio"></div>
      <div class="vt-name">Tutorial</div><div class="vt-desc">Paso a paso del producto</div>
    </div>
    <div class="vt" data-type="TV Spot" onclick="msPickType(this)">
      <div class="vt-radio"></div><span class="vt-badge badge-prem">Premium</span>
      <div class="vt-name">TV Spot</div><div class="vt-desc">Comercial cinematográfico</div>
    </div>
    <div class="vt" data-type="Hyper Motion" onclick="msPickType(this)">
      <div class="vt-radio"></div>
      <div class="vt-name">Hyper Motion</div><div class="vt-desc">Video dinámico de producto</div>
    </div>
    <div class="vt" data-type="Review" onclick="msPickType(this)">
      <div class="vt-radio"></div>
      <div class="vt-name">Review</div><div class="vt-desc">Reseña auténtica</div>
    </div>
    <div class="vt" data-type="Wild Card" onclick="msPickType(this)">
      <div class="vt-radio"></div>
      <div class="vt-name">Wild Card</div><div class="vt-desc">100% personalizado</div>
    </div>
  </div>
</div>

<div class="ms-section">
  <div class="ms-label">Configuración</div>
  <div class="config-grid">
    <div>
      <div class="ms-label" style="margin-bottom:8px">Formato</div>
      <div class="pills" data-group="fmt">
        <button class="pill" onclick="msPickPill(this)">16:9</button>
        <button class="pill on" onclick="msPickPill(this)">9:16</button>
        <button class="pill" onclick="msPickPill(this)">1:1</button>
        <button class="pill" onclick="msPickPill(this)">4:3</button>
      </div>
    </div>
    <div>
      <div class="ms-label" style="margin-bottom:8px">Calidad</div>
      <div class="pills" data-group="res">
        <button class="pill" onclick="msPickPill(this)">480p</button>
        <button class="pill on" onclick="msPickPill(this)">720p</button>
        <button class="pill" onclick="msPickPill(this)">1080p</button>
      </div>
    </div>
    <div>
      <div class="ms-label" style="margin-bottom:8px">Duración</div>
      <div class="pills" data-group="dur">
        <button class="pill" onclick="msPickPill(this)">5s</button>
        <button class="pill on" onclick="msPickPill(this)">8s</button>
        <button class="pill" onclick="msPickPill(this)">15s</button>
        <button class="pill tier-prem" onclick="msPickPill(this)">30s *</button>
        <button class="pill tier-prem" onclick="msPickPill(this)">60s *</button>
      </div>
    </div>
    <div>
      <div class="ms-label" style="margin-bottom:8px">Velocidad</div>
      <div class="pills" data-group="spd">
        <button class="pill on" onclick="msPickPill(this)">Standard</button>
        <button class="pill tier-fast" onclick="msPickPill(this)">Fast</button>
      </div>
    </div>
  </div>
</div>

<div class="ms-section">
  <div class="ms-label">Material de referencia</div>
  <div class="refs">
    <div class="ref" onclick="msUpload('img')">
      <div class="ref-ico">🖼️</div>
      <div class="ref-name">Imágenes</div>
      <div class="ref-desc">hasta 9 · estilo y escena</div>
    </div>
    <div class="ref" onclick="msUpload('vid')">
      <div class="ref-ico">🎞️</div>
      <div class="ref-name">Video ref.</div>
      <div class="ref-desc">hasta 3 · cámara y ritmo</div>
    </div>
    <div class="ref" onclick="msUpload('aud')">
      <div class="ref-ico">🎵</div>
      <div class="ref-name">Audio</div>
      <div class="ref-desc">hasta 3 · sincroniza ritmo</div>
    </div>
  </div>
  <div class="upload">
    <div class="upload-title">Subir desde Google Drive o dispositivo</div>
    <div class="upload-path">Guardado en Drive / <span id="ms-drive-client">Arranca Financial</span> / referencias /</div>
    <div class="upload-pills">
      <span class="upload-pill">JPG · PNG</span>
      <span class="upload-pill">MP4 · MOV</span>
      <span class="upload-pill">MP3 · WAV</span>
    </div>
  </div>
</div>

<div class="ms-section" style="margin-bottom:0">
  <div class="prompt-head">
    <div class="ms-label" style="margin-bottom:0">Prompt</div>
    <span class="auto-badge">Director lo genera automático</span>
  </div>
  <textarea class="prompt-input" id="ms-prompt-input" placeholder="Opcional — el Director bot genera el prompt perfecto."></textarea>
  <div class="ms-actions">
    <div class="ms-cost">Costo estimado: <b id="ms-cost-val">~$1.00</b> / video · <span id="ms-meta">9:16 · 8s · 720p</span></div>
    <button class="ms-btn" onclick="msGenerate()">Generar video ✨</button>
  </div>
</div>

</div><!-- /ms-inner -->
</div><!-- /panel-marketing-studio -->

<script>
  const msState = { type:'UGC', fmt:'9:16', res:'720p', dur:'8s', spd:'Standard', client:'Arranca Financial' };
  const msClients = ['Arranca Financial','Sofía Clinic','Sin cliente'];
  const msRates = { '480p':0.0575, '720p':0.125, '1080p':0.31 };
  const msDurs  = { '5s':5, '8s':8, '15s':15, '30s':30, '60s':60 };
  let msClientIdx = 0;

  function msPickType(el){
    document.querySelectorAll('#panel-marketing-studio .vt').forEach(v=>v.classList.remove('on'));
    el.classList.add('on');
    msState.type = el.dataset.type;
  }
  function msPickPill(el){
    const g = el.parentElement.dataset.group;
    el.parentElement.querySelectorAll('.pill').forEach(p=>p.classList.remove('on'));
    el.classList.add('on');
    msState[g] = el.textContent.trim().replace(' *','');
    msUpdateCost();
  }
  function msUpdateCost(){
    const sec  = msDurs[msState.dur] || 8;
    const rate = msRates[msState.res] || 0.125;
    const total = (sec*rate).toFixed(2);
    document.getElementById('ms-cost-val').textContent = '~$' + total;
    document.getElementById('ms-meta').textContent = msState.fmt + ' · ' + msState.dur + ' · ' + msState.res;
  }
  function msNextClient(){
    msClientIdx = (msClientIdx+1) % msClients.length;
    msState.client = msClients[msClientIdx];
    document.getElementById('ms-client-name').textContent = msState.client;
    document.getElementById('ms-drive-client').textContent = msState.client;
  }
  function msUpload(type){
    alert('Upload ' + type + ' → Drive / ' + msState.client + ' / referencias /');
  }
  async function msGenerate(){
    const btn = document.querySelector('#panel-marketing-studio .ms-btn');
    const prompt = document.getElementById('ms-prompt-input').value;
    const payload = {
      cliente: msState.client, preset: msState.type,
      aspect_ratio: msState.fmt, resolution: msState.res,
      duration: msState.dur, speed: msState.spd,
      prompt: prompt || null
    };
    btn.disabled = true; btn.textContent = '⏳ Generando...';
    try {
      const r = await fetch('/api/crew/seedance', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      alert('✓ ' + (d.message || d.job_id || JSON.stringify(d)));
    } catch(e) {
      alert('Error: ' + e.message);
    }
    btn.disabled = false; btn.textContent = 'Generar video ✨';
  }
  msUpdateCost();
</script>`;

html = html.slice(0, startIdx) + newPanel + html.slice(found);
fs.writeFileSync('index.html', html);
console.log('Done — panel replaced');
