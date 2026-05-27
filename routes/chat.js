// routes/chat.js — /api/stream/organizador, /api/chat/*, /api/mensajes/organizador
const express = require('express');
const https   = require('https');
const router  = express.Router();
const { sbFetch } = require('../lib/db');
const { _ejecutarHerramienta } = require('../lib/tools');
const { _CATALOGO_SKILLS } = require('../lib/skills');

const CHAT_TARGETS = {
  organizador: 'http://168.231.66.172:8888/api/hermes/chat',  // ← Hermes local (VPS puerto 8888)
  director:    'https://agencia-ai-production.up.railway.app/director/chat',
  crew:        'https://worker-production-34f9.up.railway.app/crew/chat',
  estrategia:  'https://worker-production-035f.up.railway.app/estratega/chat',
  scheduler:   'https://worker-production-aa53.up.railway.app/scheduler/chat',
  analytics:   'https://agencia-ai-analytics-production.up.railway.app/analytics/chat',
  compositor:  'https://compositorbot-production.up.railway.app/compositor/chat',
  scraper:     'https://agencia-ai-scraper-production.up.railway.app/scraper/task',
  seo:         'https://agencia-ai-seo-production.up.railway.app/seo/task',
  web:         'https://agencia-ai-web-designer-production.up.railway.app/web/chat',
  motion:      'https://web-production-d67bad.up.railway.app/motion/chat',
};

const ORG_BASE = 'https://web-production-77871.up.railway.app';

const DEFAULT_PROFILES = {
  roberto_agencia: {
    nombre: 'Agencia AI — RG Production',
    servicio: 'Agencia de marketing digital con IA para negocios hispanos en USA. Producción audiovisual, automatización de leads y gestión de redes sociales.',
    publico_objetivo: 'Dueños de negocios hispanos en USA: coaches, médicos, concesionarios, educadores financieros.',
    tono: 'Directo, ejecutivo, orientado a resultados. Roberto toma decisiones rápidas.',
    agente_principal: 'Cerebro — CEO y Productor General de la agencia',
    clientes_activos: 'Arranca Financial (educación financiera, Turo). Nuevos clientes en onboarding.',
    dashboard: 'https://web-production-3d2c.up.railway.app',
    _fuente: 'perfil_base_servidor'
  },
  arranca: {
    nombre: 'Arranca Financial',
    servicio: 'Educación financiera para latinos en USA. Cursos de crédito, manejo de deuda, inversión, y generación de ingresos con Turo (renta de autos).',
    publico_objetivo: 'Latinos/hispanos en USA, 25-45 años, trabajadores que buscan salir de deudas, mejorar su crédito y crear ingresos adicionales.',
    tono: 'Motivacional, cercano, en español. Empoderador. Como un mentor de la comunidad.',
    redes: { facebook_page: 'Arranca Financial', blotato_account: '32320' },
    agente_voz: 'María — bot de llamadas Twilio+ElevenLabs que cierra leads. Proyecto: C:/ArrancaVoiceAgent',
    estrategia_contenido: '1-2 posts/día educativos. Temas: crédito, Turo, inversión básica, testimonios. CTA siempre: llamar a María o agendar consulta.',
    prompt_visual_base: 'SIEMPRE incluir en prompts de imagen/video: "Latino man or woman, Mexican-American, Hispanic, 30s, relatable, professional but approachable, real person not stock photo". NUNCA usar personajes que parezcan asiáticos, europeos o del sur de Asia.',
    historia_posts_recientes: 'Consultar historial de conversación para posts ya publicados esta sesión.',
    _fuente: 'perfil_base_servidor'
  }
};

router.get('/mensajes/organizador', (req, res) => {
  const clientId = req.query.client || 'roberto_agencia';
  const u = new URL(`${ORG_BASE}/organizador/mensajes/${encodeURIComponent(clientId)}`);
  const opts = { hostname: u.hostname, path: u.pathname, method: 'GET', timeout: 8000 };
  const pr = https.request(opts, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => { try { res.json(JSON.parse(d)); } catch(e) { res.json({ mensajes: [] }); } });
  });
  pr.on('error', () => res.json({ mensajes: [] }));
  pr.on('timeout', () => { pr.destroy(); res.json({ mensajes: [] }); });
  pr.end();
});

