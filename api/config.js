import { sendJson } from './_lib/http.js';

function normalizeEnvValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/^['\"]|['\"]$/g, '');

  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return null;
  }

  return normalized;
}

export default function handler(_req, res) {
  const supabaseUrl = normalizeEnvValue(process.env.SUPABASE_URL)
    || normalizeEnvValue(process.env.VITE_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(process.env.SUPABASE_ANON_KEY)
    || normalizeEnvValue(process.env.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    sendJson(res, 500, { error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.' });
    return;
  }

  sendJson(res, 200, {
    supabaseUrl,
    supabaseAnonKey,
  });
}