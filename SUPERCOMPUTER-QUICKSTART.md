# 🤖 SUPERCOMPUTER — Guía Rápida

**El cerebro central de RG Production. Genera cualquier contenido y lo publica automáticamente.**

---

## **1️⃣ INSTALACIÓN (2 minutos)**

### Opción A: Local (Development)
```bash
cd /opt/hermes/dashboard
npm install
npm run dev
# Abre: http://localhost:8080
```

### Opción B: Railway (Production)
```bash
# Ya está deploying automáticamente
# En 5-10 minutos estará en vivo en Railway
# Abre: https://tu-app-railway.up.railway.app
```

---

## **2️⃣ USAR SUPERCOMPUTER**

### **Opción A: Web Form (Fácil)**
1. Abre http://localhost:8080/supercomputer-ui.html
2. Rellena:
   - Cliente: Arranca Financial
   - Solicitud: "Necesito un video para TikTok..."
   - Presupuesto: Máxima calidad
3. Click **"⚡ Processar"**
4. Espera 2-5 minutos
5. ✅ Tu video/imagen está listo
6. Click **"📤 Subir a redes"** → Se publica automáticamente en Facebook/Instagram/TikTok vía Blotato

### **Opción B: WhatsApp (Automático)**
1. Configura webhook de WhatsApp (ver sección abajo)
2. Envía mensaje: `"Necesito un video para TikTok..."`
3. Supercomputer recibe → procesa → responde con resultado
4. Automáticamente se publica en tus redes

### **Opción C: Email (Profesional)**
```
To: supercomputer@tudominio.com
Subject: Video para TikTok

Necesito un video profesional de 30 segundos
para mi negocio de asesoría financiera.
Dirigido a millennials argentinos.
```

---

## **3️⃣ CÓMO FUNCIONA INTERNAMENTE**

```
Cliente envía solicitud
    ↓
[1] INTENT CLASSIFIER
    ¿Es VIDEO, IMAGE, COPY, STRATEGY, ANALYSIS?
    ↓
[2] MODEL ROUTER
    VIDEO → Seedance 2.0 (mejor identidad)
    IMAGE → Nano Banana (rápido)
    COPY → Claude Sonnet (persuasión)
    ↓
[3] EXECUTION ENGINE
    Ejecuta con Higgsfield MCP
    ↓
[4] MEMORY ENGINE
    Guarda en Supabase qué funcionó
    ↓
[5] DELIVERY ENGINE
    Envía a Blotato → Facebook/Instagram/TikTok
    ↓
✅ Resultado publicado automáticamente
```

---

## **4️⃣ CONFIGURAR WHATSAPP (Opcional)**

### a) Obtener credenciales
1. Ve a https://developers.facebook.com/apps/
2. Crea app → "WhatsApp Business API"
3. Copia token y business account ID

### b) Agregar a .env
```bash
# En /opt/data/.env
WHATSAPP_API_TOKEN=your_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_WEBHOOK_TOKEN=rg-production-2026
```

### c) Configurar webhook en Facebook
- URL: `https://tu-app.railway.app/api/connectors/whatsapp/webhook`
- Token: `rg-production-2026`
- Events: `messages`, `message_status`

### d) Listo!
- Clientes pueden enviar mensajes a tu WhatsApp
- Supercomputer responde automáticamente
- Resultado se publica en sus redes

---

## **5️⃣ MONITOREAR CON ANALYTICS**

**Dashboard en tiempo real:**
- Jobs procesados: Total de solicitudes
- Intención más común: VIDEO? IMAGE?
- Modelo favorito: Cuál se usa más
- Tiempo promedio: Velocidad de ejecución

```bash
# Ver historial de un cliente
curl http://localhost:8080/api/supercomputer/memory/arranca_financial_moxod0x7
```

---

## **6️⃣ PERSONALIZACIÓN POR CLIENTE**

Cada cliente puede tener:
- **Estilo preferido**: Moderno, corporativo, casual
- **Audiencia objetivo**: Millennials, padres, ejecutivos
- **Plataforma favorita**: YouTube, TikTok, Instagram
- **Presupuesto**: Máxima calidad vs rápido+económico

El Supercomputer **aprende** y usa eso para futuras solicitudes.

---

## **7️⃣ PRECIOS (Estimado)**

| Tipo | Modelo | Costo | Tiempo |
|------|--------|-------|--------|
| Video 30-60s | Seedance 2.0 | $10 credits | 2-3 min |
| Imagen 4K | Nano Banana | $2 credits | 20 sec |
| Copy persuasivo | Claude Sonnet | $0.50 credits | 5 sec |
| Análisis estrategia | Claude Sonnet | $1 credit | 10 sec |

**Tu plan Higgsfield (Ultra Anual):**
- Créditos: ~5000/mes = $150/mes en valor
- Costo real: Fijo (ya pagado)
- ROI: Cada video vale $500-2000 si es bueno

---

## **8️⃣ TROUBLESHOOTING**

### ❌ "Job timeout"
→ Higgsfield tarda. Espera más o reinicia.

### ❌ "Blotato error"
→ Chequea AGENCIA_BLOTATO_API_KEY en .env

### ❌ "Conexión rechazada"
→ Reinicia: `npm run dev`

### ❌ "Sin resultado"
→ Chequea logs: `tail -f /var/log/hermes-*.log`

---

## **9️⃣ PRÓXIMOS PASOS (Roadmap)**

- [ ] Entrenamiento de IA per-cliente (aprender preferencias)
- [ ] YouTube scraper automático (analizar competencia)
- [ ] A/B testing (qué video convierte más)
- [ ] Auto-scheduling (publicar en horas óptimas)
- [ ] Sentiment analysis (medir reacción de audiencia)
- [ ] Presupuesto auto-optimizado (gastar menos, lograr más)

---

## **🔗 ENLACES ÚTILES**

- Dashboard: http://localhost:8080
- Supercomputer UI: http://localhost:8080/supercomputer-ui.html
- GitHub: https://github.com/viperroberto2-cmd/agencia-dashboard
- Higgsfield: https://higgsfield.ai
- Blotato: https://app.blotato.com

---

## **📞 SOPORTE**

¿Problemas?
- Chequea logs en `/var/log/hermes-*.log`
- Revisa `.env` tenga todas las keys
- Prueba script demo: `bash demo-supercomputer-blotato.sh`

---

**¿Listo para empezar? 🚀**

```bash
npm run dev
# Abre http://localhost:8080/supercomputer-ui.html
# ¡Crea tu primer contenido!
```
