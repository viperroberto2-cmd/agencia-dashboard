# RUNBOOK — RG Production Dashboard

Operaciones del día a día: despliegue, diagnóstico, rollback, gestión de secretos.

**Live:** https://web-production-3d2c.up.railway.app  
**Proyecto Railway:** `reasonable-amazement` (ID: `41d8dd23-80bf-4b59-b246-8511f8fac85e`)  
**Repo:** https://github.com/viperroberto2-cmd/agencia-dashboard

---

## 1. Despliegue en Railway

### Flujo normal
```
git push origin master
```
Railway detecta el push a `master` y redespliega automáticamente en ~60 segundos.

### Verificar despliegue exitoso
```bash
curl https://web-production-3d2c.up.railway.app/api/health
# Espera: { "ok": true, ... } o lista de bots con status
```

### Logs en vivo
```bash
railway logs --tail --service web-production-3d2c
```
O desde el panel: Railway → `reasonable-amazement` → `web-production-3d2c` → Logs.

### Redespliegue manual (sin push)
Panel Railway → `web-production-3d2c` → Deploy → Redeploy.

---

## 2. Variables de entorno

**Nunca editar `.env` en producción.** Todas las variables viven en Railway.

### Ver variables actuales
Panel Railway → `web-production-3d2c` → Variables.

### Agregar o actualizar una variable
```bash
railway variables set NOMBRE_VAR=valor --service web-production-3d2c
```

### Variables mínimas obligatorias

| Variable | Dónde obtenerla |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API → service_role |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `PW_SALT` | Generar: `openssl rand -hex 32` |
| `ADMIN_SECRET` | Generar: `openssl rand -hex 16` |

**CRÍTICO:** `PW_SALT` no puede cambiar una vez que hay clientes registrados — cambiarla invalida todas las contraseñas existentes.

---

## 3. Diagnóstico rápido

### Health de todos los bots
```bash
curl https://web-production-3d2c.up.railway.app/api/health
```
Devuelve `{ ok: bool, status: int }` por cada bot.

### Variables de entorno cargadas
```bash
curl -H "X-Admin-Secret: TU_ADMIN_SECRET" \
  https://web-production-3d2c.up.railway.app/api/env-check
```
Devuelve qué variables están seteadas (sin exponer los valores).

### Probar autenticación
```bash
curl -X POST https://web-production-3d2c.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"tu_password"}'
```

### Chat con el Organizador (test SSE)
```bash
curl -N -X POST https://web-production-3d2c.up.railway.app/api/stream/organizador \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"hola, estado del sistema"}'
```

---

## 4. Rollback

### Rollback a commit anterior
```bash
# Encontrar el commit anterior
git log --oneline -10

# Hacer push del commit anterior a master
git revert HEAD --no-edit
git push origin master
# Railway redespliegará automáticamente
```

O desde Railway: Deployments → seleccionar deploy anterior → Rollback.

---

## 5. Secretos — rotación de credenciales

### Rotar ANTHROPIC_API_KEY
1. Generar nueva key en console.anthropic.com
2. `railway variables set ANTHROPIC_API_KEY=sk-ant-... --service web-production-3d2c`
3. Railway redespliegará automáticamente al cambiar la variable.
4. Verificar con `/api/stream/organizador` que Claude responde.
5. Revocar la key vieja en Anthropic Console.

### Rotar SUPABASE_SECRET_KEY
**Precaución:** requiere redespliegue de TODOS los bots que la usen.
1. Supabase → Settings → API → Generate new service_role key.
2. Actualizar en Railway para cada servicio afectado.
3. Verificar que las rutas de base de datos respondan antes de revocar la key vieja.

### Rotar PW_SALT
**NUNCA rotar PW_SALT** si hay clientes con contraseñas activas — todas quedarían inválidas y necesitarían reset. Si es necesario:
1. Notificar a todos los clientes que habrá un reset forzado.
2. Cambiar `PW_SALT` en Railway.
3. Regenerar hashes para todos los clientes (script ad-hoc en Supabase).

---

