// routes/mcp.js — GET/POST /mcp (MCP server protocol for Hermes Agent & Claude Code)
const express = require('express');
const router  = express.Router();
const { _ejecutarHerramienta } = require('../lib/tools');

const MCP_TOOLS = [
  { name: 'generar_y_publicar', description: 'Genera imagen con IA y publica en Facebook para un cliente. Devuelve URL de imagen y Post ID.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, prompt_imagen: { type: 'string', description: 'Descripción visual en inglés' }, copy_post: { type: 'string', description: 'Texto del post en español' } }, required: ['cliente', 'prompt_imagen', 'copy_post'] } },
  { name: 'generar_video', description: 'Genera video UGC con Seedance (kie.ai). Modelo: bytedance/seedance-2-fast. Tarda 4-6 min.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, cliente: { type: 'string' }, imagen_url: { type: 'string' } }, required: ['prompt'] } },
  { name: 'publicar_blotato', description: 'Publica texto y/o media en Facebook via Blotato.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, texto: { type: 'string' }, media_url: { type: 'string' } }, required: ['cliente', 'texto'] } },
  { name: 'leer_memoria_cliente', description: 'Lee perfil y memoria operativa del cliente desde Supabase.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
  { name: 'guardar_memoria', description: 'Guarda o actualiza datos del cliente en Supabase.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' }, datos: { type: 'object' } }, required: ['cliente', 'datos'] } },
  { name: 'listar_media', description: 'Lista videos e imágenes generadas recientemente para un cliente.', inputSchema: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] } },
];

router.post('/', async (req, res) => {
  const { method, id, params } = req.body || {};
  res.setHeader('Content-Type', 'application/json');
  if (method === 'initialize') {
    return res.json({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'agencia-dashboard', version: '1.0.0' } } });
  }
  if (method === 'tools/list') {
    return res.json({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } });
  }
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const result = await _ejecutarHerramienta(name, args || {});
      return res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: result }] } });
    } catch(e) {
      return res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: e.message } });
    }
  }
  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

router.get('/', (req, res) => {
  res.json({ name: 'agencia-dashboard', version: '1.0.0', tools: MCP_TOOLS.map(t => t.name) });
});

module.exports = router;
