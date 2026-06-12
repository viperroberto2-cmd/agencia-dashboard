# Tracking Plan — Si Se Pierde (landing)

Cliente: `si_se_pierde` · Página: `/landing/si-se-pierde` · Estado: **borrador técnico**

## 1. Objetivo
Medir el embudo de la landing de captación: vista → intento de envío → lead registrado en CRM.
El lead se guarda vía `POST /api/leads` (tabla `voice_leads`, `cliente = "si_se_pierde"`).

## 2. Eventos (dataLayer)
La landing empuja eventos a `window.dataLayer` mediante el helper `track(event, params)`.
Todos incluyen `client: "si_se_pierde"`.

| Evento          | Cuándo se dispara                          | Params                         |
|-----------------|--------------------------------------------|--------------------------------|
| `landing_view`  | Al cargar la página                        | `page`                         |
| `lead_submit`   | Al hacer submit (antes del fetch)          | —                              |
| `lead_success`  | El API responde `{ ok: true }`             | —                              |
| `lead_error`    | Error de validación, API o red             | `reason`                       |

## 3. Conversión principal
`lead_success` = conversión. Tasa de conversión = `lead_success / landing_view`.
Abandono de formulario = `lead_submit − lead_success`.

## 4. Implementación pendiente (requiere aprobación / IDs reales)
- **GTM:** el snippet está comentado en `landing/si-se-pierde.html` con placeholder `GTM-XXXXXXX`.
  Recomendado inyectar el ID por variable de entorno en `serveLanding()` (igual que
  `index-v2.html` reemplaza `__SUPABASE_URL__`), **nunca** hardcodearlo en el repo.
- **GA4 / Meta Pixel:** mapear los eventos del dataLayer a tags en GTM. No añadir IDs al repo.
- **UTMs:** capturar `utm_source/medium/campaign` de la URL y enviarlos en `notas` o un
  campo dedicado del lead para atribución.

## 5. Notas de privacidad
- El formulario recoge nombre, email, teléfono y mensaje libre.
- Como el cliente opera en el área de pérdida de peso / GLP-1, el campo de mensaje podría incluir información de salud si el usuario la escribe voluntariamente.
- Evitar solicitar información médica sensible en esta versión del scaffold.
- Considerar checkbox de consentimiento antes de activar pixels de terceros.
- No añadir IDs reales de GTM, GA4, Meta Pixel, tokens ni secretos al repo.
