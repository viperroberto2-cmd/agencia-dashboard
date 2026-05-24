# RG Production Dashboard

Panel de control central para **Agencia AI** — orquesta 11 bots de marketing en Railway, gestiona clientes, CRM de leads, publicación en redes sociales y generación de contenido con IA.

**Live:** https://web-production-3d2c.up.railway.app  
**Proyecto Railway:** `reasonable-amazement` (ID: `41d8dd23-80bf-4b59-b246-8511f8fac85e`)

---

## Qué hace

- **Dashboard admin** (`index-v2.html`): chat SSE con Claude, CRM kanban, aprobación de contenido, health de bots, media library.
- **Portal del cliente** (`rg-production-client-portal.html`): login, leads propios, aprobación de posts.
- **Onboarding** (`onboard.html`): formulario de 5 pasos para nuevos clientes.
- **API REST** (`server.js` + `routes/`): autenticación, clientes, contenido, scheduler, chat proxy, MCP server.
- **Loop agéntico** (`routes/chat.js`): Claude con 8 herramientas reales (buscar web, publicar, generar imagen/video, memoria cliente).

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Frontend | Vanilla JS SPA (sin frameworks) |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Hosting | Railway |
| IA principal | Claude API (Anthropic) — `claude-sonnet-4-6` |
| Imágenes | Higgsfield (MCP) → kie.ai nano-banana-2 (fallback) |
| Video | kie.ai Seedance-2-fast |
| Publicación | Blotato (Facebook/Instagram) |
| Llamadas | Twilio |
| Avatares de video | HeyGen |
| Email | Resend |

---

## Arrancar localmente

```bash
# 1. Clonar y entrar al directorio
git clone https://github.com/viperroberto2-cmd/agencia-dashboard.git
cd agencia-dashboard

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales reales

# 4. Correr el servidor
npm start
# → http://localhost:3000
```

**Mínimo para desarrollo local** (el resto es degradación graceful):
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Variables de entorno

Todas las variables con descripción completa están en [`.env.example`](.env.example).

**Obligatorias en producción:**

| Variable | Servicio | Descripción |
|---|---|---|
| `SUPABASE_URL` | Supabase | URL del proyecto |
| `SUPABASE_ANON_KEY` | Supabase | Clave pública (frontend) |
| `SUPABASE_SECRET_KEY` | Supabase | Clave de servicio (backend, bypasea RLS) |
| `ANTHROPIC_API_KEY` | Claude API | Chat, análisis de docs, generar-bot |
| `PW_SALT` | Auth | Salt HMAC-SHA256 contraseñas portal |
| `ADMIN_SECRET` | Seguridad | Protege `/api/env-check` |

**Para funcionalidad completa:**

| Variable | Servicio | Función |
|---|---|---|
| `BLOTATO_API_KEY` | Blotato | Publicar en Facebook/Instagram |
| `HIGGSFIELD_API_KEY` | Higgsfield | Generar imágenes (primario) |
| `KIE_API_KEY` | kie.ai | Generar imágenes (fallback) + video Seedance |
| `HEYGEN_API_KEY` | HeyGen | Avatares de video |
| `GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN` | Google Drive | Biblioteca de media |
| `TWILIO_*` | Twilio | Click-to-call |
| `RESEND_API_KEY` | Resend | Reset de contraseña por email |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Telegram | Alertas de onboarding |
| `SCHEDULER_SECRET` | interno | Auth entre dashboard ↔ bot scheduler |
| `FB_APP_ID` + `FB_APP_SECRET` | Facebook | OAuth para páginas de clientes |

En producción se configuran en el panel de Railway — nunca en archivos.

---

## Estructura del proyecto

```
agencia-dashboard/
├── server.js              # Punto de entrada Express (puerto 3000)
├── Procfile               # Railway: "web: node server.js"
├── package.json           # Dependencias: express, mammoth
├── package-lock.json      # Lockfile — versiones exactas
│
├── lib/                   # Helpers reutilizables
│   ├── auth-helpers.js    # hashPassword, _sessions, crypto
│   ├── db.js              # sbFetch — wrapper autenticado a Supabase REST
│   ├── facebook.js        # publishToFacebook, _resolvePageId, _FB_PAGES
│   ├── media.js           # _saveToMediaLibrary, getGoogleAccessToken
│   ├── proxy.js           # proxyPost, proxyGet, checkUrl
│   ├── skills.js          # _cargarSkill, _CATALOGO_SKILLS
│   └── tools.js           # _ejecutarHerramienta (8 tools), Higgsfield MCP
│
├── routes/                # Routers Express por dominio
│   ├── auth.js            # /api/auth/* — login, sesión, reset password
│   ├── chat.js            # /api/stream/organizador, /api/chat/*, /api/mensajes/*
│   ├── clientes.js        # /api/clientes/* — CRUD
│   ├── content.js         # /api/content/* — cola de contenido, aprobación
│   ├── crew.js            # /api/crew/*, /api/call/*, /api/generar-bot
│   ├── leads.js           # /api/leads/* — CRM
│   ├── mcp.js             # GET/POST /mcp — MCP protocol server
│   ├── media.js           # /api/media-library, /api/heygen/*, /gdrive/*
│   ├── portal.js          # /api/portal/* — onboarding, progress, avatar
│   ├── scheduler.js       # /api/scheduler/* — programación de posts
│   └── utility.js         # /api/health, /api/home-stats, /api/inbox, etc.
│
├── memoria/               # Skills JSON para system prompts de Claude
│   └── *.json             # psicologia_venta, director_cine, etc.
│
├── index-v2.html          # Dashboard admin (SPA)
├── rg-production-client-portal.html  # Portal del cliente
├── onboard.html           # Formulario de onboarding
├── privacy.html           # Política de privacidad
├── manifest.json          # PWA manifest
└── sw.js                  # Service Worker (cache)
```

