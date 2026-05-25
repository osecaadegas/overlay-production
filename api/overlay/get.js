import { requirePremiumUser, requireUser } from '../_lib/auth.js';
import { sendJson } from '../_lib/http.js';
import { normalizeOverlaySettings } from '../_lib/overlayDefaults.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const user = await requireUser(req, res);
  if (!user) {
    return undefined;
  }

  const isPremium = await requirePremiumUser(user.id, res);
  if (!isPremium) {
    return undefined;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('overlays')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return sendJson(res, 404, { error: 'Overlay not found.' });
    }

    return sendJson(res, 200, {
      ...data,
      settings: normalizeOverlaySettings(data.settings),
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Failed to load overlay.' });
  }
}