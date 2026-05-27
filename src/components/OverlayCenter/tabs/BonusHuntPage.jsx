import { useEffect, useMemo, useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { invalidateCache } from '../../../utils/slotUtils';

const DEFAULT_SLOT_IMAGE = 'https://via.placeholder.com/160x160/111827/94a3b8?text=Slot';
const EMPTY_SLOT_FORM = {
  name: '',
  provider: '',
  image: '',
  rtp: '',
  volatility: '',
  max_win_multiplier: '',
  sourceUrl: '',
  sourceTitle: '',
  imageCandidates: [],
};

function asInputValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function makeBonusId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function uniqueImages(images) {
  return [...new Set((images || []).filter(Boolean))];
}

function normalizeBonusList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((bonus) => {
    const payout = normalizeNumber(bonus?.payout ?? bonus?.result, 0);
    const slot = bonus?.slot || {
      name: bonus?.slotName || 'Unknown Slot',
      provider: bonus?.provider || '',
      image: bonus?.image || '',
    };

    return {
      id: bonus?.id || makeBonusId(),
      slot,
      slotName: bonus?.slotName || slot.name || 'Unknown Slot',
      betSize: normalizeNumber(bonus?.betSize, 0),
      isSuperBonus: Boolean(bonus?.isSuperBonus),
      isExtremeBonus: Boolean(bonus?.isExtremeBonus),
      opened: Boolean(bonus?.opened) || payout > 0,
      payout,
      result: payout,
    };
  });
}

function normalizeHistoryList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((entry) => ({
    id: entry?.id || makeBonusId(),
    savedAt: entry?.savedAt || new Date().toISOString(),
    label: safeText(entry?.label),
    casinoName: safeText(entry?.casinoName),
    huntNumber: safeText(entry?.huntNumber),
    startMoney: normalizeNumber(entry?.startMoney, 0),
    targetMoney: normalizeNumber(entry?.targetMoney, 0),
    stopLoss: normalizeNumber(entry?.stopLoss, 0),
    totalBet: normalizeNumber(entry?.totalBet, 0),
    totalPayout: normalizeNumber(entry?.totalPayout, 0),
    profit: normalizeNumber(entry?.profit, 0),
    bonusCount: normalizeNumber(entry?.bonusCount, 0),
    bonusList: normalizeBonusList(entry?.bonusList),
  }));
}

function buildHistoryLabel(casinoName, huntNumber) {
  const pieces = [];

  if (casinoName.trim()) {
    pieces.push(casinoName.trim());
  }

  if (huntNumber.trim()) {
    pieces.push(`Hunt #${huntNumber.trim()}`);
  }

  if (!pieces.length) {
    pieces.push(`Saved ${new Date().toLocaleDateString()}`);
  }

  return pieces.join(' • ');
}

function formatMoney(value) {
  return normalizeNumber(value, 0).toFixed(2);
}

