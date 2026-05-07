const fs = require('fs');
let v2 = fs.readFileSync('index-v2.html', 'utf8').replace(/\r\n/g, '\n');

const msPanel = `<div class="panel content" id="panel-marketing-studio" style="flex-direction:column;gap:0;overflow-y:auto;padding:0">
<style>
.ms-wrap{display:grid;grid-template-columns:1fr 320px;min-height:100%;font-family:inherit}
.ms-main{padding:28px 32px;overflow-y:auto}
.ms-sidebar{padding:24px 20px;border-left:.5px solid #2a2540;background:#0e0c1a;overflow-y:auto}
.ms-title{font-size:22px;font-weight:700;letter-spacing:-.5px;color:#fff;display:flex;align-items:center;gap:10px;margin-bottom:4px}
.ms-sub{font-size:12px;color:#7b6fa0;margin-bottom:24px}
.ms-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
.client-pill{display:flex;align-items:center;gap:8px;background:#1a1730;border:.5px solid #3a3460;border-radius:20px;padding:6px 14px;font-size:13px;color:#c4b8f0;cursor:pointer;white-space:nowrap}
.client-dot{width:7px;height:7px;border-radius:50%;background:#7c5cfc}
.section-label{font-size:11px;font-weight:600;letter-spacing:.08em;color:#7b6fa0;text-transform:uppercase;margin-bottom:12px}
.presets-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:28px}
.preset-card{background:#1a1730;border:.5px solid #2a2540;border-radius:12px;padding:16px 14px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.preset-card:hover{border-color:#6c47ff;background:#1e1a3a}
.preset-card.active{border-color:#7c5cfc;background:#1e1a3a}
.preset-card.active::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#7c5cfc,#a78bfa)}
.active-badge{display:none;position:absolute;top:8px;right:8px;width:16px;height:16px;background:#7c5cfc;border-radius:50%;font-size:9px;color:#fff;align-items:center;justify-content:center}
.preset-card.active .active-badge{display:flex}
.preset-icon{font-size:22px;display:block;margin-bottom:8px}
.preset-name{font-size:13px;font-weight:600;color:#e8e0ff;margin-bottom:3px}
.preset-desc{font-size:11px;color:#7b6fa0;line-height:1.4}
.brief-label{font-size:11px;font-weight:600;letter-spacing:.08em;color:#7b6fa0;text-transform:uppercase;margin-bottom:8px}
.brief-input{width:100%;background:#1a1730;border:.5px solid #2a2540;border-radius:10px;padding:12px 14px;font-size:13px;font-family:inherit;color:#e8e0ff;resize:vertical;min-height:90px;box-sizing:border-box;transition:border-color .15s}
.brief-input:focus{outline:none;border-color:#6c47ff}
.brief-input::placeholder{color:#4a4068}
.info-strip{display:flex;align-items:center;gap:8px;background:#1a1730;border-radius:8px;padding:9px 12px;font-size:12px;color:#7b6fa0;margin:12px 0 20px}
.cost-pill{background:#2a1f5c;color:#a78bfa;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:500;margin-left:auto}
.btn-generar{width:100%;background:linear-gradient(135deg,#7c5cfc,#a78bfa);border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;letter-spacing:.02em;transition:opacity .15s}
.btn-generar:hover{opacity:.88}
.btn-generar:disabled{opacity:.4;cursor:not-allowed}
.sidebar-label{font-size:11px;font-weight:600;letter-spacing:.08em;color:#7b6fa0;text-transform:uppercase;margin-bottom:10px;margin-top:20px}
.sidebar-label:first-child{margin-top:0}
.config-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:.5px solid #1e1c30}
.config-key{font-size:12px;color:#9b8ec4}
.config-val{font-size:12px;color:#e8e0ff;font-weight:500}
.dur-btns{display:flex;gap:6px}
.dur-btn{background:#1a1730;border:.5px solid #2a2540;border-radius:6px;padding:4px 12px;font-size:12px;color:#9b8ec4;cursor:pointer;transition:all .15s}
.dur-btn.active{background:#2a1f5c;border-color:#7c5cfc;color:#a78bfa}
.output-area{background:#1a1730;border:.5px solid #2a2540;border-radius:10px;padding:14px;min-height:80px;font-size:12px;color:#9b8ec4;line-height:1.6;margin-top:10px;white-space:pre-wrap}
.gen-status{font-size:12px;color:#7c5cfc;margin-top:8px;min-height:16px}
@media(max-width:900px){.ms-wrap{grid-template-columns:1fr}.ms-sidebar{border-left:none;border-top:.5px solid #2a2540}.presets-grid{grid-template-columns:repeat(2,1fr)}}
</style>

<div class="ms-wrap">
<div class="ms-main">
  <div class="ms-header">
    <div>
      <div class="ms-title">🎬 Marketing Studio</div>
      <div class="ms-sub">Seedance 2.0 · kie.ai · RG Production</div>
    </div>
    <div class="client-pill">
      <div class="client-dot"></div>
      <span id="ms-client-name">Arranca Financial</span>
      <span style="color:#4a4068;font-size:10px">▾</span>
    </div>
  </div>

  <div class="section-label">Tipo de video</div>
  <div class="presets-grid" id="ms-presets">
    <div class="preset-card active" onclick="msSelectPreset(this,'ugc')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">👤</span>
      <div class="preset-name">UGC</div>
      <div class="preset-desc">Video estilo usuario real para redes</div>
    </div>
    <div class="preset-card" onclick="msSelectPreset(this,'tutorial')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">📋</span>
      <div class="preset-name">Tutorial</div>
      <div class="preset-desc">Paso a paso mostrando el producto</div>
    </div>
    <div class="preset-card" onclick="msSelectPreset(this,'tvspot')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">📺</span>
      <div class="preset-name">TV Spot</div>
      <div class="preset-desc">Comercial cinematográfico premium</div>
    </div>
    <div class="preset-card" onclick="msSelectPreset(this,'hypermotion')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">⚡</span>
      <div class="preset-name">Hyper Motion</div>
      <div class="preset-desc">Alta energía, dinámica y acción</div>
    </div>
    <div class="preset-card" onclick="msSelectPreset(this,'review')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">⭐</span>
      <div class="preset-name">Review</div>
      <div class="preset-desc">Testimonio y reseña de producto</div>
    </div>
    <div class="preset-card" onclick="msSelectPreset(this,'wildcard')">
      <div class="active-badge">✓</div>
      <span class="preset-icon">🃏</span>
      <div class="preset-name">Wild Card</div>
      <div class="preset-desc">Formato libre, sin restricciones</div>
    </div>
  </div>

  <div class="brief-label">Brief / Descripción</div>
  <textarea class="brief-input" id="ms-brief" placeholder="Describe el contenido: tono, audiencia objetivo, mensaje principal, CTA..."></textarea>
  <div class="info-strip">
    <span>🎬</span>
    <span id="ms-info-text">UGC · 9:16 · 15s · con audio</span>
    <span class="cost-pill" id="ms-cost">~2 créditos</span>
  </div>
  <button class="btn-generar" id="ms-btn-gen" onclick="msGenerar()">✦ Generar Video</button>
  <div class="gen-status" id="ms-status"></div>
</div>

<div class="ms-sidebar">
  <div class="sidebar-label">Configuración</div>
  <div class="config-row">
    <span class="config-key">Plataforma</span>
    <span class="config-val" id="ms-plat">Instagram / TikTok</span>
  </div>
  <div class="config-row">
    <span class="config-key">Aspecto</span>
    <span class="config-val" id="ms-aspect">9:16 Vertical</span>
  </div>
  <div class="config-row">
    <span class="config-key">Resolución</span>
    <span class="config-val">1080×1920</span>
  </div>
  <div class="config-row">
    <span class="config-key">Audio IA</span>
    <span class="config-val">✓ Activado</span>
  </div>

  <div class="sidebar-label">Duración</div>
  <div class="dur-btns">
    <div class="dur-btn active" onclick="msDur(this,'5s')">5s</div>
    <div class="dur-btn" onclick="msDur(this,'10s')">10s</div>
    <div class="dur-btn" onclick="msDur(this,'15s')">15s</div>
    <div class="dur-btn" onclick="msDur(this,'30s')">30s</div>
  </div>

  <div class="sidebar-label" style="margin-top:24px">Output</div>
  <div class="output-area" id="ms-output">El prompt generado aparecerá aquí...</div>
</div>
</div>

<script>
const MS_PRESETS = {
  ugc:{plat:'Instagram / TikTok',aspect:'9:16 Vertical',info:'UGC · 9:16 · 15s · con audio',cost:'~2 créditos'},
  tutorial:{plat:'YouTube / Facebook',aspect:'16:9 Horizontal',info:'Tutorial · 16:9 · 30s · con audio',cost:'~4 créditos'},
  tvspot:{plat:'Facebook Ads / TV',aspect:'16:9 Horizontal',info:'TV Spot · 16:9 · 30s · cinemático',cost:'~4 créditos'},
  hypermotion:{plat:'Instagram / TikTok',aspect:'9:16 Vertical',info:'Hyper Motion · 9:16 · 10s · dinámico',cost:'~2 créditos'},
  review:{plat:'Facebook / YouTube',aspect:'1:1 Cuadrado',info:'Review · 1:1 · 15s · con audio',cost:'~2 créditos'},
  wildcard:{plat:'Cualquier plataforma',aspect:'Libre',info:'Wild Card · libre · hasta 30s',cost:'~3 créditos'}
};
let msActive='ugc', msDurVal='5s';
function msSelectPreset(el,id){
  document.querySelectorAll('#ms-presets .preset-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active'); msActive=id;
  const p=MS_PRESETS[id];
  document.getElementById('ms-plat').textContent=p.plat;
  document.getElementById('ms-aspect').textContent=p.aspect;
  document.getElementById('ms-info-text').textContent=p.info;
  document.getElementById('ms-cost').textContent=p.cost;
}
function msDur(el,val){
  document.querySelectorAll('.dur-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active'); msDurVal=val;
}
async function msGenerar(){
  const brief=document.getElementById('ms-brief').value.trim();
  if(!brief){document.getElementById('ms-status').textContent='⚠ Escribe un brief primero';return;}
  const btn=document.getElementById('ms-btn-gen');
  btn.disabled=true; btn.textContent='⏳ Generando...';
  document.getElementById('ms-status').textContent='Enviando al Crew bot...';
  document.getElementById('ms-output').textContent='Procesando...';
  try{
    const r=await fetch('/api/crew/seedance',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({preset:msActive,brief,duration:msDurVal,client:document.getElementById('ms-client-name').textContent})});
    const d=await r.json();
    document.getElementById('ms-output').textContent=d.prompt||d.message||JSON.stringify(d,null,2);
    document.getElementById('ms-status').textContent=d.job_id?'✓ Job ID: '+d.job_id:'✓ Completado';
  }catch(e){
    document.getElementById('ms-output').textContent='Error: '+e.message;
    document.getElementById('ms-status').textContent='⚠ Error conectando al Crew bot';
  }
  btn.disabled=false; btn.textContent='✦ Generar Video';
}
</script>
</div>`;

// Replace old panel with regex — match from opening div to matching closing div
const oldPanelStart = '<div class="panel content" id="panel-marketing-studio"';
const startIdx = v2.indexOf(oldPanelStart);
if (startIdx === -1) {
  console.log('Panel not found — appending before </body>');
  v2 = v2.replace('</body>', msPanel + '\n</body>');
} else {
  // Find the closing </div> by counting depth
  let depth = 0, i = startIdx, found = -1;
  while (i < v2.length) {
    if (v2.slice(i, i+4) === '<div') depth++;
    else if (v2.slice(i, i+6) === '</div>') { depth--; if (depth === 0) { found = i + 6; break; } }
    i++;
  }
  if (found !== -1) {
    v2 = v2.slice(0, startIdx) + msPanel + v2.slice(found);
    console.log('Panel replaced OK at index', startIdx);
  } else {
    console.log('Could not find closing div — check manually');
  }
}

fs.writeFileSync('index-v2.html', v2);
console.log('DONE');
