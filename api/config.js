import { sendJson } from './_lib/http.js';

export default function handler(_req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    sendJson(res, 500, { error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.' });
    return;
  }

  sendJson(res, 200, {
    supabaseUrl,
    supabaseAnonKey,
  });
}