export default function BonusHuntPage({ overlay, updateSettings, slots = [], refreshSlots }) {
  const widgetSettings = overlay?.settings?.widgets?.bonusHunt ?? {};
  const huntHistory = useMemo(() => normalizeHistoryList(widgetSettings.huntHistory), [widgetSettings.huntHistory]);

  const [enabled, setEnabled] = useState(widgetSettings.enabled ?? true);
  const [startMoney, setStartMoney] = useState(asInputValue(widgetSettings.startMoney));
  const [targetMoney, setTargetMoney] = useState(asInputValue(widgetSettings.targetMoney));
  const [stopLoss, setStopLoss] = useState(asInputValue(widgetSettings.stopLoss));
  const [huntNumber, setHuntNumber] = useState(safeText(widgetSettings.huntNumber));
  const [casinoName, setCasinoName] = useState(safeText(widgetSettings.casinoName));
  const [showStatistics, setShowStatistics] = useState(widgetSettings.showStatistics ?? true);
  const [animatedTracker, setAnimatedTracker] = useState(widgetSettings.animatedTracker ?? true);
  const [bonusList, setBonusList] = useState(() => normalizeBonusList(widgetSettings.bonusList));
  const [slotSearch, setSlotSearch] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [betSize, setBetSize] = useState('');
  const [isSuperBonus, setIsSuperBonus] = useState(false);
  const [isExtremeBonus, setIsExtremeBonus] = useState(false);
  const [showSlotSuggestions, setShowSlotSuggestions] = useState(false);
  const [saveState, setSaveState] = useState({ tone: 'idle', message: '' });
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT_FORM);
  const [slotActionState, setSlotActionState] = useState({ tone: 'idle', message: '' });
  const [slotScraping, setSlotScraping] = useState(false);
  const [slotSaving, setSlotSaving] = useState(false);

  useEffect(() => {
    setEnabled(widgetSettings.enabled ?? true);
    setStartMoney(asInputValue(widgetSettings.startMoney));
    setTargetMoney(asInputValue(widgetSettings.targetMoney));
    setStopLoss(asInputValue(widgetSettings.stopLoss));
    setHuntNumber(safeText(widgetSettings.huntNumber));
    setCasinoName(safeText(widgetSettings.casinoName));
    setShowStatistics(widgetSettings.showStatistics ?? true);
    setAnimatedTracker(widgetSettings.animatedTracker ?? true);
    setBonusList(normalizeBonusList(widgetSettings.bonusList));
  }, [widgetSettings]);

  const filteredSlots = useMemo(() => {
    const term = slotSearch.trim().toLowerCase();

    if (!term) {
      return [];
    }

    return slots
      .filter((slot) => {
        const name = safeText(slot?.name).toLowerCase();
        const provider = safeText(slot?.provider).toLowerCase();
        return name.includes(term) || provider.includes(term);
      })
      .sort((left, right) => safeText(left?.name).localeCompare(safeText(right?.name)))
      .slice(0, 10);
  }, [slotSearch, slots]);

  const summary = useMemo(() => {
    const totalBet = bonusList.reduce((sum, bonus) => sum + normalizeNumber(bonus.betSize, 0), 0);
    const totalPayout = bonusList.reduce((sum, bonus) => sum + normalizeNumber(bonus.payout, 0), 0);
    const opened = bonusList.filter((bonus) => bonus.opened || normalizeNumber(bonus.payout, 0) > 0).length;
    const profit = totalPayout - totalBet;

    return {
      totalBet,
      totalPayout,
      opened,
      profit,
    };
  }, [bonusList]);

  const buildWidgetSettings = (overrides = {}) => ({
    ...widgetSettings,
    enabled: overrides.enabled ?? enabled,
    startMoney: normalizeNumber(overrides.startMoney ?? startMoney, 0),
    targetMoney: normalizeNumber(overrides.targetMoney ?? targetMoney, 0),
    stopLoss: normalizeNumber(overrides.stopLoss ?? stopLoss, 0),
    huntNumber: safeText(overrides.huntNumber ?? huntNumber).trim(),
    casinoName: safeText(overrides.casinoName ?? casinoName).trim(),
    showStatistics: overrides.showStatistics ?? showStatistics,
    animatedTracker: overrides.animatedTracker ?? animatedTracker,
    bonusList: normalizeBonusList(overrides.bonusList ?? bonusList),
    huntHistory: normalizeHistoryList(overrides.huntHistory ?? huntHistory),
    position: widgetSettings.position ?? { x: 50, y: 50 },
    layout: widgetSettings.layout ?? 'sidebar',
  });

  const persistBonusHunt = async (overrides = {}, successMessage = 'Bonus Hunt saved.') => {
    const nextSettings = {
      ...overlay.settings,
      widgets: {
        ...overlay.settings.widgets,
        bonusHunt: buildWidgetSettings(overrides),
      },
    };

    const ok = await updateSettings(nextSettings);

    setSaveState(
      ok
        ? { tone: 'success', message: successMessage }
        : { tone: 'error', message: 'Could not save the Bonus Hunt workspace.' }
    );

    return ok;
  };

  const getAuthorizedHeaders = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      throw new Error('You must be logged in to use slot tools.');
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleSetupSave = async () => {
    await persistBonusHunt({}, 'Bonus Hunt setup saved.');
  };

  const handleResetActiveHunt = async () => {
    setSelectedSlot(null);
    setSlotSearch('');
    setBetSize('');
    setIsSuperBonus(false);
    setIsExtremeBonus(false);
    setStartMoney('');
    setTargetMoney('');
    setStopLoss('');
    setHuntNumber('');
    setCasinoName('');
    setBonusList([]);

    await persistBonusHunt(
      {
        startMoney: '',
        targetMoney: '',
        stopLoss: '',
        huntNumber: '',
        casinoName: '',
        bonusList: [],
      },
      'Active hunt reset. Ready for a new run.'
    );
  };

  const handleArchiveHunt = async () => {
    const currentBonusList = normalizeBonusList(bonusList);

    if (!currentBonusList.length) {
      setSaveState({ tone: 'error', message: 'Add at least one bonus before saving this hunt to history.' });
      return;
    }

    const totalBet = currentBonusList.reduce((sum, bonus) => sum + normalizeNumber(bonus.betSize, 0), 0);
    const totalPayout = currentBonusList.reduce((sum, bonus) => sum + normalizeNumber(bonus.payout, 0), 0);
    const nextHistory = [
      {
        id: makeBonusId(),
        savedAt: new Date().toISOString(),
        label: buildHistoryLabel(casinoName, huntNumber),
        casinoName: casinoName.trim(),
        huntNumber: huntNumber.trim(),
        startMoney: normalizeNumber(startMoney, 0),
        targetMoney: normalizeNumber(targetMoney, 0),
        stopLoss: normalizeNumber(stopLoss, 0),
        totalBet,
        totalPayout,
        profit: totalPayout - totalBet,
        bonusCount: currentBonusList.length,
        bonusList: currentBonusList,
      },
      ...huntHistory,
    ].slice(0, 12);

    setSelectedSlot(null);
    setSlotSearch('');
    setBetSize('');
    setIsSuperBonus(false);
    setIsExtremeBonus(false);
    setStartMoney('');
    setTargetMoney('');
    setStopLoss('');
    setHuntNumber('');
    setCasinoName('');
    setBonusList([]);

    await persistBonusHunt(
      {
        startMoney: '',
        targetMoney: '',
        stopLoss: '',
        huntNumber: '',
        casinoName: '',
        bonusList: [],
        huntHistory: nextHistory,
      },
      'Hunt archived to history and the workspace was reset for the next run.'
    );
  };

  const handleLoadHistoryEntry = async (entry) => {
    const normalizedEntry = normalizeHistoryList([entry])[0];

    setSelectedSlot(null);
    setSlotSearch('');
    setBetSize('');
    setIsSuperBonus(false);
    setIsExtremeBonus(false);
    setStartMoney(asInputValue(normalizedEntry.startMoney));
    setTargetMoney(asInputValue(normalizedEntry.targetMoney));
    setStopLoss(asInputValue(normalizedEntry.stopLoss));
    setHuntNumber(normalizedEntry.huntNumber);
    setCasinoName(normalizedEntry.casinoName);
    setBonusList(normalizedEntry.bonusList);

    await persistBonusHunt(
      {
        startMoney: normalizedEntry.startMoney,
        targetMoney: normalizedEntry.targetMoney,
        stopLoss: normalizedEntry.stopLoss,
        huntNumber: normalizedEntry.huntNumber,
        casinoName: normalizedEntry.casinoName,
        bonusList: normalizedEntry.bonusList,
        huntHistory,
      },
      'Saved hunt loaded back into the active workspace.'
    );
  };

  const handleDeleteHistoryEntry = async (entryId) => {
    const nextHistory = huntHistory.filter((entry) => entry.id !== entryId);
    await persistBonusHunt({ huntHistory: nextHistory }, 'Saved hunt removed from history.');
  };

  const handleEnabledToggle = async (checked) => {
    setEnabled(checked);
    await persistBonusHunt({ enabled: checked }, checked ? 'Bonus Hunt enabled.' : 'Bonus Hunt disabled.');
  };

  const handleStatisticsToggle = async (checked) => {
    setShowStatistics(checked);
    await persistBonusHunt({ showStatistics: checked }, 'Display options updated.');
  };

  const handleAnimationToggle = async (checked) => {
    setAnimatedTracker(checked);
    await persistBonusHunt({ animatedTracker: checked }, 'Display options updated.');
  };

  const handleAddBonus = async () => {
    const stake = normalizeNumber(betSize, 0);

    if (!selectedSlot || stake <= 0) {
      setSaveState({ tone: 'error', message: 'Pick a slot from the library and enter a bet size first.' });
      return;
    }

    const nextList = [
      ...bonusList,
      {
        id: makeBonusId(),
        slot: selectedSlot,
        slotName: selectedSlot.name,
        betSize: stake,
        isSuperBonus,
        isExtremeBonus,
        opened: false,
        payout: 0,
        result: 0,
      },
    ];

    setBonusList(nextList);
    setSelectedSlot(null);
    setSlotSearch('');
    setBetSize('');
    setIsSuperBonus(false);
    setIsExtremeBonus(false);

    await persistBonusHunt({ bonusList: nextList }, 'Bonus added to the hunt.');
  };

  const commitBonusList = async (nextList, message) => {
    setBonusList(nextList);
    await persistBonusHunt({ bonusList: nextList }, message);
  };

  const handleBonusMove = async (bonusId, direction) => {
    const currentIndex = bonusList.findIndex((bonus) => bonus.id === bonusId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= bonusList.length) {
      return;
    }

    const nextList = [...bonusList];
    const [movedBonus] = nextList.splice(currentIndex, 1);
    nextList.splice(targetIndex, 0, movedBonus);

    await commitBonusList(nextList, 'Bonus order updated.');
  };

  const handleBonusRemove = async (bonusId) => {
    const nextList = bonusList.filter((bonus) => bonus.id !== bonusId);
    await commitBonusList(nextList, 'Bonus removed from the hunt.');
  };

  const handleBonusOpenedToggle = async (bonusId, checked) => {
    const nextList = bonusList.map((bonus) => (
      bonus.id === bonusId
        ? { ...bonus, opened: checked || normalizeNumber(bonus.payout, 0) > 0 }
        : bonus
    ));

    await commitBonusList(nextList, 'Bonus state updated.');
  };

  const handleBonusPayoutChange = (bonusId, value) => {
    const payout = value === '' ? '' : value;

    setBonusList((currentList) => currentList.map((bonus) => {
      if (bonus.id !== bonusId) {
        return bonus;
      }

      const numericPayout = payout === '' ? 0 : normalizeNumber(payout, 0);
      return {
        ...bonus,
        payout: numericPayout,
        result: numericPayout,
        opened: bonus.opened || numericPayout > 0,
      };
    }));
  };

  const handleBonusPayoutBlur = async () => {
    await persistBonusHunt({ bonusList }, 'Bonus results saved.');
  };

  const handleSlotFormField = (field, value) => {
    setSlotForm((current) => ({ ...current, [field]: value }));
  };

  const handleScrapeSlot = async () => {
    const name = slotForm.name.trim();

    if (!name) {
      setSlotActionState({ tone: 'error', message: 'Enter a slot name before scraping.' });
      return;
    }

    setSlotScraping(true);
    setSlotActionState({ tone: 'idle', message: '' });

    try {
      const response = await fetch('/api/slots/scrape', {
        method: 'POST',
        headers: await getAuthorizedHeaders(),
        body: JSON.stringify({ name, provider: slotForm.provider.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to scrape the slot metadata.');
      }

      const scrapedSlot = payload.slot || {};
      const images = uniqueImages([
        scrapedSlot.image,
        ...(payload.imageCandidates || []),
      ]);

      setSlotForm((current) => ({
        ...current,
        name: scrapedSlot.name || current.name,
        provider: scrapedSlot.provider || current.provider,
        image: scrapedSlot.image || current.image,
        rtp: scrapedSlot.rtp !== null && scrapedSlot.rtp !== undefined ? asInputValue(scrapedSlot.rtp) : current.rtp,
        volatility: scrapedSlot.volatility || current.volatility,
        max_win_multiplier:
          scrapedSlot.max_win_multiplier !== null && scrapedSlot.max_win_multiplier !== undefined
            ? asInputValue(scrapedSlot.max_win_multiplier)
            : current.max_win_multiplier,
        sourceUrl: scrapedSlot.sourceUrl || current.sourceUrl,
        sourceTitle: scrapedSlot.sourceTitle || current.sourceTitle,
        imageCandidates: images,
      }));

      setSlotActionState({ tone: 'success', message: 'Slot details scraped. Review them before adding the slot.' });
    } catch (error) {
      setSlotActionState({ tone: 'error', message: error.message || 'Slot scrape failed.' });
    } finally {
      setSlotScraping(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!slotForm.name.trim() || !slotForm.provider.trim() || !slotForm.image.trim()) {
      setSlotActionState({ tone: 'error', message: 'Name, provider, and image are required before adding a slot.' });
      return;
    }

    setSlotSaving(true);
    setSlotActionState({ tone: 'idle', message: '' });

    try {
      const response = await fetch('/api/slots/create', {
        method: 'POST',
        headers: await getAuthorizedHeaders(),
        body: JSON.stringify({
          slot: {
            name: slotForm.name.trim(),
            provider: slotForm.provider.trim(),
            image: slotForm.image.trim(),
            rtp: slotForm.rtp,
            volatility: slotForm.volatility.trim(),
            max_win_multiplier: slotForm.max_win_multiplier,
            sourceUrl: slotForm.sourceUrl,
            sourceTitle: slotForm.sourceTitle,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add the slot to the library.');
      }

      invalidateCache();
      if (typeof refreshSlots === 'function') {
        await refreshSlots();
      }

      if (payload.slot) {
        setSelectedSlot(payload.slot);
        setSlotSearch(payload.slot.name || '');
        setShowSlotSuggestions(false);
      }

      setSlotForm(EMPTY_SLOT_FORM);
      setSlotActionState({
        tone: 'success',
        message: payload.mode === 'updated'
          ? 'Slot library entry updated and selected for the current hunt.'
          : 'Slot added to the library and selected for the current hunt.',
      });
    } catch (error) {
      setSlotActionState({ tone: 'error', message: error.message || 'Failed to create the slot.' });
    } finally {
      setSlotSaving(false);
    }
  };

  return (
    <div className="bonus-hunt-workspace">
      {saveState.message ? (
        <div className={`bonus-hunt-banner bonus-hunt-banner--${saveState.tone}`}>
          {saveState.message}
        </div>
      ) : null}

      <div className="bonus-hunt-stats-grid">
        <article className="bonus-hunt-stat-card">
          <span>Configured Bonuses</span>
          <strong>{bonusList.length}</strong>
          <small>{summary.opened} opened so far</small>
        </article>
        <article className="bonus-hunt-stat-card">
          <span>Total Bet</span>
          <strong>EUR {formatMoney(summary.totalBet)}</strong>
          <small>Current stake across the hunt</small>
        </article>
        <article className="bonus-hunt-stat-card">
          <span>Total Payout</span>
          <strong>EUR {formatMoney(summary.totalPayout)}</strong>
          <small>Saved from the inline result inputs</small>
        </article>
        <article className="bonus-hunt-stat-card">
          <span>Library Size</span>
          <strong>{slots.length.toLocaleString()}</strong>
          <small>{summary.profit >= 0 ? 'Positive' : 'Negative'} hunt delta: EUR {formatMoney(summary.profit)}</small>
        </article>
      </div>

      <div className="bonus-hunt-layout">
        <div className="bonus-hunt-main-column">
          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Hunt Workspace</span>
                <h3>Dedicated page setup</h3>
                <p>Configure the bankroll, save the hunt metadata, and keep the tracker enabled from a real page instead of a nested widget card.</p>
              </div>
              <label className="bonus-hunt-toggle bonus-hunt-toggle--hero">
                <span>{enabled ? 'Enabled' : 'Disabled'}</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={enabled} onChange={(event) => handleEnabledToggle(event.target.checked)} />
                  <span className="slider"></span>
                </label>
              </label>
            </div>

            <div className="bonus-hunt-field-grid">
              <label className="bonus-hunt-field">
                <span>Start Money (EUR)</span>
                <input type="number" value={startMoney} onChange={(event) => setStartMoney(event.target.value)} />
              </label>
              <label className="bonus-hunt-field">
                <span>Target Money (EUR)</span>
                <input type="number" value={targetMoney} onChange={(event) => setTargetMoney(event.target.value)} />
              </label>
              <label className="bonus-hunt-field">
                <span>Stop Loss (EUR)</span>
                <input type="number" value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} />
              </label>
              <label className="bonus-hunt-field">
                <span>Hunt Number</span>
                <input type="text" value={huntNumber} onChange={(event) => setHuntNumber(event.target.value)} placeholder="e.g. 42" />
              </label>
              <label className="bonus-hunt-field bonus-hunt-field--wide">
                <span>Casino / Session Label</span>
                <input type="text" value={casinoName} onChange={(event) => setCasinoName(event.target.value)} placeholder="Casino, sponsor, or stream label" />
              </label>
            </div>

            <div className="bonus-hunt-toolbar">
              <div className="bonus-hunt-toggle-row">
                <label className="bonus-hunt-toggle">
                  <span>Show Statistics</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={showStatistics} onChange={(event) => handleStatisticsToggle(event.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </label>
                <label className="bonus-hunt-toggle">
                  <span>Animated Tracker</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={animatedTracker} onChange={(event) => handleAnimationToggle(event.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </label>
              </div>

              <div className="bonus-hunt-action-row">
                <button className="oc-btn-secondary" type="button" onClick={handleSetupSave}>
                  Save Hunt Setup
                </button>
                <button className="oc-btn-secondary" type="button" onClick={handleArchiveHunt}>
                  Save To History
                </button>
                <button className="bonus-hunt-delete-btn" type="button" onClick={handleResetActiveHunt}>
                  Reset Active Hunt
                </button>
              </div>
            </div>
          </section>

          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Add Bonus</span>
                <h3>Build the live hunt list</h3>
                <p>Search the slot library, attach stake size and bonus type, then add the entry directly into the hunt order.</p>
              </div>
            </div>

            <div className="bonus-hunt-add-grid">
              <div className="bonus-hunt-search">
                <span>Slot Search</span>
                <div className="slot-search-wrapper">
                  <input
                    type="text"
                    value={selectedSlot ? selectedSlot.name : slotSearch}
                    onChange={(event) => {
                      setSelectedSlot(null);
                      setSlotSearch(event.target.value);
                      setShowSlotSuggestions(true);
                    }}
                    onFocus={() => setShowSlotSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowSlotSuggestions(false), 140)}
                    placeholder={`Search ${slots.length.toLocaleString()} slots...`}
                  />
                  {showSlotSuggestions && slotSearch.trim() ? (
                    <div className="slot-suggestions">
                      {filteredSlots.length ? (
                        filteredSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="slot-suggestion"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSlotSearch(slot.name);
                              setShowSlotSuggestions(false);
                            }}
                          >
                            <img src={slot.image || DEFAULT_SLOT_IMAGE} alt={slot.name} />
                            <div>
                              <div className="slot-name">{slot.name}</div>
                              <div className="slot-provider">{slot.provider || 'Unknown provider'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-results">No slot matched that search. Use the scraper panel to add it first.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="bonus-hunt-field">
                <span>Bet Size</span>
                <input type="number" value={betSize} onChange={(event) => setBetSize(event.target.value)} step="0.01" min="0" placeholder="0.20" />
              </label>
            </div>

            <div className="bonus-hunt-toolbar">
              <div className="bonus-hunt-badge-row">
                <label className="bonus-hunt-pill-toggle">
                  <input type="checkbox" checked={isSuperBonus} onChange={(event) => setIsSuperBonus(event.target.checked)} />
                  <span>Super Bonus</span>
                </label>
                <label className="bonus-hunt-pill-toggle">
                  <input type="checkbox" checked={isExtremeBonus} onChange={(event) => setIsExtremeBonus(event.target.checked)} />
                  <span>Extreme Bonus</span>
                </label>
              </div>

              <button className="add-bonus-btn" type="button" onClick={handleAddBonus}>
                Add Bonus To Hunt
              </button>
            </div>

            {selectedSlot ? (
              <div className="bonus-hunt-selected-slot">
                <img src={selectedSlot.image || DEFAULT_SLOT_IMAGE} alt={selectedSlot.name} />
                <div>
                  <strong>{selectedSlot.name}</strong>
                  <span>{selectedSlot.provider || 'Unknown provider'}</span>
                  <small>This slot will be pushed into the hunt when you click the add button.</small>
                </div>
              </div>
            ) : null}
          </section>

          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Bonus List</span>
                <h3>Track order and results inline</h3>
                <p>Reorder bonuses, mark them open, and save payouts without leaving the page.</p>
              </div>
            </div>

            {bonusList.length ? (
              <div className="bonus-hunt-list">
                {bonusList.map((bonus, index) => (
                  <article key={bonus.id} className={`bonus-hunt-item ${bonus.opened ? 'bonus-hunt-item--opened' : ''}`}>
                    <img src={bonus.slot?.image || DEFAULT_SLOT_IMAGE} alt={bonus.slotName} />

                    <div className="bonus-hunt-item__body">
                      <div className="bonus-hunt-item__title">
                        <strong>{bonus.slotName}</strong>
                        <span>{bonus.slot?.provider || 'Unknown provider'}</span>
                      </div>

                      <div className="bonus-hunt-item__meta">
                        <span>Stake EUR {formatMoney(bonus.betSize)}</span>
                        {bonus.isSuperBonus ? <span className="bonus-hunt-chip">Super</span> : null}
                        {bonus.isExtremeBonus ? <span className="bonus-hunt-chip bonus-hunt-chip--danger">Extreme</span> : null}
                      </div>
                    </div>

                    <label className="bonus-hunt-item__payout">
                      <span>Payout</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bonus.payout === 0 ? '' : bonus.payout}
                        onChange={(event) => handleBonusPayoutChange(bonus.id, event.target.value)}
                        onBlur={handleBonusPayoutBlur}
                        placeholder="0.00"
                      />
                    </label>

                    <div className="bonus-hunt-item__actions">
                      <label className="bonus-hunt-item__open-toggle">
                        <input
                          type="checkbox"
                          checked={bonus.opened}
                          onChange={(event) => handleBonusOpenedToggle(bonus.id, event.target.checked)}
                        />
                        <span>Opened</span>
                      </label>

                      <div className="bonus-hunt-item__buttons">
                        <button type="button" className="oc-btn-secondary" onClick={() => handleBonusMove(bonus.id, -1)} disabled={index === 0}>
                          Move Up
                        </button>
                        <button type="button" className="oc-btn-secondary" onClick={() => handleBonusMove(bonus.id, 1)} disabled={index === bonusList.length - 1}>
                          Move Down
                        </button>
                        <button type="button" className="bonus-hunt-delete-btn" onClick={() => handleBonusRemove(bonus.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bonus-hunt-empty-state">
                No bonuses configured yet. Build the list from the library search above.
              </div>
            )}
          </section>
        </div>

        <div className="bonus-hunt-side-column">
          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Slot Scraper</span>
                <h3>Add missing slots to the library</h3>
                <p>The old pending queue is not present in this extract, so scraped or manual slots are added directly to your shared slots table.</p>
              </div>
            </div>

            <div className="bonus-hunt-field-grid bonus-hunt-field-grid--stacked">
              <label className="bonus-hunt-field">
                <span>Slot Name</span>
                <input type="text" value={slotForm.name} onChange={(event) => handleSlotFormField('name', event.target.value)} placeholder="Wanted Dead or a Wild" />
              </label>
              <label className="bonus-hunt-field">
                <span>Provider</span>
                <input type="text" value={slotForm.provider} onChange={(event) => handleSlotFormField('provider', event.target.value)} placeholder="Hacksaw Gaming" />
              </label>
              <label className="bonus-hunt-field bonus-hunt-field--wide">
                <span>Image URL</span>
                <input type="text" value={slotForm.image} onChange={(event) => handleSlotFormField('image', event.target.value)} placeholder="https://.../slot-image.webp" />
              </label>
              <label className="bonus-hunt-field">
                <span>RTP</span>
                <input type="number" step="0.01" value={slotForm.rtp} onChange={(event) => handleSlotFormField('rtp', event.target.value)} placeholder="96.15" />
              </label>
              <label className="bonus-hunt-field">
                <span>Volatility</span>
                <input type="text" value={slotForm.volatility} onChange={(event) => handleSlotFormField('volatility', event.target.value)} placeholder="High" />
              </label>
              <label className="bonus-hunt-field">
                <span>Max Win (x)</span>
                <input type="number" step="1" value={slotForm.max_win_multiplier} onChange={(event) => handleSlotFormField('max_win_multiplier', event.target.value)} placeholder="10000" />
              </label>
            </div>

            <div className="bonus-hunt-toolbar">
              <button className="oc-btn-secondary" type="button" onClick={handleScrapeSlot} disabled={slotScraping}>
                {slotScraping ? 'Scraping...' : 'Scrape Details'}
              </button>
              <button className="oc-btn-primary" type="button" onClick={handleCreateSlot} disabled={slotSaving}>
                {slotSaving ? 'Adding Slot...' : 'Add Slot To Library'}
              </button>
            </div>

            {slotActionState.message ? (
              <div className={`bonus-hunt-banner bonus-hunt-banner--${slotActionState.tone}`}>
                {slotActionState.message}
              </div>
            ) : null}

            {slotForm.sourceUrl ? (
              <a className="bonus-hunt-source-link" href={slotForm.sourceUrl} target="_blank" rel="noreferrer">
                Source: {slotForm.sourceTitle || slotForm.sourceUrl}
              </a>
            ) : null}

            {slotForm.image ? (
              <div className="bonus-hunt-image-preview">
                <img src={slotForm.image} alt={slotForm.name || 'Slot preview'} />
              </div>
            ) : null}

            {slotForm.imageCandidates?.length ? (
              <div className="bonus-hunt-image-grid">
                {slotForm.imageCandidates.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={`bonus-hunt-image-option ${slotForm.image === image ? 'bonus-hunt-image-option--selected' : ''}`}
                    onClick={() => handleSlotFormField('image', image)}
                  >
                    <img src={image} alt="Slot candidate" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Saved Hunts</span>
                <h3>Archive and reload past runs</h3>
                <p>This replaces the old history service with overlay-backed snapshots, so you can close a hunt and bring it back later without extra tables.</p>
              </div>
            </div>

            {huntHistory.length ? (
              <div className="bonus-hunt-history-list">
                {huntHistory.map((entry) => (
                  <article key={entry.id} className="bonus-hunt-history-item">
                    <div className="bonus-hunt-history-item__header">
                      <div>
                        <strong>{entry.label}</strong>
                        <span>{new Date(entry.savedAt).toLocaleString()}</span>
                      </div>
                      <span className="bonus-hunt-chip">{entry.bonusCount} bonuses</span>
                    </div>

                    <div className="bonus-hunt-history-item__stats">
                      <span>Start EUR {formatMoney(entry.startMoney)}</span>
                      <span>Bet EUR {formatMoney(entry.totalBet)}</span>
                      <span>Payout EUR {formatMoney(entry.totalPayout)}</span>
                      <span>{entry.profit >= 0 ? 'Profit' : 'Loss'} EUR {formatMoney(entry.profit)}</span>
                    </div>

                    <div className="bonus-hunt-history-item__actions">
                      <button className="oc-btn-secondary" type="button" onClick={() => handleLoadHistoryEntry(entry)}>
                        Load Hunt
                      </button>
                      <button className="bonus-hunt-delete-btn" type="button" onClick={() => handleDeleteHistoryEntry(entry.id)}>
                        Delete Snapshot
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bonus-hunt-empty-state">
                No saved hunts yet. Use Save To History after a run to keep a reusable snapshot here.
              </div>
            )}
          </section>

          <section className="bonus-hunt-panel">
            <div className="bonus-hunt-panel__header">
              <div>
                <span className="bonus-hunt-eyebrow">Workflow</span>
                <h3>What this page restores</h3>
                <p>The old Bonus Hunt flow relied on a dedicated panel with its own slot intake. This page brings that split back instead of nesting everything inside the Widgets catalog card.</p>
              </div>
            </div>

            <ul className="bonus-hunt-note-list">
              <li>Search the current slot library and add bonuses directly into the hunt list.</li>
              <li>Scrape metadata for missing slots, then save them straight into the slots table.</li>
              <li>Track payout results inline so the page behaves like a control surface instead of a popup.</li>
            </ul>

            <div className="bonus-hunt-summary-card">
              <span className="bonus-hunt-eyebrow">Current Session</span>
              <strong>{casinoName || 'Unnamed Hunt'}</strong>
              <small>Hunt #{huntNumber || 'not set'} • Start EUR {formatMoney(startMoney || 0)} • Target EUR {formatMoney(targetMoney || 0)}</small>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}