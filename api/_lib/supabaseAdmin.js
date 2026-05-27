import { createClient } from '@supabase/supabase-js';

let supabaseAdmin;

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

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = normalizeEnvValue(process.env.SUPABASE_URL)
    || normalizeEnvValue(process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}