# Arquitectura del sistema — RG Production Dashboard

## Visión general

El dashboard es el **hub central** de Agencia AI. Expone:
- Un dashboard admin (SPA) para Roberto
- Un portal de cliente (login propio, aprobación de posts)
- Una API REST consumida por el dashboard y por los bots
- Un loop agéntico (Claude + herramientas) en `/api/stream/organizador`
- Un servidor MCP en `/mcp` para Claude Code y el agente Hermes

---

## Mapa de capas

```
┌─────────────────────────────────────────────────────────────┐
│  Navegador — index-v2.html / rg-production-client-portal.html │
│  (Vanilla JS, Fetch + SSE, sin frameworks)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│  Node.js + Express — server.js (puerto 3000, Railway)        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │routes/   │  │routes/   │  │routes/   │  │routes/   │   │
│  │auth.js   │  │chat.js   │  │content.js│  │leads.js  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │routes/   │  │routes/   │  │routes/   │  │routes/   │   │
│  │crew.js   │  │media.js  │  │scheduler │  │portal.js │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │routes/   │  │routes/   │  │routes/   │                  │
│  │utility.js│  │clientes  │  │mcp.js    │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                               │
│  lib/auth-helpers.js  lib/db.js  lib/facebook.js            │
│  lib/media.js  lib/proxy.js  lib/skills.js  lib/tools.js    │
└────────────────────────────────────────────────────────────┘
         │              │              │
    ┌────▼───┐    ┌─────▼──┐    ┌─────▼──────────┐
    │Supabase│    │Claude  │    │Servicios externos│
    │Postgres│    │API     │    │Blotato, Higgsfield│
    │Storage │    │Sonnet  │    │kie.ai, HeyGen   │
    └────────┘    └────────┘    │Google, Twilio   │
                                │Resend, Telegram  │
                                └─────────────────┘
```

---

## Estructura de archivos

```
agencia-dashboard/
├── server.js              # Entry point Express, mounts todas las rutas
│
├── lib/                   # Helpers compartidos (sin estado HTTP)
│   ├── auth-helpers.js    # hashPassword, _sessions Map (TTL 8h), crypto
│   ├── db.js              # sbFetch — wrapper autenticado a Supabase REST
│   ├── facebook.js        # publishToFacebook, _resolvePageId, _FB_PAGES
│   ├── media.js           # _saveToMediaLibrary (Supabase), getGoogleAccessToken (OAuth2)
│   ├── proxy.js           # proxyPost, proxyGet, checkUrl — reenvío a bots Railway
│   ├── skills.js          # _cargarSkill (lee JSON de /memoria), _CATALOGO_SKILLS
│   └── tools.js           # _ejecutarHerramienta (8 tools), Higgsfield MCP 3-step
│
├── routes/                # Express Routers por dominio (montados en server.js)
│   ├── auth.js            # /api/auth/*
│   ├── chat.js            # /api/stream/organizador, /api/chat/*, /api/mensajes/*
│   ├── clientes.js        # /api/clientes/*
│   ├── content.js         # /api/content/*
│   ├── crew.js            # /api/call/*, /api/generar-bot, /api/crew/*, /api/setup/*
│   ├── leads.js           # /api/leads/*
│   ├── mcp.js             # GET+POST /mcp — MCP protocol server
│   ├── media.js           # /api/media-library, /api/heygen/*, /gdrive/*
│   ├── portal.js          # /api/portal/*
│   ├── scheduler.js       # /api/scheduler/*
│   └── utility.js         # /api/health, /api/home-stats, /api/inbox, /api/env-check, etc.
│
├── memoria/               # Skills JSON inyectadas al system prompt de Claude
│   └── *.json             # psicologia_venta, director_cine, storytelling, etc.
│
├── index-v2.html          # SPA admin — chat, CRM kanban, aprobación, health
├── rg-production-client-portal.html  # Portal cliente — login, leads, aprobación
├── onboard.html           # Onboarding 5 pasos para nuevos clientes
├── privacy.html           # Política de privacidad (requerida por Facebook)
├── manifest.json          # PWA manifest
└── sw.js                  # Service Worker (cache estática)
```

---

## Loop agéntico — `/api/stream/organizador`

El endpoint principal es SSE (Server-Sent Events). El cliente abre una conexión y recibe tokens en tiempo real.

```
Cliente POST /api/stream/organizador { mensaje, cliente? }
  │
  ▼
Construye system prompt:
  - Perfil Claude (rol, restricciones)
  - Memoria del cliente (Supabase: memoria_clientes)
  - Catálogo de skills disponibles (_CATALOGO_SKILLS)
  │
  ▼
Claude API — streaming (claude-sonnet-4-6)
  │
  ├─ chunk.type === 'content_block_delta' → SSE: data: { token }
  │
  └─ stop_reason === 'tool_use'
       │
       ▼
       _ejecutarHerramienta(name, input)
         ├─ buscar_web       → Brave Search API
         ├─ fetch_url        → lib/proxy checkUrl
         ├─ publicar_blotato → Blotato API + lib/facebook
         ├─ generar_video    → kie.ai Seedance-2-fast
         ├─ generar_y_publicar → Higgsfield MCP → Blotato
         ├─ leer_memoria_cliente → Supabase memoria_clientes
         ├─ guardar_memoria  → Supabase PATCH memoria_clientes
         └─ cargar_skill     → lib/skills _cargarSkill (lee /memoria/*.json)
       │
       ▼
     SSE: data: { tool_result } → bucle hasta stop_reason !== 'tool_use'
  │
  ▼
SSE: data: [DONE]
```

