// lib/tools.js — _ejecutarHerramienta + Higgsfield MCP helpers
const { _cargarSkill } = require('./skills');
const { _saveToMediaLibrary } = require('./media');
const { _resolvePageId, _FB_PAGES } = require('./facebook');

async function _parseMcpResponse(res) {
  const ct = res.headers.get('Content-Type') || '';
  const text = await res.text();
  if (ct.includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        try { const d = JSON.parse(line.slice(6)); if (d.result || d.error) return d; } catch(_) {}
      }
    }
    return {};
  }
  try { return JSON.parse(text); } catch(_) { return { raw: text }; }
}

async function _generarImagenHiggsfieldMCP(prompt) {
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  if (!HF_KEY) throw new Error('HIGGSFIELD_API_KEY no configurada');
  const MCP_URL = 'https://mcp.higgsfield.ai/mcp';
  const hdrs = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': `Bearer ${HF_KEY}` };

  const initRes = await fetch(MCP_URL, {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agencia-ai', version: '1.0' } }, id: 1 }),
    signal: AbortSignal.timeout(15000)
  });
  const sessionId = initRes.headers.get('Mcp-Session-Id');
  const initData = await _parseMcpResponse(initRes);
  if (initData.error) throw new Error(`MCP init: ${initData.error.message}`);

  const sh = sessionId ? { ...hdrs, 'Mcp-Session-Id': sessionId } : hdrs;

  await fetch(MCP_URL, { method: 'POST', headers: sh,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
    signal: AbortSignal.timeout(5000) }).catch(() => {});

  const callRes = await fetch(MCP_URL, {
    method: 'POST', headers: sh,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call',
      params: { name: 'generate_image', arguments: { prompt, steps: 30, task: 'text-to-image' } }, id: 2 }),
    signal: AbortSignal.timeout(180000)
  });
  const callData = await _parseMcpResponse(callRes);
  if (callData.error) throw new Error(`MCP generate: ${callData.error.message}`);

  const content = callData.result?.content || [];
  for (const item of content) {
    if (item.type === 'text') {
      const m = item.text.match(/https?:\/\/[^\s"'<>]+/);
      if (m) return m[0];
    }
    if (item.type === 'image' && item.url) return item.url;
  }
  const raw = JSON.stringify(callData.result || callData);
  const m = raw.match(/https?:\/\/[^\s"'\\]+/);
  if (m) return m[0];
  throw new Error(`Sin URL en MCP: ${raw.slice(0, 400)}`);
}

async function _ejecutarHerramienta(name, input, onProgress = null) {
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const BL_KEY = process.env.BLOTATO_API_KEY;
  const HF_KEY = process.env.HIGGSFIELD_API_KEY;
  try {
    if (name === 'buscar_web') {
      const q = encodeURIComponent(input.query || '');
      const r = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
        { headers: { 'User-Agent': 'AgenciaAI/1.0' }, signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      const parts = [];
      if (d.Abstract) parts.push(`Resumen: ${d.Abstract}`);
      (d.RelatedTopics || []).slice(0, 6).forEach(t => { if (t.Text) parts.push(`• ${t.Text}`); });
      return parts.length ? parts.join('\n') : 'Sin resultados directos. Intenta términos más específicos.';
    }
    if (name === 'fetch_url') {
      const r = await fetch(input.url,
        { headers: { 'User-Agent': 'Mozilla/5.0 AgenciaAI/1.0' }, signal: AbortSignal.timeout(15000) });
      const html = await r.text();
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim().slice(0, 3000) || 'No se pudo extraer contenido.';
    }
    if (name === 'publicar_blotato') {
      if (!BL_KEY) return '❌ BLOTATO_API_KEY no configurada en Railway (Dashboard service).';
      const pageId = _resolvePageId(input.cliente);
      if (!pageId) return `❌ Cliente '${input.cliente}' sin página Facebook. Disponibles: ${Object.keys(_FB_PAGES).join(', ')}`;
      const postBody = { post: { accountId: '32320', target: { targetType: 'facebook', pageId },
        content: { text: input.texto, platform: 'facebook', mediaUrls: input.media_url ? [input.media_url] : [] } } };
      if (input.programado_iso) postBody.post.scheduledAt = input.programado_iso;
      const r = await fetch('https://backend.blotato.com/v2/posts',
        { method: 'POST', headers: { 'blotato-api-key': BL_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(postBody) });
      const d = await r.json();
      if (!r.ok) return `❌ Blotato error: ${JSON.stringify(d).slice(0, 200)}`;
      return `✅ Publicado en Facebook (${input.cliente}). ID: ${d.postSubmissionId || d.id || '✓'}${input.media_url ? '\nImagen: ' + input.media_url : ''}`;
    }
    if (name === 'generar_video') {
      const KIE_KEY = process.env.KIE_API_KEY;
      if (!KIE_KEY) return '❌ KIE_API_KEY no configurada en Railway (Dashboard service).';
      let videoPrompt = input.prompt || '';
      const isUGC = input.estilo === 'ugc' || videoPrompt.toLowerCase().includes('ugc') || videoPrompt.toLowerCase().includes('talking head');
      const isArranca = (input.cliente || 'arranca').toLowerCase().includes('arranca');
      if (!isUGC && isArranca) {
        videoPrompt = `Talking head UGC video, Latino man in his 30s, Mexican-American, looking directly at camera, casual home background, natural window light, selfie-style smartphone vertical 9:16, authentic TikTok testimonial style, ${videoPrompt}, energetic and relatable, casual clothes`;
      } else if (!isUGC && videoPrompt && !videoPrompt.toLowerCase().includes('latino') && !videoPrompt.toLowerCase().includes('hispanic')) {
        videoPrompt = `Latino man in his 30s, Mexican-American, ${videoPrompt}`;
      }
      const body = { model: 'bytedance/seedance-2-fast', input: { prompt: videoPrompt, resolution: '720p', duration: 5 } };
      if (input.imagen_url) body.input.image_url = input.imagen_url;
      const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });
      if (!createRes.ok) return `❌ kie.ai video error ${createRes.status}: ${await createRes.text()}`;
      const createData = await createRes.json();
      if (createData.code !== 200) return `❌ kie.ai: ${createData.msg || JSON.stringify(createData)}`;
      const taskId = createData.data?.taskId;
      if (!taskId) return `❌ kie.ai sin taskId: ${JSON.stringify(createData)}`;
      if (onProgress) onProgress('\n⏳ Video en cola... (puede tardar 4-6 min)');
      for (let i = 0; i < 54; i++) {
        await new Promise(ok => setTimeout(ok, 10000));
        if (onProgress && i % 3 === 0) onProgress(`\n⏳ Generando video... ${Math.round((i + 1) * 10 / 60)} min`);
        const poll = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
          { headers: { 'Authorization': `Bearer ${KIE_KEY}` } });
        const pd = await poll.json();
        const state = pd.data?.state;
        if (state === 'success') {
          let videoUrl = null;
          try { videoUrl = JSON.parse(pd.data.resultJson).resultUrls?.[0]; } catch(_) {}
          if (!videoUrl) return `❌ Video generado pero sin URL. Raw: ${JSON.stringify(pd.data).slice(0,300)}`;
          await _saveToMediaLibrary(videoUrl, `Video ${new Date().toLocaleDateString('es-MX')} — ${(input.prompt||'').slice(0,40)}`, 'video', input.cliente || 'arranca');
          return `✅ Video generado con Seedance.\nURL: ${videoUrl}\n\nGuardado en Drive. Para publicar en Facebook usa publicar_blotato con esta URL como media_url.`;
        }
        if (state === 'fail') return `❌ Seedance falló: ${pd.data?.failMsg || 'error desconocido'}`;
      }
      return '❌ Timeout: Seedance tardó más de 9 minutos. Intenta de nuevo o usa generar_y_publicar para imagen primero.';
    }
    if (name === 'generar_y_publicar') {
      if (!BL_KEY) return '❌ BLOTATO_API_KEY no configurada en Railway (Dashboard service).';
      let imageUrl = null;
      let imageSource = '';
      const isArrancaImg = (input.cliente || 'arranca').toLowerCase().includes('arranca');
      if (isArrancaImg && input.prompt_imagen && !input.prompt_imagen.toLowerCase().includes('latino') && !input.prompt_imagen.toLowerCase().includes('hispanic')) {
        input.prompt_imagen = `Latino person, Mexican-American, 30s, authentic, relatable, professional — ${input.prompt_imagen}`;
      }
      if (process.env.HIGGSFIELD_API_KEY) {
        try {
          imageUrl = await _generarImagenHiggsfieldMCP(input.prompt_imagen);
          imageSource = 'Higgsfield';
          console.log('[generar_y_publicar] Higgsfield MCP OK:', imageUrl);
        } catch(e) {
          console.error('[generar_y_publicar] Higgsfield MCP falló:', e.message);
          imageUrl = null;
        }
      }
      if (!imageUrl) {
        const KIE_KEY = process.env.KIE_API_KEY;
        if (!KIE_KEY) return '❌ Sin imagen: HIGGSFIELD_AGENT_ID no configurado y KIE_API_KEY tampoco está.';
        const kieRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nano-banana-2', input: { prompt: input.prompt_imagen, aspect_ratio: '16:9', resolution: '1K' } }),
          signal: AbortSignal.timeout(30000)
        });
        if (!kieRes.ok) return `❌ kie.ai error ${kieRes.status}: ${await kieRes.text()}`;
        const kieData = await kieRes.json();
        if (kieData.code !== 200) return `❌ kie.ai: ${kieData.msg || JSON.stringify(kieData)}`;
        const taskId = kieData.data?.taskId;
        if (!taskId) return `❌ kie.ai sin taskId: ${JSON.stringify(kieData)}`;
        for (let i = 0; i < 30; i++) {
          await new Promise(ok => setTimeout(ok, 5000));
          const poll = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
            { headers: { 'Authorization': `Bearer ${KIE_KEY}` } });
          const pd = await poll.json();
          const state = pd.data?.state;
          if (state === 'success') {
            try { imageUrl = JSON.parse(pd.data.resultJson).resultUrls?.[0]; } catch(_) {}
            break;
          }
          if (state === 'fail') return `❌ kie.ai falló: ${pd.data?.failMsg || 'error desconocido'}`;
        }
        if (!imageUrl) return '❌ Timeout: kie.ai tardó más de 150 segundos.';
        imageSource = 'kie.ai';
      }
      const pageId = _resolvePageId(input.cliente);
      console.log('[generar_y_publicar] cliente:', input.cliente, '→ pageId:', pageId, '→ imageUrl:', imageUrl?.slice(0,80));
      if (!pageId) return `✅ Imagen (${imageSource}): ${imageUrl}\n❌ Cliente '${input.cliente}' no reconocido. Usa exactamente: arranca, arranca financial, red de salud hispana, horizon wound care, rg photo`;
      const pubRes = await fetch('https://backend.blotato.com/v2/posts',
        { method: 'POST', headers: { 'blotato-api-key': BL_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ post: { accountId: '32320', target: { targetType: 'facebook', pageId },
            content: { text: input.copy_post, platform: 'facebook', mediaUrls: [imageUrl] } } }) });
      const pubData = await pubRes.json();
      console.log('[blotato] status:', pubRes.status, JSON.stringify(pubData).slice(0, 300));
      if (!pubRes.ok) return `✅ Imagen (${imageSource}): ${imageUrl}\n❌ Blotato ${pubRes.status}: ${JSON.stringify(pubData).slice(0, 300)}`;
      if (SB_URL && SB_KEY) {
        const ck = (input.cliente || 'arranca').toLowerCase().trim();
        const firstWord = ck.split(/\s+/)[0];
        const memR = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }).catch(() => null);
        if (memR) {
          const memRows = await memR.json().catch(() => []);
          const clienteKey = memRows?.[0]?.cliente || ck;
          const datos = memRows?.[0]?.datos || {};
          const posts = datos.posts_publicados || [];
          posts.unshift({ fecha: new Date().toISOString(), copy: input.copy_post?.slice(0,200), imagen: imageUrl, post_id: pubData.postSubmissionId || pubData.id, fuente: imageSource });
          datos.posts_publicados = posts.slice(0, 20);
          datos.ultimo_post = new Date().toISOString();
          const method = memRows?.[0] ? 'PATCH' : 'POST';
          const url = memRows?.[0] ? `${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}` : `${SB_URL}/rest/v1/memoria_clientes`;
          const body = memRows?.[0] ? { datos } : { cliente: ck, datos };
          await fetch(url, { method, headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(() => {});
        }
      }
      await _saveToMediaLibrary(imageUrl, `Imagen ${new Date().toLocaleDateString('es-MX')} — ${(input.prompt_imagen||'').slice(0,40)}`, 'image', input.cliente || 'arranca');
      return `✅ Imagen generada (${imageSource}) y publicada en Facebook (${input.cliente}).\nPost ID: ${pubData.postSubmissionId || pubData.id || '✓'}\nImagen: ${imageUrl}`;
    }
    if (name === 'leer_memoria_cliente') {
      if (!SB_URL || !SB_KEY) return 'Supabase no configurado.';
      const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
      const ck = (input.cliente || '').toLowerCase().trim();
      let r = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(ck)}&select=cliente,datos`, { headers: sbHdr });
      let d = await r.json();
      if (!Array.isArray(d) || !d[0]) {
        const firstWord = ck.split(/\s+/)[0];
        r = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(firstWord)}*&select=cliente,datos`, { headers: sbHdr });
        d = await r.json();
      }
      if (!Array.isArray(d) || !d[0]) return `Sin memoria para '${input.cliente}'. Comparte la estrategia aquí para que pueda usarla.`;
      return `[Memoria de "${d[0].cliente}"]\n` + JSON.stringify(d[0].datos, null, 2).slice(0, 2000);
    }
    if (name === 'guardar_memoria') {
      if (!SB_URL || !SB_KEY) return 'Supabase no configurado.';
      const sbHdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
      const ck = (input.cliente || '').toLowerCase().trim();
      const existing = await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(ck.split(/\s+/)[0])}*&select=cliente,datos`, { headers: sbHdr });
      const rows = await existing.json();
      const clienteKey = rows?.[0]?.cliente || ck;
      const datosPrev = rows?.[0]?.datos || {};
      const datosNew = { ...datosPrev, ...input.datos, _actualizado: new Date().toISOString() };
      if (rows?.[0]) {
        await fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=eq.${encodeURIComponent(clienteKey)}`,
          { method: 'PATCH', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ datos: datosNew }) });
      } else {
        await fetch(`${SB_URL}/rest/v1/memoria_clientes`,
          { method: 'POST', headers: { ...sbHdr, Prefer: 'return=minimal' }, body: JSON.stringify({ cliente: ck, datos: datosNew }) });
      }
      return `✅ Memoria de "${clienteKey}" actualizada. Campos guardados: ${Object.keys(input.datos).join(', ')}`;
    }
    if (name === 'cargar_skill') {
      const nombres = Array.isArray(input.nombres) ? input.nombres : [input.nombre || input.nombres];
      const resultados = nombres.filter(Boolean).map(n => _cargarSkill(n));
      return resultados.join('\n\n---\n\n') || 'No se especificó ninguna skill.';
    }
    return `Herramienta '${name}' no implementada.`;
  } catch (e) { return `❌ Error en ${name}: ${e.message}`; }
}

module.exports = { _ejecutarHerramienta, _generarImagenHiggsfieldMCP, _parseMcpResponse };
