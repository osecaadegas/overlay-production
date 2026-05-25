import { sendJson } from '../_lib/http.js';
import { normalizeOverlaySettings } from '../_lib/overlayDefaults.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const publicId = req.query?.id;
  if (!publicId) {
    return sendJson(res, 400, { error: 'Missing overlay id.' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('overlays')
      .select('public_id, settings, updated_at')
      .eq('public_id', publicId)
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
    return sendJson(res, 500, { error: error.message || 'Failed to load public overlay.' });
  }
}