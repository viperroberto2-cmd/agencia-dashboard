# RG Production Dashboard

Panel de control central para **Agencia AI** — orquesta 11 bots de marketing en Railway, gestiona clientes, CRM de leads, publicación en redes sociales y generación de contenido con IA.

## Stack

- **Backend:** Node.js + Express (`server.js`)
- **Frontend:** Vanilla JS SPA (sin frameworks) — `index-v2.html`
- **Base de datos:** Supabase (PostgreSQL)
- **Hosting:** Railway
- **IA:** Claude API (Anthropic), Higgsfield, kie.ai (Seedance)
- **Social:** Blotato (Facebook/Instagram), Twilio (llamadas)

## Arrancar localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno con tus valores
cp .env.example .env
# Edita .env con tus credenciales reales

# 3. Correr el servidor
npm start
# → http://localhost:3000
```

## Variables de entorno

Todas las variables requeridas están documentadas en [`.env.example`](.env.example).

Las mínimas para desarrollo local:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

En producción (Railway) se configuran directamente en el panel de Railway, no en archivos.

## Archivos principales

| Archivo | Descripción |
|---|---|
| `server.js` | Backend Express — rutas API, auth, proxy a bots, MCP server |
| `index-v2.html` | Dashboard admin — 9 secciones, chat SSE con IA, CRM kanban |
| `rg-production-client-portal.html` | Portal del cliente — login, leads, aprobación de contenido |
| `onboard.html` | Formulario de onboarding para nuevos clientes (5 pasos) |
| `memoria/` | Skills JSON cargadas en system prompts de Claude |
| `sw.js` | Service Worker para PWA (offline/cache) |

## Rutas principales

| Ruta | Descripción |
|---|---|
| `GET /` | Dashboard admin |
| `GET /portal` | Portal del cliente |
| `GET /onboard` | Onboarding nuevos clientes |
| `POST /api/auth/login` | Login con email/contraseña |
| `POST /api/auth/session/create` | Crear token de sesión (8h) |
| `POST /api/auth/session/verify` | Verificar token activo |
| `GET /api/health` | Estado de los 11 bots en Railway |
| `GET /api/clientes` | CRUD de clientes |
| `GET /api/leads` | CRM de leads |
| `POST /api/content/approve/:uid/:id` | Aprobar post → publica en Facebook |
| `POST /mcp` | MCP server para Hermes Agent y Claude Code |
| `GET /api/env-check` | Diagnóstico de vars (requiere `X-Admin-Secret` header) |

## Bots conectados

El dashboard orquesta estos servicios en Railway:

| Bot | Ruta de health |
|---|---|
| Organizador (CEO) | `/health` |
| Crew (Productor) | `/crew/health` |
| Estratega | `/strategy/health` |
| Scheduler | `/scheduler/health` |
| Web Designer | `/web/health` |
| Motion | `/motion/health` |
| Scraper | `/health` |
| SEO | `/health` |
| Analytics | `/health` |
| Compositor | `/compositor/health` |

## Seguridad

- Contraseñas de clientes: HMAC-SHA256 con `PW_SALT`
- Sesiones: tokens de 32 bytes en memoria del servidor, expiran en 8h
- `/api/env-check`: protegido con `X-Admin-Secret` header si `ADMIN_SECRET` está seteado
- **Nunca commitear `.env`** — está en `.gitignore`

## Archivos legacy

Los archivos anteriores del proyecto están en `_legacy/` (no se sirven en producción):
- `index.html`, `index_v2.html` — versiones anteriores del dashboard
- `client-portal.html`, `agencia-dashboard-sintra.html` — portales antiguos
- `patch-connect.js`, `patch-ms.js`, `patch-ms2.js` — scripts de integración ya aplicados
