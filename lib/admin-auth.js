// lib/admin-auth.js — HTTP Basic Auth guard for administrative APIs.
//
// Protege únicamente los routers/rutas administrativas. Lee las credenciales
// exclusivamente de las variables de entorno ADMIN_BASIC_USER y
// ADMIN_BASIC_PASSWORD. No hay credenciales predeterminadas.
//
// Nunca registra el header Authorization, el usuario, la contraseña ni las
// credenciales decodificadas.
const crypto = require('crypto');

const REALM = 'Agency Admin';

// Comparación en tiempo constante que tolera longitudes distintas sin lanzar.
// Se hashea cada lado con SHA-256 para igualar longitudes antes de
// timingSafeEqual; además se compara la igualdad real para evitar colisiones.
function safeEqual(a, b) {
  const aBuf = crypto.createHash('sha256').update(String(a)).digest();
  const bBuf = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(aBuf, bBuf) && a === b;
}

function unauthorized(res) {
  res.set('WWW-Authenticate', `Basic realm="${REALM}"`);
  return res.status(401).json({
    ok: false,
    error: 'Authentication required'
  });
}

function requireAdmin(req, res, next) {
  const expectedUser = process.env.ADMIN_BASIC_USER;
  const expectedPass = process.env.ADMIN_BASIC_PASSWORD;

  // Sin configuración no se puede autenticar a nadie: se rechaza en 503 en
  // lugar de quedar abierto.
  if (!expectedUser || !expectedPass) {
    return res.status(503).json({
      ok: false,
      error: 'Admin authentication is not configured'
    });
  }

  const header = String(req.headers.authorization || '');
  const match = /^Basic\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return unauthorized(res);
  }

  let decoded;
  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8');
  } catch (_e) {
    return unauthorized(res);
  }

  // El primer ':' separa usuario y contraseña; la contraseña puede contener ':'.
  const sep = decoded.indexOf(':');
  if (sep === -1) {
    return unauthorized(res);
  }
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const userOk = safeEqual(user, expectedUser);
  const passOk = safeEqual(pass, expectedPass);

  // Evaluamos ambos para no revelar (por timing o mensaje) cuál falló.
  if (!userOk || !passOk) {
    return unauthorized(res);
  }

  next();
}

module.exports = { requireAdmin };
