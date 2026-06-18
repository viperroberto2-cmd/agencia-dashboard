// lib/auth-helpers.js — hashPassword + in-memory session store
const crypto = require('crypto');

function hashPassword(pw) {
  const salt = process.env.PW_SALT || 'rg_production_2026';
  return crypto.createHmac('sha256', salt).update(pw).digest('hex');
}

// Tokens de sesión server-side: evita guardar contraseñas en sessionStorage del cliente.
// Expiran en 8h. Se limpian al reiniciar el servidor (Railway restart) — comportamiento aceptable.
const _sessions = new Map();

function getBearerToken(req) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}

function getClientSession(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const session = _sessions.get(token);

  if (!session || session.expires < Date.now()) {
    _sessions.delete(token);
    return null;
  }

  return { token, session };
}

function requireClientSession(req, res, next) {
  const result = getClientSession(req);

  if (!result) {
    return res.status(401).json({
      ok: false,
      error: 'Sesión inválida o expirada'
    });
  }

  req.sessionToken = result.token;
  req.clientSession = result.session;
  next();
}

module.exports = {
  hashPassword,
  _sessions,
  crypto,
  getBearerToken,
  getClientSession,
  requireClientSession
};
