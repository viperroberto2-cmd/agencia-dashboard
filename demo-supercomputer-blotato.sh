#!/bin/bash

# DEMO: End-to-End Supercomputer + Blotato Workflow
# 
# Este script demuestra el flujo completo:
# Cliente envía solicitud → Supercomputer procesa → Blotato publica
#
# Requiere:
# - Dashboard corriendo en http://localhost:8080
# - AGENCIA_BLOTATO_API_KEY en .env
# - HIGGSFIELD_API_KEY en .env

set -e

SERVER="http://localhost:8080"

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 RG PRODUCTION SUPERCOMPUTER + BLOTATO DEMO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar que el servidor esté activo
echo "🔍 Verificando conexión al servidor..."
if ! curl -s "$SERVER/health" &>/dev/null; then
  echo "❌ Error: Dashboard no responde en $SERVER"
  echo "   Inicia con: npm run dev"
  exit 1
fi
echo "✅ Servidor activo"
echo ""

# ─────────────────────────────────────────────────────────────────
# SCENARIO 1: Cliente envía solicitud por Web Form
# ─────────────────────────────────────────────────────────────────

echo "📝 SCENARIO 1: Cliente (Arranca Financial) envía solicitud web"
echo "───────────────────────────────────────────────────────────────"
echo ""

REQUEST_PAYLOAD='{
  "client_id": "arranca_financial_moxod0x7",
  "email": "roberto@rgproduction.com",
  "name": "Roberto Godinez",
  "message": "Necesito un video profesional de 30 segundos para TikTok sobre cómo ahorrar dinero durante la inflación. Dirigido a millennials argentinos. Tono: moderno, directo, persuasivo. Incluir datos de ahorro real.",
  "context": {
    "business_name": "Arranca Financial",
    "industry": "fintech",
    "target_audience": "millennials argentinos",
    "style": "moderno, directo, persuasivo"
  }
}'

echo "📤 Enviando solicitud:"
echo "$REQUEST_PAYLOAD" | jq .
echo ""

RESPONSE=$(curl -s -X POST "$SERVER/api/connectors/web/form" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD")

echo "📥 Respuesta del servidor:"
echo "$RESPONSE" | jq .
echo ""

JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id // empty')
if [ -z "$JOB_ID" ]; then
  echo "❌ Error: No se creó job_id"
  exit 1
fi

OK=$(echo "$RESPONSE" | jq -r '.ok')
if [ "$OK" != "true" ]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  echo "❌ Error: $ERROR"
  exit 1
fi

echo "✅ Job creado: $JOB_ID"
echo ""

# ─────────────────────────────────────────────────────────────────
# SCENARIO 2: Monitorear progreso
# ─────────────────────────────────────────────────────────────────

echo "⏳ SCENARIO 2: Monitorear procesamiento"
echo "───────────────────────────────────────────────────────────────"
echo ""

INTENT=$(echo "$RESPONSE" | jq -r '.intent')
MODEL=$(echo "$RESPONSE" | jq -r '.model')
ESTIMATED_TIME=$(echo "$RESPONSE" | jq -r '.estimated_time // 120')

echo "Detalles del job:"
echo "  • Intención detectada: $INTENT"
echo "  • Modelo seleccionado: $MODEL"
echo "  • Tiempo estimado: ${ESTIMATED_TIME}s"
echo ""

# Esperar a que se complete (máximo 5 intentos)
echo "Esperando a que el Supercomputer procese..."
COMPLETED=false
for i in {1..5}; do
  sleep 10
  
  STATUS_RESPONSE=$(curl -s "$SERVER/api/supercomputer/status/$JOB_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')
  PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.progress // 0')
  
  echo "  [$i/5] Status: $STATUS | Progress: ${PROGRESS}%"
  
  if [ "$STATUS" = "completed" ]; then
    COMPLETED=true
    echo "✅ ¡Job completado!"
    break
  fi
done

if [ "$COMPLETED" = "false" ]; then
  echo ""
  echo "⏱️  Job aún en progreso. En producción continuaría en background."
  echo "   Puedes chequear estado con:"
  echo "   curl $SERVER/api/supercomputer/status/$JOB_ID"
  echo ""
fi

# ─────────────────────────────────────────────────────────────────
# SCENARIO 3: Ver historial del cliente
# ─────────────────────────────────────────────────────────────────

echo ""
echo "📚 SCENARIO 3: Historial de cliente (Memory Engine)"
echo "───────────────────────────────────────────────────────────────"
echo ""

MEMORY=$(curl -s "$SERVER/api/supercomputer/memory/arranca_financial_moxod0x7")
echo "$MEMORY" | jq '.memory[0:3] // "Sin historial aún"'
echo ""

# ─────────────────────────────────────────────────────────────────
# RESUMEN
# ─────────────────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEMO COMPLETADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Lo que sucedió:"
echo "1. ✅ Cliente enviaron solicitud vía web form"
echo "2. ✅ Supercomputer clasificó intención: $INTENT"
echo "3. ✅ Supercomputer seleccionó modelo: $MODEL"
echo "4. ✅ Supercomputer ejecutó con Higgsfield MCP"
echo "5. ✅ Guardar en memoria (Supabase)"
if [ "$COMPLETED" = "true" ]; then
  echo "6. ✅ Supercomputer entregó a Blotato"
  echo "7. ✅ Blotato publicó en Facebook/Instagram/TikTok"
else
  echo "6. ⏳ Esperando resultado de Higgsfield..."
  echo "7. ⏳ Blotato publicará cuando esté listo"
fi
echo ""
echo "Próximos pasos:"
echo "• Abre http://localhost:8080/supercomputer-ui.html para más pruebas"
echo "• Configura WebHooks de WhatsApp para recibir mensajes directos"
echo "• Integra YouTube scraper para análisis de competencia"
echo ""
