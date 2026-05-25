import { requirePremiumUser, requireUser } from '../_lib/auth.js';
import { readJsonBody, sendJson } from '../_lib/http.js';
import { normalizeOverlaySettings } from '../_lib/overlayDefaults.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const body = await readJsonBody(req);
    const settings = normalizeOverlaySettings(body?.settings);
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('overlays')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return sendJson(res, 200, {
      ...data,
      settings: normalizeOverlaySettings(data.settings),
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Failed to update overlay.' });
  }
}