router.post('/stream/organizador', async (req, res) => {
  const { mensaje, message, cliente, client, historial = [] } = req.body;
  const msg      = mensaje || message || '';
  const clientId = cliente || client || 'roberto_agencia';
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const SB_URL = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
  const tok  = t => res.write(`data: ${JSON.stringify({ token: t })}\n\n`);
  const done = () => { res.write('data: [DONE]\n\n'); res.end(); };

  if (!ANTHROPIC_KEY) { tok('❌ ANTHROPIC_API_KEY no configurada en Railway.'); return done(); }

  try {
    const sbHdr = SB_URL && SB_KEY ? { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } : null;
    const clientKey = clientId.toLowerCase().trim();
    const clientFirstWord = clientKey.split(/\s+/)[0];

    let perfilCliente = '', persistedMsgs = [];
    if (sbHdr) {
      try {
        const [memRes, crmRes, histRes] = await Promise.all([
          fetch(`${SB_URL}/rest/v1/memoria_clientes?cliente=ilike.*${encodeURIComponent(clientFirstWord)}*&select=datos&limit=1`,
            { headers: sbHdr }),
          fetch(`${SB_URL}/rest/v1/clientes?user_id=eq.roberto_agencia&select=data`,
            { headers: sbHdr }),
          fetch(`${SB_URL}/rest/v1/chat_history?agent_id=eq.organizador&order=created_at.desc&limit=40&select=role,content`,
            { headers: sbHdr })
        ]);
        const [memData, crmData, histData] = await Promise.all([memRes.json(), crmRes.json(), histRes.json()]);
        const memoria = memData?.[0]?.datos;
        const crm = crmData?.[0]?.data?.clientes?.[clientId] || crmData?.[0]?.data?.clientes?.[clientKey];
        const fallback = DEFAULT_PROFILES[clientFirstWord] || DEFAULT_PROFILES[clientKey];
        if (memoria || crm || fallback) {
          perfilCliente = '\n\nPERFIL DEL CLIENTE ACTIVO:\n';
          if (crm) perfilCliente += JSON.stringify(crm, null, 2).slice(0, 1500);
          if (memoria) perfilCliente += '\n\nMEMORIA OPERATIVA:\n' + JSON.stringify(memoria, null, 2).slice(0, 1500);
          if (!memoria && !crm && fallback) perfilCliente += JSON.stringify(fallback, null, 2);
        }
        if (Array.isArray(histData) && histData.length > 0 && historial.length === 0) {
          persistedMsgs = histData.reverse();
        }
      } catch(_) {}
    }

    const hoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const systemPrompt = `Eres Cerebro — el CEO y Productor General de Agencia AI. Vives en el dashboard. Roberto te da dirección desde aquí.
Hoy es ${hoy}.
Tienes herramientas REALES que ejecutan acciones reales. NUNCA finjas haber hecho algo sin usar la herramienta.
Responde SIEMPRE en español.

MEMORIA ENTRE SESIONES: Tu historial de conversación está cargado. Si ya publicaste algo antes, aparece en el historial — no digas que no recuerdas.

REGLAS DE EJECUCIÓN (sin excepción):
1. EJECUTA con la herramienta. Nunca pidas confirmación antes de actuar.
2. "ok", "sí", "dale" → ejecuta de inmediato usando el contexto del historial.
3. Dato menor faltante → asume y ejecuta. Solo pregunta si es CRÍTICO e imposible de asumir.
4. PROHIBIDO decir "no tengo acceso a internet". TIENES buscar_web.
5. PROHIBIDO inventar resultados. Si falla una herramienta → di exactamente qué falló.
6. Cuando Roberto comparta estrategia o corrija algo → llama guardar_memoria DE INMEDIATO, no al final.
7. Si Roberto sube un documento → extrae lo importante y llama guardar_memoria antes de responder.

CÓMO USAR TUS ESPECIALISTAS:
Tienes un equipo de especialistas disponible via cargar_skill(). Úsalos así:

- Antes de escribir copy o estrategia → carga psicologia_venta + sleight_of_mouth
- Antes de escribir un script o historia → carga storytelling_master + story_persuasion
- Antes de diseñar un video o commercial → carga director_cine + storyboard_bong
- Antes de describir planos o imagen → carga cinematografia + zettl_estetica + master_shots
- Antes de diseñar audio/música → carga film_scoring + cinematic_audio_composer
- Antes de diseñar una campaña de marca → carga branding_estrategia + canales_publicidad
- Para ventas o cierre → carga sales_closer_elite + sleight_of_mouth

PIPELINE DE PRODUCCIÓN (para comerciales o campañas completas):
Fase 1 ESTRATEGA: carga psicologia_venta + sleight_of_mouth + storytelling_master → produce brief de campaña
Fase 2 GUIONISTA: carga story_persuasion + video_hypnotic_selling → produce script completo
Fase 3 DIRECTOR: carga director_cine + emotional_film_director + storyboard_bong → produce shot list y dirección
Fase 4 CINEMATÓGRAFO: carga cinematografia + zettl_estetica + master_shots → produce prompts visuales profesionales
Fase 5 COMPOSITOR: carga film_scoring + cinematic_audio_composer → produce dirección musical
Fase 6 PRODUCCIÓN: genera imágenes reales con generar_y_publicar → publica en redes

Para posts simples: escríbelo tú directamente cargando psicologia_venta + sleight_of_mouth.
NUNCA copies el mensaje del usuario como texto del post — escribe copy profesional.

REGLA DE PERSONAJES (CRÍTICA — sin excepción):
En TODOS los prompts de imagen o video para Arranca Financial: el personaje DEBE ser Latino/Hispanic/Mexican-American.
Siempre incluir: "Latino man or woman, Mexican-American, Hispanic, 30s, authentic, relatable, professional"
NUNCA generes personajes que parezcan asiáticos, del sur de Asia, europeos blancos, o de stock photo genérico.
El público de Arranca es hispano — el personaje que ven en el video/imagen debe verse como ellos.

CÓMO HACER UGC VIDEOS CON SEEDANCE:
UGC = User Generated Content. No es un clip cinematic — es alguien hablando a cámara como en TikTok/Reels.
Cuando Roberto pida "UGC video" o "video para redes", el prompt de Seedance DEBE incluir:
- "talking head video, person looking directly at camera"
- "selfie-style, smartphone camera, vertical frame 9:16"
- "casual home or office background, natural lighting"
- "UGC content, authentic testimonial style, TikTok style"
- "Latino man [o woman], Mexican-American, 30s, casual clothes"
- PLUS el mensaje que da: ej. "speaking about how he improved his credit score from 520 to 720"

Ejemplo de prompt UGC correcto para Arranca:
"Talking head UGC video, Latino man in his 30s, Mexican-American, looking directly at camera, casual living room background, natural window light, selfie-style smartphone camera, vertical 9:16, authentic testimonial, speaking about improving credit score and building wealth, TikTok style, relatable and energetic, casual clothes"

NUNCA generes un prompt genérico que salga una escena cinematic o un hombre estático sonriendo.

${_CATALOGO_SKILLS}

CICLO DE LA AGENCIA POR CLIENTE:
Tú produces el contenido → se publica → genera leads → los leads llaman al agente de voz (ej: María para Arranca Financial) → María cierra → el resultado alimenta la siguiente campaña.
Cada cliente tiene su perfil, su voz de marca, sus objetivos y su agente de voz específico.

CLIENTE ACTIVO: ${clientId}
${perfilCliente ? `El perfil ya está cargado arriba — NO pidas que Roberto lo repita. Úsalo directamente.\nSi aprendes algo nuevo sobre el cliente → llama guardar_memoria de inmediato.` : `Llama leer_memoria_cliente con cliente="${clientId}" al inicio. Si el DB regresa vacío, procede con lo que sabes del contexto — NUNCA pidas que Roberto repita el perfil del cliente.`}${perfilCliente}`;

    const tools = [
      { name: 'buscar_web', description: 'Busca en internet. Úsalo para competencia, tendencias, mercados.',
        input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'fetch_url', description: 'Lee texto plano de una URL. Sin diseño visual.',
        input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
      { name: 'publicar_blotato', description: 'Publica post en Facebook del cliente via Blotato.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string' }, texto: { type: 'string' },
          media_url: { type: 'string' }, programado_iso: { type: 'string' }
        }, required: ['cliente', 'texto'] } },
      { name: 'generar_video', description: 'Genera video con Seedance (kie.ai). Úsalo cuando pidan video, animación o UGC.',
        input_schema: { type: 'object', properties: {
          prompt: { type: 'string', description: 'Descripción del video en inglés' },
          imagen_url: { type: 'string', description: 'URL de imagen base para animar (opcional)' },
          cliente: { type: 'string' }
        }, required: ['prompt'] } },
      { name: 'generar_y_publicar', description: 'Genera imagen con kie.ai y la publica en Facebook en un paso.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string' }, prompt_imagen: { type: 'string', description: 'Descripción visual (inglés recomendado)' },
          copy_post: { type: 'string', description: 'Texto del post de Facebook' }
        }, required: ['cliente', 'prompt_imagen', 'copy_post'] } },
      { name: 'leer_memoria_cliente', description: 'Lee datos del cliente desde la base de datos.',
        input_schema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
      { name: 'guardar_memoria', description: 'Guarda o actualiza datos del cliente en la base de datos. Úsalo cuando Roberto corrija algo, comparta estrategia, o cuando aprendas algo nuevo del cliente. También úsalo para corregir tus propios errores anteriores.',
        input_schema: { type: 'object', properties: {
          cliente: { type: 'string', description: 'Nombre del cliente' },
          datos: { type: 'object', description: 'Objeto con los datos a guardar/actualizar. Se mezcla con la memoria existente.' }
        }, required: ['cliente', 'datos'] } },
      { name: 'cargar_skill', description: 'Carga el conocimiento de uno o varios especialistas. Úsalo ANTES de producir contenido profesional. Puedes cargar múltiples skills a la vez pasando un array en "nombres".',
        input_schema: { type: 'object', properties: {
          nombre:  { type: 'string', description: 'Nombre de una sola skill (ej: "psicologia_venta")' },
          nombres: { type: 'array', items: { type: 'string' }, description: 'Array de skills a cargar juntas (ej: ["director_cine","storyboard_bong"])' }
        } } },
    ];

    const frontendMsgs = historial.map(h => ({ role: h.role, content: h.content }));
    const allMsgs = persistedMsgs.length > 0
      ? [...persistedMsgs.map(h => ({ role: h.role, content: String(h.content).slice(0, 800) })), ...frontendMsgs]
      : frontendMsgs;

    const lastMsg = allMsgs[allMsgs.length - 1];
    const messages = (lastMsg?.role === 'user' && lastMsg?.content === msg)
      ? allMsgs
      : [...allMsgs, { role: 'user', content: msg }];

    let fullResponse = '';
    let continueLoop = true;

    while (continueLoop) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system: systemPrompt, tools, messages, stream: true })
      });
      if (!claudeRes.ok) { tok(`❌ Error Claude API: ${(await claudeRes.text()).slice(0, 200)}`); return done(); }

      const reader  = claudeRes.body.getReader();
      const decoder = new TextDecoder();
      let sseBuf = '', curTool = null, toolBlocks = [], stopReason = null, iterText = '';

      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        sseBuf += decoder.decode(value, { stream: true });
        const lines = sseBuf.split('\n'); sseBuf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let evt; try { evt = JSON.parse(line.slice(6)); } catch(_) { continue; }
          if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use')
            curTool = { id: evt.content_block.id, name: evt.content_block.name, rawInput: '' };
          else if (evt.type === 'content_block_delta') {
            if (evt.delta?.type === 'text_delta') { iterText += evt.delta.text; fullResponse += evt.delta.text; tok(evt.delta.text); }
            else if (evt.delta?.type === 'input_json_delta' && curTool) curTool.rawInput += evt.delta.partial_json;
          } else if (evt.type === 'content_block_stop' && curTool) {
            try { curTool.input = JSON.parse(curTool.rawInput); } catch(_) { curTool.input = {}; }
            toolBlocks.push(curTool); curTool = null;
          } else if (evt.type === 'message_delta') stopReason = evt.delta?.stop_reason;
        }
      }

      if (stopReason === 'tool_use' && toolBlocks.length > 0) {
        const aContent = [];
        if (iterText) aContent.push({ type: 'text', text: iterText });
        for (const tb of toolBlocks) aContent.push({ type: 'tool_use', id: tb.id, name: tb.name, input: tb.input });
        messages.push({ role: 'assistant', content: aContent });
        const toolResults = [];
        for (const tb of toolBlocks) {
          tok(`\n\n🔧 *${tb.name}*...`);
          const result = await _ejecutarHerramienta(tb.name, tb.input, tok);
          toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: result });
        }
        messages.push({ role: 'user', content: toolResults });
        toolBlocks = []; iterText = '';
      } else { continueLoop = false; }
    }

    if (SB_URL && SB_KEY && msg && fullResponse) {
      fetch(`${SB_URL}/rest/v1/chat_history`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify([
          { agent_id: 'organizador', user_id: 'roberto', role: 'user',      content: msg,          created_at: new Date().toISOString() },
          { agent_id: 'organizador', user_id: 'roberto', role: 'assistant', content: fullResponse, created_at: new Date().toISOString() }
        ])
      }).catch(() => {});
    }
    done();
  } catch (e) { tok(`\n❌ Error interno: ${e.message}`); done(); }
});

