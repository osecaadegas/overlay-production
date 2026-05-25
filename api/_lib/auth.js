import { createClient } from '@supabase/supabase-js';
import { sendJson } from './http.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

function getAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireUser(req, res) {
  const token = getBearerToken(req);

  if (!token) {
    sendJson(res, 401, { error: 'Missing bearer token.' });
    return null;
  }

  try {
    const authClient = getAuthClient();
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);

    if (error || !user) {
      sendJson(res, 401, { error: 'Unauthorized.' });
      return null;
    }

    return user;
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Authentication failed.' });
    return null;
  }
}

export async function requirePremiumUser(userId, res) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('access_expires_at, is_active')
      .eq('user_id', userId)
      .eq('role', 'premium')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      throw error;
    }

    const premiumRole = data?.[0];
    if (!premiumRole) {
      sendJson(res, 403, { error: 'Premium access required.' });
      return false;
    }

    if (premiumRole.access_expires_at && new Date(premiumRole.access_expires_at) <= new Date()) {
      sendJson(res, 403, { error: 'Premium access has expired.' });
      return false;
    }

    return true;
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Failed to check role.' });
    return false;
  }
}