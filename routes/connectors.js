/**
 * CONNECTORS.js
 * 
 * Conecta múltiples canales (WhatsApp, Web, Telegram, Email) al Supercomputer.
 * Recibe mensajes de cualquier fuente → Supercomputer → Resultado automático
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WHATSAPP CONNECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Webhook de WhatsApp Business API
 * Configura en: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Este endpoint recibe mensajes de WhatsApp y los procesa automáticamente.
 */

router.post('/whatsapp/webhook', async (req, res) => {
  /**
   * WhatsApp envía webhooks cuando:
   * - Un cliente envía mensaje
   * - Cambios de estado del mensaje
   * - Llamadas entrantes
   */
  
  const { object, entry } = req.body;
  
  // Confirmación de webhook
  if (!entry) {
    return res.sendStatus(200);
  }
  
  try {
    entry.forEach(async (change) => {
      const changes = change.changes[0];
      const { value } = changes;
      const { messages, contacts } = value;
      
      if (!messages) return;
      
      messages.forEach(async (message) => {
        const {
          from,           // Número de WhatsApp del cliente
          type,           // text, image, video, document, etc
          text,
          image,
          video,
          document,
        } = message;
        
        // Extraer cliente ID desde WhatsApp
        const clientId = await getOrCreateClientFromWhatsApp(from, contacts?.[0]);
        
        let messageContent = '';
        
        if (type === 'text') {
          messageContent = text.body;
        } else if (type === 'image' && image?.caption) {
          messageContent = image.caption;
        } else if (type === 'video' && video?.caption) {
          messageContent = video.caption;
        } else if (type === 'document') {
          messageContent = document?.caption || 'Document sent';
        }
        
        if (!messageContent) return;
        
        // Enviar al Supercomputer
        await processThroughSupercomputer({
          client_id: clientId,
          message: messageContent,
          channel: 'whatsapp',
          whatsapp_number: from,
          original_message: message,
        });
        
        // Confirmar lectura
        await markMessageAsRead(from, message.id);
        
        // Respuesta automática
        await sendWhatsAppMessage(
          from,
          '⏳ Tu solicitud está siendo procesada. Te avisaré en unos minutos...'
        );
      });
    });
    
    res.sendStatus(200);
  } catch (error) {
    console.error('[WhatsApp Connector Error]', error);
    res.sendStatus(500);
  }
});

/**
 * Verificación de webhook (GET)
 * WhatsApp valida el webhook con esto
 */
