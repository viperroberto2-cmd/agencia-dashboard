// lib/db.js — Supabase helpers compartidos por todos los routers
async function sbFetch(path, opts = {}) {
  const base = process.env.SUPABASE_PROJECT_URL
             || process.env.SUPABASE_URL
             || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SECRET_KEY
             || process.env.SUPABASE_SERVICE_ROLE_KEY
             || process.env.SUPABASE_SERVICE_KEY
             || process.env.SUPABASE_ANON_KEY
             || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base) throw new Error('Supabase URL not set — add SUPABASE_PROJECT_URL to Railway env vars');
  if (!key)  throw new Error('Supabase Key not set — add SUPABASE_SECRET_KEY to Railway env vars');
  const url = `${base}/rest/v1${path}`;
  const headers = {
    apikey: key, Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: opts.prefer || 'return=representation',
    ...opts.headers,
  };
  return fetch(url, { method: opts.method || 'GET', headers, body: opts.body });
}

// Mezcla la columna JSONB `data` con los campos top-level del row de Supabase
function _mergeDataCol(row) {
  const d = row.data || {};
  return {
    ...row,
    ciudad:         row.ciudad         !== undefined ? row.ciudad         : (d.ciudad         || null),
    redes_sociales: row.redes_sociales !== undefined ? row.redes_sociales : (d.redes_sociales || null),
    configuracion:  row.configuracion  !== undefined ? row.configuracion  : (d.configuracion  || null),
  };
}

module.exports = { sbFetch, _mergeDataCol };
