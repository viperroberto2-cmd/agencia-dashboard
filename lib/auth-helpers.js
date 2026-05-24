// lib/auth-helpers.js — hashPassword + in-memory session store
const crypto = require('crypto');

function hashPassword(pw) {
  const salt = process.env.PW_SALT || 'rg_production_2026';
  return crypto.createHmac('sha256', salt).update(pw).digest('hex');
}

// Tokens de sesión server-side: evita guardar contraseñas en sessionStorage del cliente.
// Expiran en 8h. Se limpian al reiniciar el servidor (Railway restart) — comportamiento aceptable.
const _sessions = new Map();

module.exports = { hashPassword, _sessions, crypto };