router.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || 'rg-production-2026';
  
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEB FORM CONNECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/web/form', async (req, res) => {
  /**
   * Formulario en el dashboard o landing page
   * Recibe: nombre, email, mensaje, archivos
   */
  
  try {
    const {
      client_id,
      email,
      name,
      message,
      files = [],
      context = {},
    } = req.body;
    
    if (!email || !message) {
      return res.status(422).json({
        ok: false,
        error: 'email and message required',
      });
    }
    
    // Si no hay client_id, crear uno temporal
    const finalClientId = client_id || `web_${email.split('@')[0]}_${Date.now()}`;
    
    // Procesar a través del Supercomputer
    const result = await processThroughSupercomputer({
      client_id: finalClientId,
      message,
      channel: 'web_form',
      email,
      name,
      files,
      context,
    });
    
    return res.json({
      ok: true,
      job_id: result.job_id,
      status: 'processing',
      estimated_time: result.estimated_time,
      message: `Hola ${name || 'amigo'}! Tu solicitud está en proceso. Te notificaremos pronto.`,
    });
  } catch (error) {
    console.error('[Web Form Error]', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL CONNECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/email/process', async (req, res) => {
  /**
   * Procesa emails entrantes
   * Integrable con Gmail, Outlook, etc
   */
  
  try {
    const {
      from,
      to,
      subject,
      body,
      attachments = [],
    } = req.body;
    
    if (!from || !body) {
      return res.status(422).json({
        ok: false,
        error: 'from and body required',
      });
    }
    
    const clientId = await getOrCreateClientFromEmail(from);
    
    const result = await processThroughSupercomputer({
      client_id: clientId,
      message: `${subject}\n\n${body}`,
      channel: 'email',
      email: from,
      attachments,
    });
    
    return res.json({
      ok: true,
      job_id: result.job_id,
      status: 'processing',
    });
  } catch (error) {
    console.error('[Email Connector Error]', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TELEGRAM CONNECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/telegram/webhook', async (req, res) => {
  /**
   * Webhook de Telegram
   * Recibe mensajes de Telegram Bot
   */
  
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.sendStatus(200);
    }
    
    const {
      chat: { id: chatId, username, first_name },
      text,
      photo,
      video,
      document,
    } = message;
    
    const clientId = await getOrCreateClientFromTelegram(chatId, {
      username,
      first_name,
    });
    
    let messageContent = text || '';
    
    if (!messageContent && photo) {
      messageContent = 'Image sent (please describe what you need)';
    } else if (!messageContent && video) {
      messageContent = 'Video sent (please describe what you need)';
    } else if (!messageContent && document) {
      messageContent = 'Document sent (please describe what you need)';
    }
    
    if (!messageContent) {
      return res.sendStatus(200);
    }
    
    // Procesar
    await processThroughSupercomputer({
      client_id: clientId,
      message: messageContent,
      channel: 'telegram',
      telegram_chat_id: chatId,
      original_message: message,
    });
    
    // Confirmar lectura
    await sendTelegramMessage(
      chatId,
      '⏳ Tu solicitud está siendo procesada. Te avisaré pronto...'
    );
    
    res.sendStatus(200);
  } catch (error) {
    console.error('[Telegram Connector Error]', error);
    res.sendStatus(500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE: PROCESAMIENTO A TRAVÉS DEL SUPERCOMPUTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function processThroughSupercomputer(request) {
  /**
   * Función central que envía cualquier solicitud al Supercomputer
   * y luego entrega el resultado al cliente a través del mismo canal
   */
  
  const {
    client_id,
    message,
    channel,
    whatsapp_number,
    email,
    telegram_chat_id,
    context = {},
  } = request;
  
  try {
    // 1. Enviar al Supercomputer
    console.log(`[CONNECTOR] Routing to Supercomputer via ${channel}`);
    
    const supercomputerResponse = await fetch('http://localhost:8080/api/supercomputer/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id,
        message,
        budget: context.budget || 'unlimited',
        context: {
          ...context,
          source_channel: channel,
        },
      }),
    });
    
    const result = await supercomputerResponse.json();
    
    if (!result.ok) {
      throw new Error(result.error || 'Supercomputer processing failed');
    }
    
    console.log(`[CONNECTOR] Job created: ${result.job_id}`);
    
    // 2. Guardar conexión en base de datos para tracking
    await saveConnectorRecord({
      client_id,
      channel,
      job_id: result.job_id,
      whatsapp_number,
      email,
      telegram_chat_id,
      message,
      intent: result.intent,
      model: result.model,
      status: result.status,
    });
    
    // 3. Esperar resultado y entregar (en background)
    pollAndDeliverResult({
      job_id: result.job_id,
      channel,
      whatsapp_number,
      email,
      telegram_chat_id,
      client_id,
    }).catch((err) => {
      console.error('[CONNECTOR] Delivery error:', err);
    });
    
    return result;
  } catch (error) {
    console.error('[CONNECTOR] Supercomputer error:', error.message);
    
    // Notificar al usuario que hubo error
    if (whatsapp_number) {
      await sendWhatsAppMessage(
        whatsapp_number,
        `❌ Hubo un problema procesando tu solicitud: ${error.message}`
      );
    } else if (email) {
      await sendEmailNotification(
        email,
        'Error procesando tu solicitud',
        `Disculpa, hubo un problema: ${error.message}`
      );
    } else if (telegram_chat_id) {
      await sendTelegramMessage(
        telegram_chat_id,
        `❌ Error: ${error.message}`
      );
    }
    
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POLLING & DELIVERY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function pollAndDeliverResult({ job_id, channel, whatsapp_number, email, telegram_chat_id, client_id }) {
  /**
   * Espera el resultado del Supercomputer y lo entrega
   * por el canal de donde vino
   */
  
  let attempts = 0;
  const maxAttempts = 60; // 5 minutos máximo
  const pollInterval = 5000; // Cada 5 segundos
  
  const poll = setInterval(async () => {
    attempts++;
    
    try {
      // Consultar estado
      const statusRes = await fetch(
        `http://localhost:8080/api/supercomputer/status/${job_id}`
      );
      const status = await statusRes.json();
      
      if (status.status === 'completed' && status.result_url) {
        clearInterval(poll);
        
        // Enviar resultado por el canal correspondiente
        if (channel === 'whatsapp' && whatsapp_number) {
          await deliverViaWhatsApp(whatsapp_number, status.result_url, status);
        } else if (channel === 'email' && email) {
          await deliverViaEmail(email, status.result_url, status);
        } else if (channel === 'telegram' && telegram_chat_id) {
          await deliverViaTelegram(telegram_chat_id, status.result_url, status);
        } else if (channel === 'web_form') {
          await saveToDashboard(client_id, status.result_url, status);
        }
        
        console.log(`[CONNECTOR] Result delivered via ${channel}`);
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        console.error(`[CONNECTOR] Job ${job_id} timed out`);
      }
    } catch (error) {
      console.error(`[CONNECTOR] Poll error (attempt ${attempts}):`, error.message);
    }
  }, pollInterval);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELIVERY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function deliverViaWhatsApp(phoneNumber, resultUrl, metadata) {
  /**
   * Envía resultado por WhatsApp
   */
  const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
  const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  if (!WHATSAPP_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) return;
  
  try {
    const messageBody = `
✅ Tu contenido está listo!

📊 Detalles:
• Modelo usado: ${metadata.model}
• Intención detectada: ${metadata.intent}
• Enlace: ${resultUrl}

¿Quieres que lo suba a tus redes?
`.trim();

    await fetch(
      `https://graph.instagram.com/v18.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: messageBody },
        }),
      }
    );
  } catch (error) {
    console.error('[WhatsApp Delivery Error]', error.message);
  }
}

async function deliverViaEmail(emailAddress, resultUrl, metadata) {
  /**
   * Envía resultado por email
   */
  // TODO: Integrar con SendGrid, Resend, o similar
  console.log(`[Email Delivery] Would send to ${emailAddress}: ${resultUrl}`);
}

async function deliverViaTelegram(chatId, resultUrl, metadata) {
  /**
   * Envía resultado por Telegram
   */
  // TODO: Integrar con Telegram Bot API
  console.log(`[Telegram Delivery] Would send to ${chatId}: ${resultUrl}`);
}

async function saveToDashboard(clientId, resultUrl, metadata) {
  /**
   * Guarda resultado en el dashboard para que lo descargue el usuario
   */
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_downloads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        result_url: resultUrl,
        intent: metadata.intent,
        model: metadata.model,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[Dashboard Save Error]', error.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getOrCreateClientFromWhatsApp(phoneNumber, contact) {
  // TODO: Buscar en Supabase por teléfono, crear si no existe
  return `whatsapp_${phoneNumber}`;
}

async function getOrCreateClientFromEmail(email) {
  // TODO: Buscar en Supabase por email, crear si no existe
  return `email_${email.split('@')[0]}`;
}

async function getOrCreateClientFromTelegram(chatId, { username, first_name }) {
  // TODO: Buscar en Supabase por telegram_id, crear si no existe
  return `telegram_${username || chatId}`;
}

async function markMessageAsRead(phoneNumber, messageId) {
  // TODO: Implementar con WhatsApp API
}

async function sendWhatsAppMessage(phoneNumber, text) {
  // TODO: Implementar con WhatsApp API
  console.log(`[WhatsApp] ${phoneNumber}: ${text}`);
}

async function sendTelegramMessage(chatId, text) {
  // TODO: Implementar con Telegram Bot API
  console.log(`[Telegram] ${chatId}: ${text}`);
}

async function sendEmailNotification(email, subject, body) {
  // TODO: Implementar con SendGrid o similar
  console.log(`[Email] ${email}: ${subject}`);
}

async function saveConnectorRecord(data) {
  /**
   * Guarda historial de todas las conexiones y procesos
   */
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/connector_records`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[Connector Record Save Error]', error.message);
  }
}

module.exports = router;
