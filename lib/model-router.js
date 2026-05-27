#!/usr/bin/env node
/**
 * model-router.js
 * Router inteligente: Selecciona entre Haiku 4.5 (rápido) y Sonnet 4.6 (profundo)
 * basado en la complejidad del mensaje
 */

const fs = require('fs');
const path = require('path');

// Señales de complejidad
const COMPLEXITY_SIGNALS = {
  // Palabras que indican tarea SIMPLE
  simple: [
    'hola', 'ok', 'sí', 'no', 'gracias', 'bye', 'adiós',
    'publica', 'envía', 'guarda', 'borra', 'elimina',
    'abre', 'cierra', 've al', 've a', 'muestra',
    'ok', 'dale', 'listo', 'hecho', 'done'
  ],

  // Palabras que indican tarea COMPLEJA
  complex: [
    'analiza', 'análisis', 'estrategia', 'competencia', 'plan',
    'por qué', 'cómo', 'mejora', 'optimiza', 'optimización',
    'campaña', 'leads', 'conversión', 'presupuesto', 'presup',
    'target', 'segmento', 'benchmark', 'roi', 'kpi',
    'propuesta', 'propone', 'sugiere', 'sugiere', 'recomend',
    'evalúa', 'evalúe', 'compara', 'comparar', 'versus',
    'problema', 'solución', 'desafío', 'oportunidad',
    'profundiza', 'profundo', 'detallado', 'exhaustivo',
    'crear', 'diseña', 'desarrolla', 'escribe', 'redacta'
  ]
};

/**
 * Analiza un mensaje y retorna el modelo recomendado
 * @param {string} message - Mensaje del usuario
 * @returns {Object} { model, reason, complexity }
 */
function selectModel(message) {
  if (!message || typeof message !== 'string') {
    return {
      model: 'anthropic/claude-haiku-4-5-20251001',
      reason: 'Empty or invalid message',
      complexity: 'SIMPLE'
    };
  }

  const msgLower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  const sentenceCount = message.split(/[.!?]+/).length;
  const hasCode = /```|<|>|{|}|\[|\]/.test(message);
  const hasList = /^[\s]*[-*•]\s/m.test(message);

  // Contar señales de complejidad
  let simpleScore = 0;
  let complexScore = 0;

  COMPLEXITY_SIGNALS.simple.forEach(keyword => {
    if (msgLower.includes(keyword)) {
      simpleScore += 2;
    }
  });

  COMPLEXITY_SIGNALS.complex.forEach(keyword => {
    if (msgLower.includes(keyword)) {
      complexScore += 3;
    }
  });

  // Ajustes por características del mensaje
  if (wordCount < 15) simpleScore += 3;
  if (wordCount > 50) complexScore += 3;
  if (wordCount > 100) complexScore += 5;
  if (sentenceCount > 3) complexScore += 2;
  if (hasCode) complexScore += 5;
  if (hasList) complexScore += 2;

  // Decisión final
  const complexity = complexScore > simpleScore ? 'COMPLEX' : 'SIMPLE';
  
  if (complexity === 'SIMPLE') {
    return {
      model: 'anthropic/claude-haiku-4-5-20251001',
      reason: `Simple message (${wordCount} words, ${simpleScore} simple signals, ${complexScore} complex signals)`,
      complexity: 'SIMPLE',
      wordCount,
      scores: { simpleScore, complexScore }
    };
  } else {
    return {
      model: 'anthropic/claude-sonnet-4-6-20250514',
      reason: `Complex message (${wordCount} words, ${complexScore} complex signals, ${simpleScore} simple signals)`,
      complexity: 'COMPLEX',
      wordCount,
      scores: { simpleScore, complexScore }
    };
  }
}

/**
 * Actualiza config.yaml con el modelo seleccionado
 * @param {string} modelId - ID del modelo a usar
 */
function updateConfigModel(modelId) {
  const configPath = '/opt/data/config.yaml';
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Reemplaza la línea del modelo default
    const oldLine = /^\s*default:\s+anthropic\/claude-[a-z0-9-]+/m;
    const newLine = `  default: ${modelId}`;
    
    content = content.replace(oldLine, newLine);
    fs.writeFileSync(configPath, content, 'utf8');
    
    return { ok: true, path: configPath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Ejecuta Hermes CLI con el modelo seleccionado
 * @param {string} message - Mensaje del usuario
 * @param {Object} options - Opciones adicionales
 */
async function executeWithSelectedModel(message, options = {}) {
  const selection = selectModel(message);
  const { model, reason, complexity } = selection;

  // Log para debugging
  if (options.verbose) {
    console.error(`[ROUTER] ${complexity} task → ${model}`);
    console.error(`[ROUTER] Reason: ${reason}`);
  }

  // Actualizar config.yaml con el modelo seleccionado
  updateConfigModel(model);

  return {
    selectedModel: model,
    complexity,
    reason,
    selection
  };
}

/**
 * CLI: Usar como script
 * Usage: node model-router.js "Tu mensaje aquí"
 */
if (require.main === module) {
  const message = process.argv.slice(2).join(' ');
  const selection = selectModel(message);
  
  console.log(JSON.stringify(selection, null, 2));
}

module.exports = {
  selectModel,
  updateConfigModel,
  executeWithSelectedModel,
  COMPLEXITY_SIGNALS
};
