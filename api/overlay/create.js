import { requirePremiumUser, requireUser } from '../_lib/auth.js';
import { sendJson } from '../_lib/http.js';
import { createDefaultOverlaySettings, generatePublicId, normalizeOverlaySettings } from '../_lib/overlayDefaults.js';
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
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingOverlay, error: existingError } = await supabaseAdmin
      .from('overlays')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingOverlay) {
      return sendJson(res, 200, {
        ...existingOverlay,
        settings: normalizeOverlaySettings(existingOverlay.settings),
      });
    }

    const { data, error } = await supabaseAdmin
      .from('overlays')
      .insert({
        user_id: user.id,
        public_id: generatePublicId(),
        settings: createDefaultOverlaySettings(),
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return sendJson(res, 201, {
      ...data,
      settings: normalizeOverlaySettings(data.settings),
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Failed to create overlay.' });
  }
}