---

## Autenticación

### Admin (dashboard)
Sesión en memoria del proceso Node.js (`_sessions` Map):
```
POST /api/auth/login
  → HMAC-SHA256(password, PW_SALT) vs hash en Supabase
  → genera token 32 bytes (crypto.randomBytes)
  → _sessions.set(token, { user_id, rol, exp: now+8h })
  → { token, user_id, rol }

Requests subsiguientes:
  Header: Authorization: Bearer <token>
  → POST /api/auth/session/verify → { ok: true, user_id, rol }
```

**Limitación:** `_sessions` es RAM. Si Railway reinicia el proceso (deploy o crash), todas las sesiones se pierden. Los clientes deben hacer re-login.

### Portal cliente
Mismo mecanismo HMAC-SHA256. Rol diferenciado: `'cliente'`.

### Reset de contraseña
```
POST /api/auth/reset/request → link JWT por Resend email
POST /api/auth/reset/confirm → actualiza hash en Supabase
```

---

## MCP Server — `/mcp`

Implementa el protocolo MCP (Model Context Protocol) versión `2024-11-05` para que Claude Code y el agente Hermes consuman herramientas del dashboard directamente.

**Herramientas expuestas:**

| Tool | Descripción |
|---|---|
| `generar_y_publicar` | Genera imagen con Higgsfield y publica en Facebook |
| `generar_video` | Genera video UGC con Seedance (kie.ai) |
| `publicar_blotato` | Publica texto/media en Facebook vía Blotato |
| `leer_memoria_cliente` | Lee perfil + memoria desde Supabase |
| `guardar_memoria` | Actualiza datos del cliente en Supabase |
| `listar_media` | Lista media reciente de un cliente |

**Configuración en Claude Code** (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "agencia-dashboard": {
      "url": "https://web-production-3d2c.up.railway.app/mcp"
    }
  }
}
```

**Sin autenticación** — diseñado para uso interno desde Claude Code o el agente Hermes.

---

## Bots externos — Railway

El dashboard actúa como **orquestador**: delega tareas a bots especializados vía HTTP proxy (`lib/proxy.js`).

| Bot | Función | Health URL |
|---|---|---|
| Organizador (CEO) | Loop principal de decisiones | `.../health` |
| Crew (Productor) | Coordina producción | `.../crew/health` |
| Estratega | Análisis de mercado | `.../strategy/health` |
| Scheduler | Programación de posts | `.../scheduler/health` |
| Web Designer | Páginas web de clientes | `.../web/health` |
| Motion | Videos + animaciones | `.../motion/health` |
| Scraper | Extracción de datos web | `.../health` |
| SEO | Optimización orgánica | `.../health` |
| Analytics | Métricas y reportes | `.../analytics/health` |
| Compositor | Composición audiovisual | `.../compositor/health` |

El dashboard en sí también tiene un servicio en Railway (`web-production-3d2c`).

---

## Modelo de datos — Supabase (tablas relevantes)

| Tabla | Propósito |
|---|---|
| `clientes` | Registro de clientes (nombre, email, rol, password_hash) |
| `leads` | CRM: contactos en pipeline kanban |
| `content_queue` | Cola de posts pendientes de aprobación |
| `memoria_clientes` | JSON blob por cliente: perfil, objetivos, _media, historial |
| `mensajes_organizador` | Historial del chat admin con el Organizador |
| `scheduler_posts` | Posts programados para publicación futura |

---

## Flujo de publicación de contenido

```
1. Claude genera post vía loop agéntico (tool: publicar_blotato)
   ── o ──
   Admin enqueue manualmente desde dashboard

2. POST /api/content/queue → guarda en content_queue (estado: pendiente)

3. Dashboard muestra tarjeta en "Aprobación de contenido"

4. Admin/cliente hace click en Aprobar
   → POST /api/content/approve/:uid/:id

5. Backend llama Blotato API → publica en Facebook/Instagram
   → actualiza estado en Supabase: aprobado + post_id externo
```

---

## Seguridad

| Capa | Mecanismo |
|---|---|
| Contraseñas | HMAC-SHA256 con `PW_SALT` |
| Sesiones | Token 32 bytes en RAM, TTL 8h |
| Secrets | Solo en Railway env vars, nunca en archivos |
| `/api/env-check` | Header `X-Admin-Secret` requerido si `ADMIN_SECRET` está seteado |
| `/mcp` | Sin auth — uso interno solamente |
| `.gitignore` | Excluye `.env`, settings locales, scripts de debug |

**Advertencias:**
- `_sessions` en RAM — no persiste entre reinicios de Railway.
- `PW_SALT` tiene default inseguro en código. **Siempre override en Railway.**
- `/mcp` no tiene auth — no exponer públicamente si se añaden herramientas destructivas.
