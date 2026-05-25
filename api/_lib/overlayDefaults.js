import crypto from 'node:crypto';

const widgetDefaults = {
  bonusHunt: {
    enabled: true,
    startMoney: 0,
    targetMoney: 0,
    stopLoss: 0,
    betSize: 0,
    showStatistics: true,
    animatedTracker: true,
    bonusList: [],
    position: { x: 50, y: 50 },
    layout: 'sidebar',
  },
  sessionStats: {
    enabled: false,
    position: { x: 50, y: 190 },
  },
  recentWins: {
    enabled: false,
    position: { x: 50, y: 360 },
  },
  tournaments: {
    enabled: false,
    layout: 'horizontal',
    position: { x: 1200, y: 60 },
    data: {
      players: [],
      slots: [],
      matchFormat: 'single',
    },
  },
  coinflip: {
    enabled: false,
    position: { x: 1200, y: 250 },
  },
  slotmachine: {
    enabled: false,
    position: { x: 1200, y: 420 },
  },
  randomSlotPicker: {
    enabled: false,
    position: { x: 1200, y: 590 },
  },
  wheelOfNames: {
    enabled: false,
    position: { x: 1200, y: 760 },
  },
  navbar: {
    enabled: false,
    streamerName: '',
    motto: '',
    mode: 'Raw',
    position: { x: 50, y: 20 },
    layout: 'sidebar',
  },
  chat: {
    enabled: false,
    channelName: '',
    maxMessages: 10,
    position: { x: 1880, y: 60 },
  },
  customization: {
    enabled: false,
    position: { x: 1880, y: 620 },
  },
};

const widgetStylesDefaults = {
  bonusHunt: {
    backgroundColor: '#0f172a',
    accentColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  sessionStats: {
    backgroundColor: '#0f172a',
    accentColor: '#22c55e',
    borderColor: '#22c55e',
  },
  recentWins: {
    backgroundColor: '#0f172a',
    accentColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  tournaments: {
    backgroundColor: '#0f172a',
    accentColor: '#a855f7',
    borderColor: '#a855f7',
  },
  coinflip: {
    backgroundColor: '#0f172a',
    accentColor: '#ef4444',
    borderColor: '#ef4444',
  },
  slotmachine: {
    backgroundColor: '#0f172a',
    accentColor: '#eab308',
    borderColor: '#eab308',
  },
  randomSlotPicker: {
    backgroundColor: '#0f172a',
    accentColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  wheelOfNames: {
    backgroundColor: '#0f172a',
    accentColor: '#f97316',
    borderColor: '#f97316',
  },
  navbar: {
    backgroundColor: '#0f172a',
    accentColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  chat: {
    backgroundColor: '#0f172a',
    accentColor: '#22c55e',
    borderColor: '#22c55e',
  },
  customization: {
    backgroundColor: '#0f172a',
    accentColor: '#f472b6',
    borderColor: '#f472b6',
  },
};

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDeep(defaultValue, overrideValue) {
  if (Array.isArray(overrideValue)) {
    return overrideValue;
  }

  if (Array.isArray(defaultValue)) {
    return Array.isArray(overrideValue) ? overrideValue : defaultValue;
  }

  if (isPlainObject(defaultValue) || isPlainObject(overrideValue)) {
    const base = isPlainObject(defaultValue) ? defaultValue : {};
    const override = isPlainObject(overrideValue) ? overrideValue : {};
    const result = {};

    for (const key of new Set([...Object.keys(base), ...Object.keys(override)])) {
      result[key] = mergeDeep(base[key], override[key]);
    }

    return result;
  }

  return overrideValue ?? defaultValue;
}

export function createDefaultOverlaySettings() {
  return {
    widgets: structuredClone(widgetDefaults),
    theme: {
      primaryColor: '#d4af37',
      accentColor: '#38bdf8',
      backgroundColor: '#020617',
      textColor: '#e2e8f0',
    },
    widgetStyles: structuredClone(widgetStylesDefaults),
  };
}

export function normalizeOverlaySettings(settings) {
  return mergeDeep(createDefaultOverlaySettings(), settings ?? {});
}

export function generatePublicId() {
  return crypto.randomBytes(8).toString('hex');
}