---

## Rutas API principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login email/contraseña |
| `POST` | `/api/auth/session/create` | Crear token de sesión (8h) |
| `POST` | `/api/auth/session/verify` | Verificar token activo |
| `POST` | `/api/stream/organizador` | Chat SSE con Claude + herramientas |
| `POST` | `/api/chat/:agentId` | Proxy a bot específico |
| `GET`  | `/api/chat/history` | Historial de conversación |
| `GET`  | `/api/health` | Estado de los 11 bots en Railway |
| `GET`  | `/api/home-stats` | Métricas del dashboard |
| `GET`  | `/api/clientes` | Lista de clientes |
| `GET`  | `/api/leads` | CRM en formato kanban |
| `POST` | `/api/content/queue` | Encolar post para aprobación |
| `POST` | `/api/content/approve/:uid/:id` | Aprobar → publica en Facebook |
| `POST` | `/api/scheduler/publicar` | Programar publicación |
| `GET`  | `/api/media-library` | Biblioteca de imágenes/videos |
| `GET`  | `/gdrive/listar` | Archivos en Google Drive |
| `POST` | `/api/call/iniciar` | Click-to-call Twilio |
| `GET`  | `/api/recordings` | Grabaciones de llamadas |
| `POST` | `/mcp` | MCP server (tools para Claude Code/Hermes) |
| `GET`  | `/api/env-check` | Diagnóstico vars (requiere `X-Admin-Secret`) |

---

## Flujo de autenticación

```
Cliente → POST /api/auth/login
         → verifica HMAC-SHA256(password, PW_SALT) vs Supabase
         → si OK: genera token 32 bytes → guarda en _sessions (en memoria, 8h TTL)
         → devuelve { token, user_id, rol }

Requests autenticadas:
  Header: Authorization: Bearer <token>
  → POST /api/auth/session/verify → { ok: true, user_id, rol }

Reset de contraseña:
  → POST /api/auth/reset/request → envía link por Resend
  → POST /api/auth/reset/confirm → actualiza hash en Supabase

Limitación: _sessions vive en RAM del proceso. Si Railway reinicia, sesiones se pierden.
El cliente debe hacer re-login.
```

---

## Bots conectados en Railway

| Bot | URL de health |
|---|---|
| Organizador (CEO) | `https://web-production-77871.up.railway.app/health` |
| Crew (Productor) | `https://worker-production-34f9.up.railway.app/crew/health` |
| Estratega | `https://worker-production-035f.up.railway.app/strategy/health` |
| Scheduler | `https://worker-production-aa53.up.railway.app/scheduler/health` |
| Web Designer | `https://agencia-ai-web-designer-production.up.railway.app/web/health` |
| Motion | `https://web-production-d67bad.up.railway.app/motion/health` |
| Scraper | `https://agencia-ai-scraper-production.up.railway.app/health` |
| SEO | `https://agencia-ai-seo-production.up.railway.app/health` |
| Analytics | `https://agencia-ai-analytics-production.up.railway.app/analytics/health` |
| Compositor | `https://compositorbot-production.up.railway.app/compositor/health` |

Healthcheck del dashboard: `GET /api/health` — devuelve `{ ok: bool, status: int }` por bot.

---

## Seguridad

| Mecanismo | Detalle |
|---|---|
| Contraseñas | HMAC-SHA256 con `PW_SALT` (no bcrypt — cuidado con salt débil en prod) |
| Sesiones | Tokens 32 bytes en `_sessions` (Map en RAM). TTL 8h. |
| `/api/env-check` | Requiere `X-Admin-Secret` header si `ADMIN_SECRET` está seteado |
| Secrets | Solo viven en Railway env vars — nunca en archivos del repo |
| `.gitignore` | Excluye `.env`, `.env.local`, `.env.production`, `.env.*.local` |
| MCP server `/mcp` | Sin autenticación — es para uso interno (Claude Code/Hermes) |
| Defaults inseguros | `PW_SALT` y `SCHEDULER_SECRET` tienen defaults en código — **cambiar en prod** |

---

## Despliegue en Railway

Ver [`RUNBOOK.md`](RUNBOOK.md) para pasos completos.

**Resumen rápido:**
1. Push a `master` → Railway detecta y redespliega automáticamente.
2. Variables de entorno se configuran en el panel de Railway (no en archivos).
3. El `Procfile` le dice a Railway: `web: node server.js`.
4. Puerto: Railway inyecta `PORT` automáticamente.

---

## Servicios externos

Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) para el mapa completo de integraciones.

| Servicio | Propósito | Documentación |
|---|---|---|
| Railway | Hosting de todos los bots y el dashboard | railway.app |
| Supabase | BD, Storage, Auth base | supabase.com |
| Anthropic Claude | IA del loop agéntico | anthropic.com |
| Blotato | Publicación en Facebook/Instagram | blotato.com |
| Higgsfield | Generación de imágenes | higgsfield.ai |
| kie.ai | Video Seedance + imágenes fallback | kie.ai |
| HeyGen | Avatares de video | heygen.com |
| Twilio | Click-to-call | twilio.com |
| Resend | Email transaccional | resend.com |
| Google Drive | Biblioteca de media | Google Cloud Console |
| Facebook Graph API | OAuth páginas + Instagram | developers.facebook.com |
| Telegram Bot API | Notificaciones de onboarding | t.me/BotFather |
