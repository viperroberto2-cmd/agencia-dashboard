#!/bin/bash

# TEST SCRIPT: Supercomputer + Connectors
# 
# Este script prueba el flujo completo:
# 1. Envía una solicitud web form
# 2. Verifica que Supercomputer la procese
# 3. Chequea estado
# 4. Confirma entrega

set -e

SERVER="http://localhost:8080"
CLIENT_ID="arranca_financial_moxod0x7"
EMAIL="roberto@rgproduction.com"

echo "🚀 TESTING RG PRODUCTION SUPERCOMPUTER"
echo "════════════════════════════════════════"
echo ""

# TEST 1: Web Form Submission
echo "📝 TEST 1: Enviar solicitud Web Form"
echo "───────────────────────────────────"

RESPONSE=$(curl -s -X POST "$SERVER/api/connectors/web/form" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "email": "'$EMAIL'",
    "name": "Roberto Godinez",
    "message": "Necesito un video profesional para TikTok sobre cómo ahorrar dinero. Dirigido a millennials argentinos. Duración: 30-45 segundos.",
    "context": {
      "business_name": "Arranca Financial",
      "industry": "fintech",
      "target_audience": "millennials argentinos",
      "style": "moderno, directo, persuasivo"
    }
  }')

echo "Respuesta:"
echo "$RESPONSE" | jq .

JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id')
echo ""
echo "✅ Job ID: $JOB_ID"
echo ""

# TEST 2: Check Status
echo "🔍 TEST 2: Chequear estado del job"
echo "───────────────────────────────────"

sleep 2

for i in {1..5}; do
  echo "Intento $i/5..."
  STATUS_RESPONSE=$(curl -s "$SERVER/api/supercomputer/status/$JOB_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.progress // "N/A"')
  
  echo "Status: $STATUS | Progress: $PROGRESS%"
  
  if [ "$STATUS" = "completed" ]; then
    echo "✅ Job completado!"
    break
  fi
  
  sleep 10
done

echo ""

# TEST 3: Check Memory
echo "📚 TEST 3: Consultar memory (aprendizaje)"
echo "───────────────────────────────────────"

MEMORY=$(curl -s "$SERVER/api/supercomputer/memory/$CLIENT_ID")
echo "$MEMORY" | jq '.memory[0:2]'

echo ""
echo "════════════════════════════════════════"
echo "✅ TESTS COMPLETADOS"
echo ""
