import { requirePremiumUser, requireUser } from '../_lib/auth.js';
import { readJsonBody, sendJson } from '../_lib/http.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SEARCH_ENDPOINT = 'https://html.duckduckgo.com/html/';

function normalizeWhitespace(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function toAbsoluteUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(match?.[1] || '');
}

function extractMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propertyFirst = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i');
  const match = html.match(propertyFirst) || html.match(contentFirst);
  return normalizeWhitespace(match?.[1] || '');
}

function stripHtml(html) {
  return normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  );
}

function extractJsonLdObjects(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects = [];

  for (const script of scripts) {
    const raw = script[1]?.trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        objects.push(...parsed);
      } else if (parsed?.['@graph'] && Array.isArray(parsed['@graph'])) {
        objects.push(...parsed['@graph']);
      } else {
        objects.push(parsed);
      }
    } catch {
      // Ignore malformed ld+json blocks.
    }
  }

  return objects;
}

function findJsonLdString(objects, resolver) {
  for (const object of objects) {
    const value = resolver(object);
    if (typeof value === 'string' && value.trim()) {
      return normalizeWhitespace(value);
    }
  }

  return '';
}

function collectJsonLdImages(objects) {
  const images = [];

  for (const object of objects) {
    const value = object?.image;

    if (typeof value === 'string') {
      images.push(value);
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === 'string') {
          images.push(entry);
        }
      });
      continue;
    }

    if (value?.url) {
      images.push(value.url);
    }
  }

  return images;
}

function extractImages(html, baseUrl, jsonLdObjects) {
  const images = [
    extractMeta(html, 'og:image'),
    extractMeta(html, 'twitter:image'),
    ...collectJsonLdImages(jsonLdObjects),
  ];

  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  imgMatches.slice(0, 24).forEach((match) => {
    images.push(match[1]);
  });

  return unique(images.map((image) => toAbsoluteUrl(image, baseUrl)).filter((image) => /\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(image || ''))).slice(0, 8);
}

function extractRtp(text) {
  const match = text.match(/(?:RTP|Return to Player)[^0-9]{0,20}(\d{2,3}(?:[.,]\d+)?)/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function extractMaxWin(text) {
  const match = text.match(/(?:Max(?:imum)?\s*Win|Potential)[^0-9]{0,24}(\d[\d.,]*)\s*x/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

function extractVolatility(text) {
  const match = text.match(/(?:Volatility|Variance)[^a-zA-Z]{0,12}(very high|high|medium|low|very low|extreme)/i);
  return match ? normalizeWhitespace(match[1]) : '';
}

function extractProvider(text, jsonLdObjects) {
  const jsonProvider = findJsonLdString(jsonLdObjects, (object) => {
    const brand = object?.brand;
    if (typeof brand === 'string') {
      return brand;
    }
    if (brand?.name) {
      return brand.name;
    }
    if (object?.manufacturer?.name) {
      return object.manufacturer.name;
    }
    if (object?.author?.name) {
      return object.author.name;
    }
    return '';
  });

  if (jsonProvider) {
    return jsonProvider;
  }

  const match = text.match(/(?:Provider|Software Provider|Developed by)[^a-zA-Z0-9]{0,12}([A-Z][A-Za-z0-9 &'/-]{2,60})/i);
  return match ? normalizeWhitespace(match[1]) : '';
}

function extractDuckDuckGoUrls(html) {
  const urls = [];
  const linkMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)];

  for (const match of linkMatches) {
    let href = decodeHtmlEntities(match[1]);

    if (href.startsWith('//')) {
      href = `https:${href}`;
    }

    if (href.startsWith('/l/?') || href.includes('duckduckgo.com/l/?')) {
      try {
        const redirectUrl = new URL(href, 'https://duckduckgo.com');
        const target = redirectUrl.searchParams.get('uddg');
        if (target) {
          href = decodeURIComponent(target);
        }
      } catch {
        // Keep original href if the redirect cannot be parsed.
      }
    }

    if (!/^https?:\/\//i.test(href)) {
      continue;
    }

    if (/duckduckgo\.com|google\.com|bing\.com|youtube\.com/i.test(href)) {
      continue;
    }

    urls.push(href);
  }

  return unique(urls);
}

async function searchCandidateUrls(name, provider) {
  const query = [name, provider, 'slot rtp max win'].filter(Boolean).join(' ');
  const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`, {
    headers: { 'user-agent': USER_AGENT },
  });

  const html = response.ok ? await response.text() : '';
  const searchUrls = extractDuckDuckGoUrls(html);
  const preferred = searchUrls.filter((url) => /slotcatalog|demoslot|casinogrounds|bigwinboard/i.test(url));
  const slug = slugify(name);

  return unique([
    ...preferred,
    ...searchUrls,
    `https://www.slotcatalog.com/en/slots/${slug}`,
    `https://www.demoslot.com/slot/${slug}`,
    `https://www.demoslot.com/free-slots/${slug}`,
  ]).slice(0, 6);
}

async function inspectCandidate(url, wantedName, providerHint) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
    redirect: 'follow',
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const title = extractTitle(html);
  const text = stripHtml(html);
  const jsonLdObjects = extractJsonLdObjects(html);
  const imageCandidates = extractImages(html, response.url || url, jsonLdObjects);
  const provider = providerHint || extractProvider(text, jsonLdObjects);
  const rtp = extractRtp(text);
  const maxWinMultiplier = extractMaxWin(text);
  const volatility = extractVolatility(text);
  const score = [
    imageCandidates[0] ? 3 : 0,
    provider ? 2 : 0,
    rtp !== null ? 2 : 0,
    maxWinMultiplier !== null ? 2 : 0,
    title.toLowerCase().includes(wantedName.toLowerCase()) ? 3 : 0,
  ].reduce((sum, value) => sum + value, 0);

  return {
    score,
    slot: {
      name: wantedName,
      provider,
      image: imageCandidates[0] || '',
      rtp,
      volatility,
      max_win_multiplier: maxWinMultiplier,
      sourceUrl: response.url || url,
      sourceTitle: title,
    },
    imageCandidates,
  };
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
    const name = normalizeWhitespace(body?.name);
    const provider = normalizeWhitespace(body?.provider);

    if (!name) {
      return sendJson(res, 400, { error: 'Slot name is required.' });
    }

    const candidateUrls = await searchCandidateUrls(name, provider);
    const candidates = [];

    for (const url of candidateUrls) {
      try {
        const candidate = await inspectCandidate(url, name, provider);
        if (candidate) {
          candidates.push(candidate);
        }
      } catch {
        // Ignore individual candidate failures and continue.
      }

      if (candidates.some((candidate) => candidate.score >= 7)) {
        break;
      }
    }

    if (!candidates.length) {
      return sendJson(res, 404, {
        error: 'Could not scrape a matching slot page. Enter the fields manually or add a provider hint.',
        candidateUrls,
      });
    }

    const bestCandidate = [...candidates].sort((left, right) => right.score - left.score)[0];

    return sendJson(res, 200, {
      slot: bestCandidate.slot,
      imageCandidates: bestCandidate.imageCandidates,
      candidateUrls,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Failed to scrape slot metadata.' });
  }
}