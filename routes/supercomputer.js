/**
 * SUPERCOMPUTER.js
 * 
 * El cerebro central de RG Production.
 * Toma cualquier petición de cliente → intención → modelo óptimo → resultado.
 * 
 * Arquitectura:
 * 1. INTENT CLASSIFIER: ¿Qué quiere el cliente realmente?
 * 2. MODEL ROUTER: ¿Qué modelo es mejor para esto?
 * 3. EXECUTION ENGINE: Ejecuta con Higgsfield/kie.ai
 * 4. MEMORY: Aprende de resultados
 * 5. DELIVERY: Sube a redes, Google Drive, Supabase
 */

const hermesBlotatoIntegration = require('../lib/hermes-blotato-integration');

// ... (resto del código)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 1: INTENT CLASSIFIER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const INTENTS = {
  VIDEO: 'video',           // "Necesito un video para TikTok"
  IMAGE: 'image',           // "Diseña una portada para Facebook"
  COPY: 'copy',             // "Escribe copy persuasivo"
  STRATEGY: 'strategy',     // "¿Cómo hago marketing?"
  ANALYSIS: 'analysis',     // "Analiza mi competencia"
  UNKNOWN: 'unknown'
};

async function classifyIntent(userMessage) {
  /**
   * Clasifica la intención del usuario sin llamar LLM (por velocidad).
   * Si es muy complejo, usa Claude Haiku.
   */
  const msg = userMessage.toLowerCase();
  
  // Pattern matching rápido
  if (msg.includes('video') || msg.includes('tiktok') || msg.includes('youtube') || msg.includes('reel')) {
    return { intent: INTENTS.VIDEO, confidence: 0.95 };
  }
  if (msg.includes('imagen') || msg.includes('portada') || msg.includes('diseño') || msg.includes('foto')) {
    return { intent: INTENTS.IMAGE, confidence: 0.95 };
  }
  if (msg.includes('copy') || msg.includes('texto') || msg.includes('descripción') || msg.includes('persuasivo')) {
    return { intent: INTENTS.COPY, confidence: 0.95 };
  }
  if (msg.includes('competencia') || msg.includes('análisis') || msg.includes('analizar')) {
    return { intent: INTENTS.ANALYSIS, confidence: 0.95 };
  }
  if (msg.includes('estrategia') || msg.includes('marketing') || msg.includes('campaña') || msg.includes('plan')) {
    return { intent: INTENTS.STRATEGY, confidence: 0.90 };
  }
  
  return { intent: INTENTS.UNKNOWN, confidence: 0.5 };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 2: MODEL ROUTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MODEL_MAP = {
  // VIDEO GENERATION
  [INTENTS.VIDEO]: {
    primary: 'seedance_2_0',      // Identidad fuerte, referencia-driven
    secondary: 'kling3_0',        // Multi-shot, movimiento fluido
    fallback: 'cinematic_studio_3_0',
    cost_per: 10, // credits
  },
  
  // IMAGE GENERATION
  [INTENTS.IMAGE]: {
    primary: 'nano_banana_2',     // Rápido, económico, bueno para anuncios
    secondary: 'flux_pro',        // Calidad máxima si budget lo permite
    fallback: 'gpt_image_2',
    cost_per: 2,
  },
  
  // COPY GENERATION
  [INTENTS.COPY]: {
    primary: 'claude_3_5_sonnet',  // Mejor para persuasión
    secondary: 'claude_3_haiku',   // Si presupuesto limitado
    fallback: 'gpt_4o',
    cost_per: 0.5,
  },
  
  // ANALYSIS
  [INTENTS.ANALYSIS]: {
    primary: 'claude_3_5_sonnet',
    secondary: 'gpt_4o',
    fallback: 'claude_3_haiku',
    cost_per: 1,
  },
  
  // STRATEGY
  [INTENTS.STRATEGY]: {
    primary: 'claude_3_5_sonnet',
    secondary: 'claude_3_haiku',
    fallback: 'gpt_4o',
    cost_per: 1.5,
  },
};

async function selectBestModel(intent, budget = 'unlimited', context = {}) {
  /**
   * Selecciona el mejor modelo basado en:
   * - Intención del usuario
   * - Budget disponible
   * - Contexto del cliente
   * - Velocidad requerida
   */
  const models = MODEL_MAP[intent] || MODEL_MAP[INTENTS.UNKNOWN];
  
  // Si presupuesto es limitado, usa fallback más barato
  if (budget === 'limited' && models.cost_per > 5) {
    return models.secondary || models.fallback;
  }
  
  return models.primary;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 3: EXECUTION ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function executeWithHiggsfield(model, prompt, params = {}) {
  /**
   * Ejecuta generación con Higgsfield MCP
   * Soporta: imagen, video, audio
   */
  const HIGGSFIELD_TOKEN = process.env.HIGGSFIELD_API_KEY;
  
  if (!HIGGSFIELD_TOKEN) {
    throw new Error('HIGGSFIELD_API_KEY not configured');
  }
  
  try {
    const endpoint = model.includes('video') ? '/generate_video' : '/generate_image';
    
    const response = await fetch(`https://api.higgsfield.ai/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIGGSFIELD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        ...params,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Higgsfield error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Higgsfield execution failed:', error.message);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 4: MEMORY ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveToMemory(clientId, request, result, performance) {
  /**
   * Guarda en Supabase para aprendizaje futuro:
   * - Qué funcionó
   * - Qué no
   * - Patrones por cliente
   */
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  
  try {
    const record = {
      client_id: clientId,
      intent: request.intent,
      model_used: request.model,
      prompt: request.prompt,
      result_url: result.url,
      performance_score: performance.score,
      timestamp: new Date().toISOString(),
    };
    
    await fetch(`${SUPABASE_URL}/rest/v1/supercomputer_memory`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    
    return record;
  } catch (error) {
    console.error('Memory save failed:', error.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 5: DELIVERY ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function deliverResult(result, delivery = {}, clientContext = {}) {
  /**
   * Entrega resultado via Hermes CLI + Blotato MCP
   * 
   * Blotato MCP tools disponibles via hermes:
   * - blotato:create_post
   * - blotato:schedule_post
   * - blotato:upload_media
   * - blotato:get_platforms
   * - blotato:get_schedule_slots
   */
  
  const delivered = {
    google_drive: false,
    youtube: false,
    instagram: false,
    tiktok: false,
    facebook: false,
  };
  
  if (!result.url) return delivered;
  
  try {
    // Usar Hermes CLI + Blotato MCP para publicar
    const publishResult = await hermesBlotatoIntegration.publishAsync({
      clientId: clientContext.client_id,
      caption: buildBlotatoCaption(clientContext),
      mediaUrl: result.url,
      platforms: delivery.platforms || ['facebook', 'instagram', 'tiktok'],
    });
    
    if (publishResult.ok) {
      delivered.facebook = true;
      delivered.instagram = true;
      delivered.tiktok = true;
      console.log('[DELIVERY] ✅ Blotato MCP integration successful');
    }
    
  } catch (error) {
    console.error('[DELIVERY] Error:', error.message);
  }
  
  return delivered;
}

function buildBlotatoCaption(context) {
  /**
   * Construye caption profesional para publicación
   */
  const { business_name, target_audience, intent } = context;
  
  const captions = {
    video: `🎬 Nuevo video creado para ${business_name || 'nuestro negocio'}.\n\nPerfecto para ${target_audience || 'tu audiencia'}. 📲\n\n#Marketing #Video #AgenciaAI`,
    image: `📸 Diseño profesional para ${business_name || 'nuestro negocio'}.\n\nListo para convertir. 💯\n\n#Diseño #Marketing #Publicidad`,
    copy: `✍️ Copy persuasivo creado por IA.\n\n${business_name || 'Comparte'} el poder de las palabras. 🚀\n\n#Copywriting #Marketing #Ventas`,
  };
  
  return captions[intent] || captions.video;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC API: SUPERCOMPUTER ENDPOINT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/process', async (req, res) => {
  /**
   * Entrada única al Supercomputer.
   * 
   * Request:
   * {
   *   client_id: "arranca_financial_xyz",
   *   message: "Necesito un video para TikTok sobre cómo ahorrar",
   *   budget: "unlimited" | "limited",
   *   context: { business_name, industry, target_audience, etc }
   * }
   * 
   * Response:
   * {
   *   ok: true,
   *   job_id: "uuid",
   *   intent: "video",
   *   model: "seedance_2_0",
   *   status: "processing",
   *   estimated_time: 120,
   *   result_url: "https://cdn.higgsfield.ai/...",
   *   delivery: { google_drive: true, youtube: false, ... }
   * }
   */
  
  try {
    const { client_id, message, budget = 'unlimited', context = {} } = req.body;
    
    if (!client_id || !message) {
      return res.status(422).json({
        ok: false,
        error: 'client_id and message are required',
      });
    }
    
    // STAGE 1: Clasificar intención
    const { intent, confidence } = await classifyIntent(message);
    console.log(`[SUPERCOMPUTER] Intent: ${intent} (confidence: ${confidence})`);
    
    // STAGE 2: Seleccionar modelo
    const model = await selectBestModel(intent, budget, context);
    console.log(`[SUPERCOMPUTER] Model selected: ${model}`);
    
    // STAGE 3: Preparar prompt
    const prompt = buildPrompt(intent, message, context);
    console.log(`[SUPERCOMPUTER] Prompt: ${prompt.substring(0, 100)}...`);
    
    // STAGE 4: Ejecutar
    console.log(`[SUPERCOMPUTER] Executing with model ${model}...`);
    const result = await executeWithHiggsfield(model, prompt, {
      count: 1,
      aspect_ratio: context.aspect_ratio || '16:9',
    });
    
    // STAGE 5: Guardar en memoria
    await saveToMemory(client_id, {
      intent,
      model,
      prompt,
    }, result, {
      score: confidence * 100,
    });
    
    // STAGE 6: Entregar
    const delivery = await deliverResult(result, context.delivery, {
      client_id,
      ...context,
      intent,
    });
    
    return res.json({
      ok: true,
      job_id: result.job_id || result.id,
      intent,
      model,
      confidence,
      status: 'processing',
      estimated_time: getEstimatedTime(model),
      result_url: result.url || result.result_url,
      delivery,
    });
    
  } catch (error) {
    console.error('[SUPERCOMPUTER] Error:', error.message);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildPrompt(intent, userMessage, context) {
  /**
   * Construye prompt optimizado según intención.
   * Incluye: pain point, desired outcome, style, quality.
   */
  
  const { business_name, industry, target_audience, style } = context;
  
  const prompts = {
    [INTENTS.VIDEO]: `
      Create a professional marketing video for ${business_name || 'a business'}.
      User request: ${userMessage}
      Target audience: ${target_audience || 'general'}
      Style: ${style || 'modern, engaging, professional'}
      Duration: 30-60 seconds
      Platform: TikTok/Instagram Reels compatible
      Key objective: Increase sales and engagement
      Tone: Persuasive but authentic
    `,
    
    [INTENTS.IMAGE]: `
      Design a high-converting social media image for ${business_name || 'a business'}.
      User request: ${userMessage}
      Target audience: ${target_audience || 'general'}
      Style: ${style || 'modern, eye-catching, professional'}
      Quality: High resolution, ready for immediate posting
      Key objective: Drive clicks and conversions
    `,
    
    [INTENTS.COPY]: `
      Write persuasive sales copy for ${business_name || 'a business'}.
      User request: ${userMessage}
      Target audience: ${target_audience || 'general'}
      Tone: ${style || 'professional, persuasive, conversational'}
      Key objective: Overcome objections and drive action
      Length: Optimized for platform
    `,
    
    [INTENTS.ANALYSIS]: `
      Analyze competition and market for ${business_name || 'a business'}.
      User request: ${userMessage}
      Focus areas: Strategy, positioning, gaps, opportunities
      Output: Actionable insights with specific recommendations
    `,
    
    [INTENTS.STRATEGY]: `
      Create marketing strategy for ${business_name || 'a business'}.
      User request: ${userMessage}
      Target audience: ${target_audience || 'general'}
      Deliverable: Step-by-step action plan with metrics
      Timeline: 30/60/90 days
    `,
  };
  
  return prompts[intent] || prompts[INTENTS.UNKNOWN] || userMessage;
}

function getEstimatedTime(model) {
  /**
   * Retorna tiempo estimado en segundos según modelo.
   */
  const times = {
    'nano_banana_2': 15,
    'nano_banana_flash': 10,
    'flux_pro': 45,
    'gpt_image_2': 30,
    'seedance_2_0': 120,
    'kling3_0': 150,
    'cinematic_studio_3_0': 180,
    'claude_3_5_sonnet': 5,
    'claude_3_haiku': 3,
    'gpt_4o': 8,
  };
  
  return times[model] || 60;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MONITORING & DEBUG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/status/:job_id', async (req, res) => {
  /**
   * Chequea estado de un trabajo en progreso.
   */
  const { job_id } = req.params;
  
  try {
    // TODO: Consultar Higgsfield status API
    res.json({
      job_id,
      status: 'processing',
      progress: 45,
      estimated_time_remaining: 75,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/memory/:client_id', async (req, res) => {
  /**
   * Retorna historial de procesamiento para un cliente.
   * Útil para ver patrones, qué funcionó, etc.
   */
  const { client_id } = req.params;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.json({ memory: [] });
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/supercomputer_memory?client_id=eq.${client_id}&order=timestamp.desc&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    const memory = await response.json();
    res.json({ client_id, memory: Array.isArray(memory) ? memory : [] });
  } catch (error) {
    res.json({ client_id, memory: [], error: error.message });
  }
});

module.exports = router;