router.get('/chat/history', async (req, res) => {
  try {
    const { agent_id, user_id = 'roberto', limit = 40 } = req.query;
    let path = `/chat_history?user_id=eq.${encodeURIComponent(user_id)}&order=created_at.asc&limit=${limit}`;
    if (agent_id) path += `&agent_id=eq.${encodeURIComponent(agent_id)}`;
    const r = await sbFetch(path, { prefer: 'return=representation' });
    const rows = await r.json();
    if (!r.ok) return res.json({ ok: false, error: rows });
    res.json({ ok: true, messages: rows });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/chat/history', async (req, res) => {
  try {
    const { user_id = 'roberto', agent_id, messages = [] } = req.body;
    if (!agent_id || !messages.length) return res.json({ ok: true });
    const rows = messages.map(m => ({ user_id, agent_id, role: m.role, content: m.content }));
    const r = await sbFetch('/chat_history', {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'return=minimal',
    });
    if (!r.ok) { const e = await r.text(); return res.json({ ok: false, error: e }); }
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.delete('/chat/history', async (req, res) => {
  try {
    const { agent_id, user_id = 'roberto' } = req.query;
    let path = `/chat_history?user_id=eq.${encodeURIComponent(user_id)}`;
    if (agent_id) path += `&agent_id=eq.${encodeURIComponent(agent_id)}`;
    const r = await sbFetch(path, { method: 'DELETE', prefer: 'return=minimal' });
    res.json({ ok: r.ok });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

// Wildcard agentId — must be after /chat/history to avoid capturing 'history' as agentId
router.post('/chat/:agentId', (req, res) => {
  const target = CHAT_TARGETS[req.params.agentId];
  if (!target) return res.status(404).json({ response: 'Agente no encontrado.' });
  const payload = Object.assign({}, req.body);
  if (payload.message && !payload.mensaje) payload.mensaje = payload.message;
  if (payload.client && !payload.cliente) payload.cliente = payload.client;
  if (payload.client) payload.cliente_id = payload.client;
  const body = JSON.stringify(payload);
  const u = new URL(target);
  const opts = {
    hostname: u.hostname, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    timeout: 120000,
  };
  const pr = https.request(opts, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const json = JSON.parse(d);
        const normalized = json.response || json.respuesta || json.reply || json.message || json.content;
        if (normalized !== undefined) json.response = normalized;
        res.status(r.statusCode < 400 ? 200 : r.statusCode).json(json);
      } catch(e) {
        if (r.statusCode === 404 || r.statusCode === 405) {
          res.json({ response: 'El agente está en línea pero aún no tiene endpoint de chat. Contáctalo vía Telegram.' });
        } else {
          res.status(500).json({ response: 'Error del agente: ' + d.slice(0, 200) });
        }
      }
    });
  });
  pr.on('error', e => res.json({ response: 'Agente no disponible: ' + e.message }));
  pr.on('timeout', () => { pr.destroy(); res.json({ response: 'El agente tardó demasiado en responder. Intenta de nuevo.' }); });
  pr.write(body);
  pr.end();
});

module.exports = router;