## 6. Base de datos — Supabase

### Acceso directo
Panel Supabase → `agencia-dashboard` → Table Editor.

### Backup manual
Supabase → Settings → Database → Backups (automáticos diarios en plan Pro).

### Ver logs de queries lentas
Supabase → Reports → Query Performance.

### Agregar columna a una tabla
```sql
ALTER TABLE nombre_tabla ADD COLUMN nueva_col TEXT;
```
Ejecutar en Supabase → SQL Editor. Después actualizar el código que usa esa tabla.

---

## 7. Sesiones perdidas tras reinicio de Railway

**Síntoma:** Los usuarios del portal y el admin reportan que su sesión fue invalidada.  
**Causa:** `_sessions` vive en RAM del proceso Node.js. Un reinicio (deploy, crash, scale) vacía el Map.  
**Solución inmediata:** Pedir a los usuarios que hagan re-login.  
**Solución permanente (pendiente):** Migrar `_sessions` a Redis o a Supabase.

---

## 8. Onboarding de un nuevo cliente

1. Cliente llena el formulario en `/onboard`.
2. `POST /api/onboard-cliente` guarda en Supabase y envía alerta por Telegram.
3. Roberto crea la cuenta del cliente desde el panel de Supabase (tabla `clientes`).
4. El cliente recibe sus credenciales por email.
5. Cliente accede a `/portal` y aprueba posts desde ahí.

---

## 9. Publicación manual de un post

```bash
curl -X POST https://web-production-3d2c.up.railway.app/api/scheduler/publicar \
  -H "Content-Type: application/json" \
  -H "X-Scheduler-Secret: TU_SCHEDULER_SECRET" \
  -d '{
    "cliente": "arranca_financial",
    "texto": "Texto del post",
    "hora_utc": "2025-06-01T15:00:00Z"
  }'
```

---

## 10. Agregar un bot nuevo al health check

En `server.js` (cerca de la línea 14), en el objeto `BOTS`:
```javascript
const BOTS = {
  // ... bots existentes ...
  nuevo_bot: 'https://nuevo-bot-production.up.railway.app/health',
};
```

En `routes/utility.js`, el health check itera `BOTS` automáticamente — no requiere cambios adicionales.

---

## 11. Facebook — OAuth de página de cliente

1. Cliente hace login con Facebook desde el portal (`/api/portal/fb-auth`).
2. Dashboard intercambia el code por un token de larga duración.
3. Token se guarda en Supabase (`memoria_clientes`).
4. Publicaciones subsiguientes de ese cliente usan su token.

Si el token expira (~60 días):
- El cliente debe reconectar su página desde el portal.
- O regenerar manualmente desde Meta for Developers → Tools → Access Token Debugger → Extend.

---

## 12. Renovar token de Google Drive

El token de Google Drive se renueva automáticamente con `GOOGLE_REFRESH_TOKEN`. Si deja de funcionar:

1. Ir a Google Cloud Console → OAuth 2.0 → Credentials.
2. Generar un nuevo refresh token (OAuth Playground o flujo manual).
3. `railway variables set GOOGLE_REFRESH_TOKEN=nuevo_token --service web-production-3d2c`.

---

## 13. Estructura de commits

Usar prefijos semánticos:
```
feat:    nueva funcionalidad
fix:     corrección de bug
docs:    solo documentación
refactor: cambio de código sin cambio de comportamiento
chore:   dependencias, config, scripts
```

Ejemplo:
```bash
git commit -m "fix: corregir orden de rutas chat/history vs chat/:agentId"
```

---

## Contactos y recursos

| Recurso | URL |
|---|---|
| Dashboard live | https://web-production-3d2c.up.railway.app |
| Panel Railway | https://railway.app/project/41d8dd23-80bf-4b59-b246-8511f8fac85e |
| Supabase | https://supabase.com/dashboard |
| Anthropic Console | https://console.anthropic.com |
| Blotato | https://app.blotato.com |
| Meta for Developers | https://developers.facebook.com/apps |
| Higgsfield | https://app.higgsfield.ai |
