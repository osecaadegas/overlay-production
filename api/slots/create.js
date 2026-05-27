import { requirePremiumUser, requireUser } from '../_lib/auth.js';
import { readJsonBody, sendJson } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mergeSourceCitations(existing = [], sourceUrl) {
  const values = new Set(Array.isArray(existing) ? existing.filter(Boolean) : []);

  if (sourceUrl) {
    values.add(sourceUrl);
  }

  return [...values];
}

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
    const slotInput = body?.slot || {};
    const name = normalizeText(slotInput.name);
    const provider = normalizeText(slotInput.provider);
    const image = normalizeText(slotInput.image);
    const sourceUrl = normalizeText(slotInput.sourceUrl);

    if (!name || !provider || !image) {
      return sendJson(res, 400, { error: 'Name, provider, and image are required.' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();
    const rtp = normalizeNumber(slotInput.rtp);
    const maxWinMultiplier = normalizeNumber(slotInput.max_win_multiplier);

    const { data: existingSlot, error: existingError } = await supabaseAdmin
      .from('slots')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingSlot) {
      const updatePayload = {
        provider,
        image,
        rtp: rtp ?? existingSlot.rtp,
        volatility: normalizeText(slotInput.volatility) || existingSlot.volatility || null,
        max_win_multiplier: maxWinMultiplier ?? existingSlot.max_win_multiplier,
        updated_at: now,
        updated_by: user.id,
        source_citations: mergeSourceCitations(existingSlot.source_citations, sourceUrl),
      };

      const { data, error } = await supabaseAdmin
        .from('slots')
        .update(updatePayload)
        .eq('id', existingSlot.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return sendJson(res, 200, { mode: 'updated', slot: data });
    }

    const insertPayload = {
      name,
      provider,
      image,
      rtp,
      volatility: normalizeText(slotInput.volatility) || null,
      max_win_multiplier: maxWinMultiplier,
      status: 'live',
      created_by: user.id,
      updated_by: user.id,
      updated_at: now,
      verified_at: now,
      source_citations: mergeSourceCitations([], sourceUrl),
    };

    const { data, error } = await supabaseAdmin
      .from('slots')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return sendJson(res, 200, { mode: 'created', slot: data });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Failed to add slot.' });
  }
}